"""CLIP image embeddings. The model is loaded once, on first use."""
import io
import threading

import numpy as np
from PIL import Image, ImageOps

from ..config import settings

CLIP_SIZE = 224
_model = None
_lock = threading.Lock()


def _get_model():
    global _model
    with _lock:
        if _model is None:
            from sentence_transformers import SentenceTransformer  # slow import, keep it lazy

            _model = SentenceTransformer(settings.clip_model)
    return _model


def embed_images(images: list[bytes]) -> np.ndarray:
    """Returns one unit-length vector per image, shape (n, 512)."""
    # crop to CLIP's 224x224 input here: its own preprocessing crashes on very thin images (panoramas, strips)
    pil = [ImageOps.fit(Image.open(io.BytesIO(b)).convert("RGB"), (CLIP_SIZE, CLIP_SIZE)) for b in images]
    vectors = _get_model().encode(pil, batch_size=16, convert_to_numpy=True, normalize_embeddings=True)
    return np.asarray(vectors, dtype=np.float32)


def embed_text(text: str) -> np.ndarray:
    """CLIP text vector in the same space as the image vectors."""
    return _get_model().encode([text], normalize_embeddings=True, convert_to_numpy=True)[0]
