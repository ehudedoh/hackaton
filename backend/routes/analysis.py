from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.ai_service import analyze_text, has_api_key

router = APIRouter()


class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20000)


@router.post("/analyze")
async def analyze(payload: AnalyzeRequest):
    if not has_api_key():
        raise HTTPException(
            status_code=503,
            detail="La clé API n’est pas encore dans backend/.env.",
        )
    try:
        return await analyze_text(payload.text)
    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="L’explication n’a pas pu être lue. Réessayez.",
        )
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error))
