from datetime import datetime

import pytest

from app.config import settings
from app.services import recap

EVENTS = [
    {"name": "Baga Beach", "description": "Friends play in the surf.", "photo_count": 40,
     "start_time": datetime(2026, 7, 14, 10), "contributors": ["Vatsal", "Rahul"]},
    {"name": "Dinner", "description": "A long table of seafood.", "photo_count": 25,
     "start_time": datetime(2026, 7, 14, 20), "contributors": ["Vatsal"]},
]


def test_fallback_script_mentions_every_moment():
    script = recap.fallback_script("Goa 2026", EVENTS)
    assert "Goa 2026" in script and "Baga Beach" in script and "Dinner" in script
    assert "65 photos from 2 people" in script


def test_clean_script_strips_markdown_and_truncates():
    assert recap.clean_script("**Hello** _there_\n\n# World") == "Hello there World"
    long = "A sentence here. " * 200
    cleaned = recap.clean_script(long)
    assert len(cleaned) <= recap.MAX_CHARS and cleaned.endswith(".")


class Resp:
    def __init__(self, status, content=b"", text=""):
        self.status_code, self.content, self.text = status, content, text


def test_synthesize_returns_audio(monkeypatch):
    monkeypatch.setattr(settings, "elevenlabs_api_key", "k")
    monkeypatch.setattr(recap.httpx, "post", lambda *a, **kw: Resp(200, b"ID3audio"))
    assert recap.synthesize("Hello there.") == b"ID3audio"


def test_synthesize_explains_bad_key(monkeypatch):
    monkeypatch.setattr(settings, "elevenlabs_api_key", "bad")
    monkeypatch.setattr(recap.httpx, "post", lambda *a, **kw: Resp(401, text="unauthorized"))
    with pytest.raises(recap.ElevenLabsError, match="API key"):
        recap.synthesize("Hello there.")
