import json
import os
import re

import httpx
from dotenv import load_dotenv

MODEL_NAME = os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it")
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent"
)

PROMPT = """Tu aides une personne à comprendre un document avant de signer.
Écris en français très simple.

Règles :
- Ne jamais inventer une clause, un montant, une date ou une obligation absente du texte.
- Si une information n'est pas claire, dis qu'il faut la vérifier.
- Ne dis pas qu'une clause est illégale.
- Signale les phrases ambiguës et propose des questions à poser avant de signer.
- Reconnais les limites de ton analyse.

Réponds UNIQUEMENT avec un JSON de cette forme :
{{
  "summary": "de quoi parle le document",
  "you": "ce que la personne doit faire",
  "other": "ce que l'autre partie doit faire",
  "money": "montants, paiements, pénalités présents dans le texte, sinon dire qu'aucun montant n'est écrit clairement",
  "dates": "échéances et durées présentes dans le texte, sinon dire qu'aucune date n'est écrite clairement",
  "checks": "points à vérifier et questions à poser",
  "ewe": "traduction en éwé naturel et compréhensible de l'explication (pas du document brut)"
}}

Texte du document :
{document}
"""


def has_api_key():
    load_dotenv()
    return bool(os.getenv("GEMINI_API_KEY", "").strip())


def parse_json(raw):
    text = (raw or "").strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1)
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("Réponse IA illisible")
    data = json.loads(text[start : end + 1])
    return {
        "summary": str(data.get("summary") or "").strip(),
        "you": str(data.get("you") or "").strip(),
        "other": str(data.get("other") or "").strip(),
        "money": str(data.get("money") or "").strip(),
        "dates": str(data.get("dates") or "").strip(),
        "checks": str(data.get("checks") or "").strip(),
        "ewe": str(data.get("ewe") or "").strip(),
        "model": MODEL_NAME,
    }


async def analyze_text(document):
    load_dotenv(override=True)
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("Clé API absente. Ajoutez GEMINI_API_KEY dans backend/.env.")

    clipped = document.strip()[:12000]
    payload = {
        "contents": [{"parts": [{"text": PROMPT.format(document=clipped)}]}],
        "generationConfig": {"temperature": 0.2},
    }

    async with httpx.AsyncClient(timeout=90.0) as client:
        response = await client.post(
            GEMINI_URL,
            params={"key": api_key},
            json=payload,
        )

    if response.status_code >= 400:
        raise RuntimeError(
            "Gemma 4 n’a pas pu analyser le document. Vérifiez la clé API et le nom du modèle."
        )

    body = response.json()
    try:
        raw = body["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError) as error:
        raise RuntimeError("Réponse Gemma 4 inattendue.") from error

    return parse_json(raw)
