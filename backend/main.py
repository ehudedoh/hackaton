import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

from routes.analysis import router as analysis_router
from routes.tts import router as tts_router
from services.ai_service import MODEL_NAME, has_api_key
from services.tts_service import is_ready

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


app = FastAPI(title="JuriLex")
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
        "tts_model": "facebook/mms-tts-ewe",
    }
