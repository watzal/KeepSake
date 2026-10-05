"""Organize a trip: embed new photos, cluster them into events, name each event."""
import contextvars
import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

import numpy as np
import sentry_sdk
from bson import ObjectId
from pymongo.database import Database

from ..config import settings
from ..db import get_db
from ..observability import AGENT_NAME, traced
from ..storage import get_storage
from .cluster import cluster_photos, representatives
from .embed import embed_images
from .naming import name_cluster

EMBED_BATCH = 16
NAMING_WORKERS = 6


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _progress(db: Database, trip_id: ObjectId, stage: str, done: int = 0, total: int = 0) -> None:
    db.trips.update_one(
        {"_id": trip_id},
        {
            "$set": {
                "processing.stage": stage,
                "processing.done": done,
                "processing.total": total,
                "processing.updated_at": _now(),
            }
        },
    )


def _thumb(trip_id: ObjectId, photo: dict) -> bytes:
    return get_storage().get(f"trips/{trip_id}/{photo['sha256']}_thumb.jpg")


def _embed_missing(db: Database, trip_id: ObjectId) -> None:
    pending = list(db.photos.find({"trip_id": trip_id, "embedding": None}, {"sha256": 1}))
    _progress(db, trip_id, "embedding", 0, len(pending))
    for start in range(0, len(pending), EMBED_BATCH):
        chunk = pending[start : start + EMBED_BATCH]
        ids, blobs = [], []
        with traced(
            op="gen_ai.embeddings",
            name=f"embeddings {settings.clip_model}",
            attributes={
                "gen_ai.operation.name": "embeddings",
                "gen_ai.request.model": settings.clip_model,
                "gen_ai.provider.name": "sentence-transformers",
                "gen_ai.agent.name": AGENT_NAME,
                "photos_in_batch": len(chunk),
            },
        ):
            for photo in chunk:
                try:
                    blobs.append(_thumb(trip_id, photo))
                    ids.append(photo["_id"])
                except Exception as exc:  # a missing thumbnail should not stop the whole run
                    logging.warning("Could not read thumbnail for photo %s: %s", photo["_id"], exc)
            vectors = embed_images(blobs) if blobs else []
        with traced(op="db", name="mongodb save embeddings", attributes={"photos": len(ids)}):
            for photo_id, vector in zip(ids, vectors):
                db.photos.update_one({"_id": photo_id}, {"$set": {"embedding": vector.tolist()}})
        _progress(db, trip_id, "embedding", min(start + EMBED_BATCH, len(pending)), len(pending))


def _name(trip_id: ObjectId, photos: list[dict], reps: list[int], start: datetime | None) -> tuple[str, str] | None:
    images = []
    for i in reps:
        try:
            images.append(_thumb(trip_id, photos[i]))
        except Exception as exc:
            logging.warning("Could not read thumbnail for photo %s: %s", photos[i]["_id"], exc)
    if not images:
        return None
    hint = f"They were taken around {start:%d %B %Y, %H:%M}." if start else ""
    return name_cluster(images, hint)


def _build_events(db: Database, trip_id: ObjectId, root) -> None:
    _progress(db, trip_id, "clustering")
    photos = list(
        db.photos.find(
            {"trip_id": trip_id, "embedding": {"$type": "array"}},
            {"embedding": 1, "taken_at": 1, "contributor": 1, "sha256": 1},
        )
    )
    root.set_data("photo_count", len(photos))
    events = []
    if photos:
        embeddings = np.array([p["embedding"] for p in photos], dtype=np.float32)
        with traced(
            op="gen_ai.execute_tool",
            name="execute_tool cluster_photos",
            attributes={
                "gen_ai.operation.name": "execute_tool",
                "gen_ai.agent.name": AGENT_NAME,
                "gen_ai.tool.name": "cluster_photos",
                "gen_ai.tool.description": "HDBSCAN over CLIP embeddings plus shooting time",
            },
        ) as tool:
            labels = cluster_photos(embeddings, [p.get("taken_at") for p in photos])
            tool.set_data(
                "gen_ai.tool.call.result",
                json.dumps({"photos": len(photos), "clusters": len(set(labels.tolist()))}),
            )

        groups = []
        for label in sorted(set(labels.tolist())):
            members = np.flatnonzero(labels == label)
            times = sorted(photos[i]["taken_at"] for i in members if photos[i].get("taken_at"))
            groups.append((members, times))
        groups.sort(key=lambda g: g[1][0] if g[1] else datetime.max)  # earliest moment first
        root.set_data("moment_count", len(groups))

        # name the moments side by side, since each one is a slow call to Gemma
        _progress(db, trip_id, "naming", 0, len(groups))
        all_reps = [representatives(embeddings, members) for members, _ in groups]
        with ThreadPoolExecutor(max_workers=NAMING_WORKERS) as pool:
            jobs = [
                # each job gets a copy of the context so its Sentry span joins this trace
                pool.submit(
                    contextvars.copy_context().run, _name, trip_id, photos, reps, times[0] if times else None
                )
                for reps, (_, times) in zip(all_reps, groups)
            ]
            for done, _ in enumerate(as_completed(jobs), start=1):
                _progress(db, trip_id, "naming", done, len(groups))

        for order, ((members, times), reps, job) in enumerate(zip(groups, all_reps, jobs)):
            start = times[0] if times else None
            named = job.result()
            name, description = named or (f"Moment {order + 1}", "")
            events.append(
                {
                    "trip_id": trip_id,
                    "order": order,
                    "name": name,
                    "description": description,
                    "photo_count": len(members),
                    "contributors": sorted({photos[i]["contributor"] for i in members}),
                    "start_time": start,
                    "end_time": times[-1] if times else None,
                    "rep_photo_ids": [str(photos[i]["_id"]) for i in reps],
                    "named_by_ai": named is not None,
                    "created_at": _now(),
                    "photo_ids": [photos[i]["_id"] for i in members],
                }
            )

    # swap the old events for the new ones only once everything is named
    with traced(op="db", name="mongodb save moments", attributes={"moments": len(events)}):
        db.events.delete_many({"trip_id": trip_id})
        db.photos.update_many({"trip_id": trip_id}, {"$set": {"event_id": None}})
        for event in events:
            photo_ids = event.pop("photo_ids")
            event_id = db.events.insert_one(event).inserted_id
            db.photos.update_many({"_id": {"$in": photo_ids}}, {"$set": {"event_id": event_id}})


def run_pipeline(trip_id: ObjectId) -> None:
    db = get_db()
    with traced(
        op="gen_ai.invoke_agent",
        name=f"invoke_agent {AGENT_NAME}",
        attributes={
            "gen_ai.operation.name": "invoke_agent",
            "gen_ai.agent.name": AGENT_NAME,
            "gen_ai.pipeline.name": "organize-trip",
            "trip_id": str(trip_id),
        },
    ) as root:
        try:
            _embed_missing(db, trip_id)
            _build_events(db, trip_id, root)
        except Exception as exc:
            root.set_status("internal_error")
            root.set_data("error.type", type(exc).__name__)
            sentry_sdk.capture_exception(exc)
            logging.exception("Pipeline failed for trip %s", trip_id)
            db.trips.update_one(
                {"_id": trip_id},
                {
                    "$set": {
                        "processing.status": "failed",
                        "processing.error": str(exc)[:300],
                        "processing.updated_at": _now(),
                    }
                },
            )
            return
        db.trips.update_one(
            {"_id": trip_id},
            {"$set": {"processing.status": "done", "processing.updated_at": _now()}},
        )
