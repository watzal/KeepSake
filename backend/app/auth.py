"""Clerk session verification and trip membership checks."""
import base64
from functools import lru_cache

import jwt
from fastapi import Depends, Header, HTTPException
from jwt import PyJWKClient

from .config import settings
from .db import get_db, to_object_id


def clerk_issuer() -> str:
    """The Clerk frontend API URL that signs session tokens."""
    if settings.clerk_issuer:
        return settings.clerk_issuer.rstrip("/")
    key = settings.clerk_publishable_key
    if key:
        try:
            encoded = key.split("_", 2)[2]
            host = base64.b64decode(encoded + "=" * (-len(encoded) % 4)).decode().rstrip("$")
            if host:
                return f"https://{host}"
        except Exception:
            pass
    return ""


@lru_cache
def _jwks_client(url: str) -> PyJWKClient:
    return PyJWKClient(url)


def get_user_id(authorization: str | None = Header(default=None)) -> str:
    issuer = clerk_issuer()
    if not issuer:
        raise HTTPException(status_code=500, detail="Sign-in is not configured on the server. Set CLERK_PUBLISHABLE_KEY.")
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Sign in to continue")
    token = authorization.split(" ", 1)[1].strip()
    try:
        key = _jwks_client(f"{issuer}/.well-known/jwks.json").get_signing_key_from_jwt(token).key
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=issuer,
            leeway=10,
            options={"require": ["exp", "iss", "sub"], "verify_aud": False},
        )
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Your session is invalid or expired. Sign in again.")
    return claims["sub"]


def require_trip_member(trip_id: str, user_id: str = Depends(get_user_id)) -> dict:
    """Loads the trip, but only for people who belong to it (404 for everyone else)."""
    trip = get_db().trips.find_one({"_id": to_object_id(trip_id), "members.user_id": user_id})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


def member_name(trip: dict, user_id: str) -> str:
    return next((m["name"] for m in trip["members"] if m["user_id"] == user_id), "Traveler")
