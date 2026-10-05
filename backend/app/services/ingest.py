"""Photo preprocessing: orientation fix, thumbnail, EXIF time and GPS."""
import hashlib
import io
from dataclasses import dataclass
from datetime import datetime

from PIL import Image, ImageOps

try:  # iPhone photos arrive as HEIC
    from pillow_heif import register_heif_opener

    register_heif_opener()
except ImportError:  # pragma: no cover
    pass

EXIF_IFD = 0x8769
GPS_IFD = 0x8825
DATETIME_ORIGINAL = 36867
DATETIME = 306
THUMB_MAX = 1024


class InvalidImage(Exception):
    pass


@dataclass
class ProcessedImage:
    sha256: str
    width: int
    height: int
    taken_at: datetime | None
    gps: dict | None
    thumb_bytes: bytes


def _parse_time(value) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.strptime(str(value).strip(), "%Y:%m:%d %H:%M:%S")
    except ValueError:
        return None


def _to_degrees(values, ref) -> float | None:
    try:
        d, m, s = (float(v) for v in values)
    except (TypeError, ValueError):
        return None
    deg = d + m / 60 + s / 3600
    return -deg if str(ref).upper() in {"S", "W"} else deg


def _extract_gps(exif) -> dict | None:
    gps = exif.get_ifd(GPS_IFD)
    if not gps:
        return None
    lat = _to_degrees(gps.get(2), gps.get(1))
    lng = _to_degrees(gps.get(4), gps.get(3))
    if lat is None or lng is None:
        return None
    return {"lat": lat, "lng": lng}


def process_image(data: bytes) -> ProcessedImage:
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except Exception as exc:
        raise InvalidImage("Not a readable image") from exc

    exif = img.getexif()
    taken_at = _parse_time(exif.get_ifd(EXIF_IFD).get(DATETIME_ORIGINAL)) or _parse_time(
        exif.get(DATETIME)
    )
    gps = _extract_gps(exif)

    img = ImageOps.exif_transpose(img)
    width, height = img.size
    thumb = img.convert("RGB")
    thumb.thumbnail((THUMB_MAX, THUMB_MAX))
    buf = io.BytesIO()
    thumb.save(buf, "JPEG", quality=82, optimize=True)

    return ProcessedImage(
        sha256=hashlib.sha256(data).hexdigest(),
        width=width,
        height=height,
        taken_at=taken_at,
        gps=gps,
        thumb_bytes=buf.getvalue(),
    )
