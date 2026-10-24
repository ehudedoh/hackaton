from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

from routes.analysis import router as analysis_router
from services.ai_service import MODEL_NAME, has_api_key

app = FastAPI(title="JuriLex")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(analysis_router, prefix="/api")


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "analysis": has_api_key(),
        "model": MODEL_NAME,
        "tts": False,
    }
