from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pymongo import ReturnDocument

from ..auth import require_trip_member
from ..db import get_db, serialize
from ..services.pipeline import run_pipeline

router = APIRouter(prefix="/trips/{trip_id}", tags=["process"])

# a run that has not reported progress for this long is treated as dead (e.g. the server restarted)
STALE_AFTER = timedelta(minutes=10)


@router.post("/process", status_code=202)
def process_trip(background: BackgroundTasks, trip: dict = Depends(require_trip_member)):
    db = get_db()
    oid = trip["_id"]
    now = datetime.now(timezone.utc)
    started = db.trips.find_one_and_update(
        {
            "_id": oid,
            "$or": [
                {"processing.status": {"$ne": "running"}},
                {"processing.updated_at": {"$lt": now - STALE_AFTER}},
            ],
        },
        {
            "$set": {
                "processing": {
                    "status": "running",
                    "stage": "embedding",
                    "done": 0,
                    "total": 0,
                    "error": None,
                    "started_at": now,
                    "updated_at": now,
                }
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    if not started:
        raise HTTPException(status_code=409, detail="Photos are already being organized")

    background.add_task(run_pipeline, oid)
    return started["processing"]


@router.get("/events")
def list_events(trip: dict = Depends(require_trip_member)):
    db = get_db()
    oid = trip["_id"]
    photos_by_event: dict = {}
    cursor = db.photos.find({"trip_id": oid, "event_id": {"$ne": None}}, {"embedding": 0}).sort(
        [("taken_at", 1), ("created_at", 1)]
    )
    for photo in cursor:
        photos_by_event.setdefault(photo["event_id"], []).append(serialize(photo))

    return [
        {**serialize(event), "photos": photos_by_event.get(event["_id"], [])}
        for event in db.events.find({"trip_id": oid}).sort("order", 1)
    ]
