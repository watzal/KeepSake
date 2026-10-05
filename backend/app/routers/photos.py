import mimetypes
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile
from pymongo.errors import DuplicateKeyError

from ..auth import get_user_id, member_name, require_trip_member
from ..config import settings
from ..db import get_db, serialize
from ..services.ingest import InvalidImage, process_image
from ..storage import get_storage

router = APIRouter(prefix="/trips/{trip_id}/photos", tags=["photos"])


@router.post("")
def upload_photos(
    trip_id: str,
    files: list[UploadFile] = File(...),
    trip: dict = Depends(require_trip_member),
    user_id: str = Depends(get_user_id),
):
    db = get_db()
    oid = trip["_id"]
    contributor = member_name(trip, user_id)

    storage = get_storage()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    saved, duplicates, failed = [], [], []

    for upload in files:
        name = upload.filename or "photo"
        data = upload.file.read()
        if len(data) > max_bytes:
            failed.append({"filename": name, "reason": f"Larger than {settings.max_upload_mb} MB"})
            continue
        try:
            processed = process_image(data)
        except InvalidImage as exc:
            failed.append({"filename": name, "reason": str(exc)})
            continue

        if db.photos.find_one({"trip_id": oid, "sha256": processed.sha256}, {"_id": 1}):
            duplicates.append(name)
            continue

        ext = Path(name).suffix.lower() or ".jpg"
        base = f"trips/{trip_id}/{processed.sha256}"
        content_type = upload.content_type or mimetypes.guess_type(name)[0] or "image/jpeg"
        url = storage.put(f"{base}{ext}", data, content_type)
        thumb_url = storage.put(f"{base}_thumb.jpg", processed.thumb_bytes, "image/jpeg")

        doc = {
            "trip_id": oid,
            "contributor": contributor,
            "uploaded_by": user_id,
            "filename": name,
            "sha256": processed.sha256,
            "url": url,
            "thumb_url": thumb_url,
            "width": processed.width,
            "height": processed.height,
            "taken_at": processed.taken_at,
            "gps": processed.gps,
            "embedding": None,
            "event_id": None,
            "created_at": datetime.now(timezone.utc),
        }
        try:
            doc["_id"] = db.photos.insert_one(doc).inserted_id
        except DuplicateKeyError:
            duplicates.append(name)
            continue
        saved.append(serialize(doc))

    return {"saved": saved, "duplicates": duplicates, "failed": failed}


@router.get("")
def list_photos(trip: dict = Depends(require_trip_member), limit: int = 500):
    cursor = (
        get_db()
        .photos.find({"trip_id": trip["_id"]}, {"embedding": 0})
        .sort([("taken_at", 1), ("created_at", 1)])
        .limit(min(limit, 2000))
    )
    return [serialize(p) for p in cursor]
