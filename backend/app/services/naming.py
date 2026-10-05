"""Ask Gemma to name a group of photos (hosted Gemini API by default, or local Ollama)."""
import base64
import json
import logging
import re
import time

import httpx

from ..config import settings
from ..observability import AGENT_NAME, traced

PROMPT = (
    "These photos belong to one moment or place from a group trip. {hint}"
    "Give it a short, specific name (2 to 4 words, like 'Baga Beach' or 'Dinner'), and a "
    "one-sentence description of what is happening. If they are not travel photos (documents, "
    "screenshots, blank images), still name what they show. Reply only with JSON: "
    '{{"name": "...", "description": "..."}}'
)


API_ATTEMPTS = 6
SERVER_ERRORS = {500, 502, 503, 504}
RATE_LIMIT_WAITS = 3
_resume_at = 0.0  # shared by all threads: no request goes out before this time.monotonic() value


def _b64(blob: bytes) -> str:
    return base64.b64encode(blob).decode()


def _retry_delay(res: httpx.Response) -> float:
    """How long a 429 asks us to wait, in seconds."""
    try:
        for detail in res.json()["error"]["details"]:
            if "retryDelay" in detail:
                return min(float(detail["retryDelay"].rstrip("s")) + 1, 65)
    except (KeyError, TypeError, ValueError):
        pass
    return 30


def _ask_gemini_api(images: list[bytes], prompt: str) -> tuple[str, dict]:
    parts = [{"inline_data": {"mime_type": "image/jpeg", "data": _b64(b)}} for b in images]
    parts.append({"text": prompt})
    global _resume_at
    errors = rate_waits = 0
    while True:
        pause = _resume_at - time.monotonic()
        if pause > 0:
            time.sleep(pause)
        res = httpx.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemma_api_model}:generateContent",
            headers={"x-goog-api-key": settings.google_api_key},
            # without this Gemma 4 reasons at length first, which takes several times longer
            json={
                "contents": [{"parts": parts}],
                "generationConfig": {"thinkingConfig": {"thinkingLevel": "minimal"}},
            },
            timeout=120,
        )
        if res.status_code == 429 and rate_waits < RATE_LIMIT_WAITS:
            # out of requests for this minute: hold every caller until the API says to come back
            rate_waits += 1
            delay = _retry_delay(res)
            _resume_at = max(_resume_at, time.monotonic() + delay)
            logging.warning("Gemini API rate limit reached, waiting %.0fs", delay)
        elif res.status_code in SERVER_ERRORS and errors < API_ATTEMPTS - 1:
            # the hosted Gemma models fail at random with a 500, and a second try usually works
            errors += 1
            logging.warning("Gemini API returned %s, trying again", res.status_code)
            time.sleep(1.5 * errors)
        else:
            break
    res.raise_for_status()
    body = res.json()
    usage = body.get("usageMetadata", {})
    # Gemma 4 sends its reasoning first as parts flagged "thought"; keep only the answer
    parts = body["candidates"][0]["content"]["parts"]
    text = "".join(p.get("text", "") for p in parts if not p.get("thought"))
    return text, {
        "input": usage.get("promptTokenCount"),
        "output": usage.get("candidatesTokenCount"),
    }


def _ask_ollama(images: list[bytes], prompt: str, json_mode: bool = True) -> tuple[str, dict]:
    payload = {
        "model": settings.gemma_model,
        "stream": False,
        "messages": [{"role": "user", "content": prompt, "images": [_b64(b) for b in images]}],
    }
    if json_mode:
        payload["format"] = "json"
    res = httpx.post(f"{settings.ollama_url}/api/chat", json=payload, timeout=180)
    res.raise_for_status()
    body = res.json()
    return body["message"]["content"], {
        "input": body.get("prompt_eval_count"),
        "output": body.get("eval_count"),
    }


def _parse(text: str) -> tuple[str, str] | None:
    match = re.search(r"\{.*\}", text, re.S)  # models sometimes wrap JSON in prose or code fences
    if not match:
        return None
    data = json.loads(match.group(0))
    name = str(data["name"]).strip()[:60]
    if not name:
        return None
    return name, str(data.get("description", "")).strip()[:300]


def _parse_or_none(text: str) -> tuple[str, str] | None:
    try:
        return _parse(text)
    except (KeyError, TypeError, ValueError):  # JSON that is broken or has no name
        return None


def name_cluster(images: list[bytes], hint: str = "") -> tuple[str, str] | None:
    """Returns (name, description), or None if Gemma is unavailable or answers badly."""
    prompt = PROMPT.format(hint=f"{hint} " if hint else "")
    local = settings.gemma_provider == "ollama"
    model = settings.gemma_model if local else settings.gemma_api_model

    with traced(
        op="gen_ai.chat",
        name=f"chat {model}",
        attributes={
            "gen_ai.operation.name": "chat",
            "gen_ai.request.model": model,
            "gen_ai.provider.name": "ollama" if local else "google",
            "gen_ai.agent.name": AGENT_NAME,
            "gen_ai.input.messages": json.dumps(
                [{"role": "user", "parts": [{"type": "text", "content": prompt}]}]
            ),
            "images_sent": len(images),
        },
    ) as span:
        try:
            if not local and not settings.google_api_key:
                logging.warning("GOOGLE_API_KEY not set, using fallback names")
                span.set_data("skipped", "no GOOGLE_API_KEY")
                return None
            for attempt in range(2):
                text, usage = _ask_ollama(images, prompt) if local else _ask_gemini_api(images, prompt)
                result = _parse_or_none(text)
                if result:
                    break
                logging.warning("Gemma answer was not usable (attempt %d): %r", attempt + 1, text[:200])
            span.set_data("gen_ai.response.model", model)
            span.set_data(
                "gen_ai.output.messages",
                json.dumps([{"role": "assistant", "parts": [{"type": "text", "content": text}]}]),
            )
            if usage["input"] is not None:
                span.set_data("gen_ai.usage.input_tokens", usage["input"])
            if usage["output"] is not None:
                span.set_data("gen_ai.usage.output_tokens", usage["output"])
            return result
        except Exception as exc:
            span.set_status("internal_error")
            span.set_data("error.type", type(exc).__name__)
            logging.warning("Gemma naming failed: %s", exc)
            return None
