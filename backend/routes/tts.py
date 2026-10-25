from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from pydantic import BaseModel, Field

from services.tts_service import is_ready, load_tts, synthesize_wav

router = APIRouter()


class TtsRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


@router.post("/tts")
async def tts(payload: TtsRequest):
    try:
        await run_in_threadpool(load_tts)
        audio = await run_in_threadpool(synthesize_wav, payload.text)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="La voix n’a pas pu être préparée. Réessayez.",
        )
    return Response(content=audio, media_type="audio/wav")
