from pathlib import Path
from typing import Protocol

from .config import settings


class Storage(Protocol):
    def put(self, key: str, data: bytes, content_type: str) -> str:
        """Store bytes under key and return a public URL."""

    def get(self, key: str) -> bytes:
        """Read back the bytes stored under key."""


class LocalStorage:
    def __init__(self, root: str, public_url: str):
        self.root = Path(root)
        self.public_url = public_url.rstrip("/")

    def put(self, key: str, data: bytes, content_type: str) -> str:
        path = self.root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return f"{self.public_url}/media/{key}"

    def get(self, key: str) -> bytes:
        return (self.root / key).read_bytes()


class R2Storage:
    def __init__(self):
        import boto3

        self.client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            region_name="auto",
        )
        self.bucket = settings.r2_bucket
        self.public_base = settings.r2_public_base_url.rstrip("/")

    def put(self, key: str, data: bytes, content_type: str) -> str:
        self.client.put_object(
            Bucket=self.bucket, Key=key, Body=data, ContentType=content_type
        )
        return f"{self.public_base}/{key}"

    def get(self, key: str) -> bytes:
        return self.client.get_object(Bucket=self.bucket, Key=key)["Body"].read()


_storage: Storage | None = None


def get_storage() -> Storage:
    global _storage
    if _storage is None:
        if settings.storage_backend == "r2":
            _storage = R2Storage()
        else:
            _storage = LocalStorage(settings.media_dir, settings.public_api_url)
    return _storage
