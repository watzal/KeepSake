"""Trip recap: Gemma writes a short narration, ElevenLabs reads it aloud."""
import json
import logging
import re

import httpx

from ..config import settings
from ..observability import traced
from . import naming

NARRATOR = "Keepsake Narrator"
MAX_CHARS = 1200  # keeps the audio around 70 seconds and the ElevenLabs credit use small

PROMPT = (
    "Write a warm, vivid narration of this group trip, about 90 to 120 words, to be read aloud as a short "
    "audio recap. Walk through the moments in order and mention a concrete detail from each. Plain spoken "
    "prose only: no lists, no headings, no emojis, no markdown, no stage directions. Do not invent facts "
    "that are not in the moments below.\n\nTrip: {trip}\nMoments:\n{moments}"
)


class ElevenLabsError(Exception):
    pass


def _moment_lines(events: list[dict]) -> str:
    lines = []
    for i, e in enumerate(events[:12], start=1):
        when = e["start_time"].strftime("%d %b") if e.get("start_time") else "undated"
        detail = e.get("description") or "no description"
        lines.append(f"{i}. {e['name']} ({when}, {e['photo_count']} photos): {detail}")
    return "\n".join(lines)


def fallback_script(trip_name: str, events: list[dict]) -> str:
    """Used when Gemma is unavailable, so the recap still works."""
    parts = [f"This is the story of {trip_name}."]
    for i, e in enumerate(events[:8]):
        opener = "It began with" if i == 0 else "Then came"
        description = (e.get("description") or "").strip()
        parts.append(f"{opener} {e['name']}." + (f" {description}" if description else ""))
    photos = sum(e["photo_count"] for e in events)
    people = len({c for e in events for c in e.get("contributors", [])})
    parts.append(f"{photos} photos from {people} {'person' if people == 1 else 'people'}, all in one place.")
    return clean_script(" ".join(parts))


def clean_script(text: str) -> str:
    text = re.sub(r"[*#`_>]+", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > MAX_CHARS:
        cut = text[:MAX_CHARS]
        end = max(cut.rfind(". "), cut.rfind("! "), cut.rfind("? "))
        text = cut[: end + 1] if end > 200 else cut
    return text


def write_script(trip_name: str, events: list[dict]) -> tuple[str, bool]:
    """Returns (script, written_by_gemma)."""
    prompt = PROMPT.format(trip=trip_name, moments=_moment_lines(events))
    local = settings.gemma_provider == "ollama"
    model = settings.gemma_model if local else settings.gemma_api_model

    with traced(
        op="gen_ai.chat",
        name=f"chat {model}",
        attributes={
            "gen_ai.operation.name": "chat",
            "gen_ai.request.model": model,
            "gen_ai.provider.name": "ollama" if local else "google",
            "gen_ai.agent.name": NARRATOR,
            "gen_ai.input.messages": json.dumps(
                [{"role": "user", "parts": [{"type": "text", "content": prompt}]}]
            ),
        },
    ) as span:
        try:
            if not local and not settings.google_api_key:
                span.set_data("skipped", "no GOOGLE_API_KEY")
                return fallback_script(trip_name, events), False
            text, usage = (
                naming._ask_ollama([], prompt, json_mode=False) if local else naming._ask_gemini_api([], prompt)
            )
            span.set_data("gen_ai.response.model", model)
            span.set_data(
                "gen_ai.output.messages",
                json.dumps([{"role": "assistant", "parts": [{"type": "text", "content": text}]}]),
            )
            if usage["input"] is not None:
                span.set_data("gen_ai.usage.input_tokens", usage["input"])
            if usage["output"] is not None:
                span.set_data("gen_ai.usage.output_tokens", usage["output"])
            script = clean_script(text)
            if len(script) < 40:
                return fallback_script(trip_name, events), False
            return script, True
        except Exception as exc:
            span.set_status("internal_error")
            span.set_data("error.type", type(exc).__name__)
            logging.warning("Recap script from Gemma failed: %s", exc)
            return fallback_script(trip_name, events), False


def _explain(status: int, body: str) -> str:
    if "detected_unusual_activity" in body:  # also a 401, but the key itself is fine
        return (
            "ElevenLabs has disabled free-tier access for this account (unusual activity, often a VPN or "
            "proxy). Turn off the VPN or use a paid plan."
        )
    if status == 401:
        return "ElevenLabs rejected the API key. Check ELEVENLABS_API_KEY."
    if status in (402, 429):
        return "ElevenLabs credit or rate limit reached. Try again later."
    return f"ElevenLabs returned an error ({status}): {body[:160]}"


def synthesize(script: str) -> bytes:
    """MP3 bytes of the script read aloud."""
    with traced(
        op="gen_ai.execute_tool",
        name="execute_tool elevenlabs_text_to_speech",
        attributes={
            "gen_ai.operation.name": "execute_tool",
            "gen_ai.agent.name": NARRATOR,
            "gen_ai.tool.name": "elevenlabs_text_to_speech",
            "gen_ai.tool.description": "Read the trip recap aloud with ElevenLabs",
            "characters": len(script),
            "voice_id": settings.elevenlabs_voice_id,
            "model": settings.elevenlabs_model,
        },
    ) as span:
        res = httpx.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{settings.elevenlabs_voice_id}",
            params={"output_format": "mp3_44100_128"},
            headers={"xi-api-key": settings.elevenlabs_api_key, "Accept": "audio/mpeg"},
            json={"text": script, "model_id": settings.elevenlabs_model},
            timeout=120,
        )
        if res.status_code != 200:
            span.set_status("internal_error")
            span.set_data("error.type", f"http_{res.status_code}")
            raise ElevenLabsError(_explain(res.status_code, res.text))
        span.set_data("audio_bytes", len(res.content))
        return res.content
