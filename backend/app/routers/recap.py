import logging
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from ..auth import require_trip_member
from ..config import settings
from ..db import get_db
from ..observability import traced
from ..services import recap
from ..storage import get_storage

router = APIRouter(prefix="/trips/{trip_id}", tags=["recap"])


@router.post("/recap")
def create_recap(trip_id: str, trip: dict = Depends(require_trip_member)):
    db = get_db()
    oid = trip["_id"]
    events = list(db.events.find({"trip_id": oid}).sort("order", 1))
    if not events:
        raise HTTPException(status_code=409, detail="Organize your photos first")

    with traced(
        op="gen_ai.invoke_agent",
        name=f"invoke_agent {recap.NARRATOR}",
        attributes={
            "gen_ai.operation.name": "invoke_agent",
            "gen_ai.agent.name": recap.NARRATOR,
            "gen_ai.pipeline.name": "trip-recap",
            "trip_id": trip_id,
            "moments": len(events),
        },
    ):
        script, ai_written = recap.write_script(trip["name"], events)

        audio_url, audio_error = None, None
        if not settings.elevenlabs_api_key:
            audio_error = "Add ELEVENLABS_API_KEY to hear this narrated."
        else:
            try:
                audio = recap.synthesize(script)
                url = get_storage().put(f"trips/{trip_id}/recap.mp3", audio, "audio/mpeg")
                audio_url = f"{url}?v={int(time.time())}"  # bust the cache when regenerated
            except recap.ElevenLabsError as exc:
                audio_error = str(exc)
            except Exception as exc:
                logging.warning("Recap audio failed: %s", exc)
                audio_error = "Could not generate the audio. Try again."

    doc = {
        "script": script,
        "ai_written": ai_written,
        "audio_url": audio_url,
        "audio_error": audio_error,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    db.trips.update_one({"_id": oid}, {"$set": {"recap": doc}})
    return doc
