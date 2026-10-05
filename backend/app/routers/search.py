import logging

import numpy as np
from fastapi import APIRouter, Depends, Query

from ..auth import require_trip_member
from ..config import settings
from ..db import VECTOR_INDEX, get_db, serialize
from ..observability import traced
from ..services import embed
from ..services.search import top_k

router = APIRouter(prefix="/trips/{trip_id}", tags=["search"])


def _atlas_search(db, oid, vector: list[float], limit: int) -> list[dict]:
    return list(
        db.photos.aggregate(
            [
                {
                    "$vectorSearch": {
                        "index": VECTOR_INDEX,
                        "path": "embedding",
                        "queryVector": vector,
                        "numCandidates": max(200, limit * 10),
                        "limit": limit,
                        "filter": {"trip_id": oid},
                    }
                },
                {"$addFields": {"score": {"$meta": "vectorSearchScore"}}},
                {"$unset": "embedding"},
            ]
        )
    )


def _local_search(db, oid, vector: list[float], limit: int) -> list[dict]:
    """Used while the Atlas index is still building, or if it is unavailable."""
    docs = list(db.photos.find({"trip_id": oid, "embedding": {"$ne": None}}))
    if not docs:
        return []
    matrix = np.array([d["embedding"] for d in docs], dtype=np.float32)
    out = []
    for i, score in top_k(matrix, np.array(vector, dtype=np.float32), limit):
        doc = {k: v for k, v in docs[i].items() if k != "embedding"}
        doc["score"] = score
        out.append(doc)
    return out


@router.get("/search")
def search_photos(
    q: str = Query(min_length=1, max_length=200),
    limit: int = Query(24, ge=1, le=100),
    trip: dict = Depends(require_trip_member),
):
    db = get_db()
    oid = trip["_id"]

    with traced(
        op="gen_ai.embeddings",
        name=f"embeddings {settings.clip_model}",
        attributes={
            "gen_ai.operation.name": "embeddings",
            "gen_ai.request.model": settings.clip_model,
            "gen_ai.provider.name": "sentence-transformers",
        },
    ):
        vector = embed.embed_text(q.strip()).tolist()

    method = "atlas"
    with traced(op="db", name="atlas $vectorSearch", attributes={"limit": limit}) as span:
        try:
            docs = _atlas_search(db, oid, vector, limit)
        except Exception as exc:
            logging.warning("Atlas vector search failed: %s", exc)
            span.set_status("internal_error")
            docs = []
        if not docs:
            method = "local"
            docs = _local_search(db, oid, vector, limit)
        span.set_data("method", method)
        span.set_data("results", len(docs))

    return {"query": q, "method": method, "results": [serialize(d) for d in docs]}
