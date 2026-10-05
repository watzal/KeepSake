import secrets
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..auth import get_user_id, require_trip_member
from ..db import get_db, serialize

router = APIRouter(prefix="/trips", tags=["trips"])


def _name(value: str | None) -> str:
    return (value or "").strip()[:80] or "Traveler"


class TripCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    start_date: date | None = None
    end_date: date | None = None
    display_name: str | None = None


class JoinRequest(BaseModel):
    token: str = Field(min_length=8, max_length=100)
    display_name: str | None = None


def _view(trip: dict, user_id: str, photo_count: int, contributors: list[str]) -> dict:
    out = serialize({k: v for k, v in trip.items() if k not in {"members", "owner_id"}})
    out["members"] = [
        {"name": m["name"], "role": m["role"], "is_me": m["user_id"] == user_id} for m in trip["members"]
    ]
    out["photo_count"] = photo_count
    out["contributors"] = contributors
    return out


@router.post("", status_code=201)
def create_trip(body: TripCreate, user_id: str = Depends(get_user_id)):
    now = datetime.now(timezone.utc)
    doc = {
        "name": body.name.strip(),
        "start_date": body.start_date.isoformat() if body.start_date else None,
        "end_date": body.end_date.isoformat() if body.end_date else None,
        "owner_id": user_id,
        "invite_token": secrets.token_urlsafe(16),
        "members": [{"user_id": user_id, "name": _name(body.display_name), "role": "owner", "joined_at": now}],
        "created_at": now,
    }
    doc["_id"] = get_db().trips.insert_one(doc).inserted_id
    return _view(doc, user_id, 0, [])


@router.get("")
def list_trips(user_id: str = Depends(get_user_id)):
    db = get_db()
    trips = db.trips.find({"members.user_id": user_id}).sort("created_at", -1)
    return [
        {
            "id": str(t["_id"]),
            "name": t["name"],
            "photo_count": db.photos.count_documents({"trip_id": t["_id"]}),
            "member_count": len(t["members"]),
        }
        for t in trips
    ]


@router.post("/join")
def join_trip(body: JoinRequest, user_id: str = Depends(get_user_id)):
    db = get_db()
    trip = db.trips.find_one({"invite_token": body.token})
    if not trip:
        raise HTTPException(status_code=404, detail="This invite link is not valid")
    if not any(m["user_id"] == user_id for m in trip["members"]):
        db.trips.update_one(
            {"_id": trip["_id"]},
            {
                "$push": {
                    "members": {
                        "user_id": user_id,
                        "name": _name(body.display_name),
                        "role": "member",
                        "joined_at": datetime.now(timezone.utc),
                    }
                }
            },
        )
    return {"id": str(trip["_id"])}


@router.get("/{trip_id}")
def get_trip(trip: dict = Depends(require_trip_member), user_id: str = Depends(get_user_id)):
    db = get_db()
    count = db.photos.count_documents({"trip_id": trip["_id"]})
    contributors = db.photos.distinct("contributor", {"trip_id": trip["_id"]})
    return _view(trip, user_id, count, contributors)
