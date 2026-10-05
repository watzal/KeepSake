import io

from PIL import Image

from app.services.ingest import InvalidImage, process_image
import pytest


def make_jpeg(size=(2000, 1500), taken="2026:07:14 18:30:00") -> bytes:
    img = Image.new("RGB", size, (200, 120, 60))
    exif = Image.Exif()
    exif[306] = taken
    buf = io.BytesIO()
    img.save(buf, "JPEG", exif=exif)
    return buf.getvalue()


def test_reads_time_and_makes_thumbnail():
    result = process_image(make_jpeg())
    assert result.taken_at.year == 2026 and result.taken_at.hour == 18
    assert (result.width, result.height) == (2000, 1500)
    thumb = Image.open(io.BytesIO(result.thumb_bytes))
    assert max(thumb.size) == 1024


def test_same_bytes_same_hash():
    data = make_jpeg()
    assert process_image(data).sha256 == process_image(data).sha256


def test_rejects_non_image():
    with pytest.raises(InvalidImage):
        process_image(b"not an image")
