import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

from routes.analysis import router as analysis_router
from routes.tts import router as tts_router
from services.ai_service import MODEL_NAME, has_api_key
from services.tts_service import is_loading, is_ready, start_background_load

DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://hackaton-ulix.onrender.com",
]
EXTRA_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]


def _should_preload_tts():
    explicit = os.getenv("PRELOAD_TTS")
    if explicit is not None:
        return explicit.strip().lower() in {"1", "true", "yes"}
    return os.getenv("RENDER", "").strip().lower() in {"true", "1"}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if _should_preload_tts():
        start_background_load()
    yield


app = FastAPI(title="JuriLex", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=DEFAULT_ORIGINS + EXTRA_ORIGINS,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(analysis_router, prefix="/api")
app.include_router(tts_router, prefix="/api")


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "analysis": has_api_key(),
        "model": MODEL_NAME,
        "tts": is_ready(),
        "tts_loading": is_loading(),
        "tts_model": "facebook/mms-tts-ewe",
    }
