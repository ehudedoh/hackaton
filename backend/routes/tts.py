from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from pydantic import BaseModel, Field

from services.tts_service import (
    MODEL_NAME,
    generate_speech,
    is_loading,
    is_ready,
    start_background_load,
)

router = APIRouter()


class TtsRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


@router.post("/tts/warmup")
def warmup():
    start_background_load()
    return {
        "ready": is_ready(),
        "loading": is_loading(),
        "model": MODEL_NAME,
    }


@router.post("/tts")
async def tts(payload: TtsRequest):
    if not is_ready():
        start_background_load()
        raise HTTPException(
            status_code=503,
            detail="La voix se charge encore. Réessayez dans une minute.",
        )
    try:
        audio = await run_in_threadpool(generate_speech, payload.text)
    except RuntimeError as error:
        if str(error) == "loading":
            raise HTTPException(
                status_code=503,
                detail="La voix se charge encore. Réessayez dans une minute.",
            )
        raise HTTPException(status_code=502, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="La voix n’est pas installée. Installez torch, transformers et scipy.",
        )
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="La voix n’a pas pu être préparée. Réessayez.",
        )
    return Response(content=audio, media_type="audio/wav")
