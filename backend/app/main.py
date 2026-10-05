from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .db import ensure_indexes, ensure_vector_index
from .observability import init_sentry
from .routers import photos, process, recap, search, trips


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_indexes()
    ensure_vector_index()
    yield


init_sentry()

app = FastAPI(title="Keepsake API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trips.router)
app.include_router(photos.router)
app.include_router(process.router)
app.include_router(search.router)
app.include_router(recap.router)

if settings.storage_backend == "local":
    Path(settings.media_dir).mkdir(parents=True, exist_ok=True)
    app.mount("/media", StaticFiles(directory=settings.media_dir), name="media")


@app.get("/health")
def health():
    return {"status": "ok"}
