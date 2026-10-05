import logging
from functools import lru_cache

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException
from pymongo import ASCENDING, MongoClient
from pymongo.database import Database
from pymongo.operations import SearchIndexModel

from .config import settings

VECTOR_INDEX = "photo_embedding"


@lru_cache
def get_client() -> MongoClient:
    return MongoClient(settings.mongodb_uri)


def get_db() -> Database:
    return get_client()[settings.mongodb_db]


def ensure_indexes() -> None:
    db = get_db()
    db.photos.create_index([("trip_id", ASCENDING), ("sha256", ASCENDING)], unique=True)
    db.photos.create_index([("trip_id", ASCENDING), ("taken_at", ASCENDING)])
    db.events.create_index([("trip_id", ASCENDING), ("order", ASCENDING)])


def ensure_vector_index() -> None:
    """Atlas Vector Search index on photo embeddings. Only works on Atlas, so failure is not fatal."""
    try:
        photos = get_db().photos
        if any(ix["name"] == VECTOR_INDEX for ix in photos.list_search_indexes()):
            return
        photos.create_search_index(
            SearchIndexModel(
                name=VECTOR_INDEX,
                type="vectorSearch",
                definition={
                    "fields": [
                        {"type": "vector", "path": "embedding", "numDimensions": 512, "similarity": "cosine"},
                        {"type": "filter", "path": "trip_id"},
                    ]
                },
            )
        )
    except Exception as exc:
        logging.warning("Could not create the vector search index: %s", exc)


def to_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Not found")


def serialize(doc: dict) -> dict:
    """Convert a Mongo document into JSON-friendly output."""
    out = {k: v for k, v in doc.items() if k not in {"_id", "embedding"}}
    out["id"] = str(doc["_id"])
    for key, value in list(out.items()):
        if isinstance(value, ObjectId):
            out[key] = str(value)
    return out
