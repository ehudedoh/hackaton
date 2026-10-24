import json
import os
import re
from pathlib import Path

import httpx
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_PATH, override=True)

MODEL_NAME = os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it")
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent"
)

PROMPT = """Tâche : expliquer un document en français simple, puis traduire l'explication en éwé.

Règles :
- N'invente pas de clause, montant, date ou obligation absente du texte.
- Si ce n'est pas clair, dis qu'il faut vérifier.
- Ne dis pas qu'une clause est illégale.

Le premier caractère de ta réponse doit être {{ et le dernier }}.
Aucun texte avant ou après le JSON.

Clés obligatoires :
summary, you, other, money, dates, checks, ewe

Document :
{document}
"""


def has_api_key():
    load_dotenv(ENV_PATH, override=True)
    return bool(os.getenv("GEMINI_API_KEY", "").strip())


def collect_text(body):
    parts = body["candidates"][0]["content"]["parts"]
    chunks = []
    for part in parts:
        text = part.get("text")
        if text and not part.get("thought"):
            chunks.append(text)
    if not chunks:
        for part in parts:
            if part.get("text"):
                chunks.append(part["text"])
    return "\n".join(chunks)


def parse_json(raw):
    text = (raw or "").strip()
    fenced = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text)
    if fenced:
        text = fenced.group(1)
    start = text.find("{")
    if start == -1:
        raise ValueError("Réponse IA illisible")
    data, _ = json.JSONDecoder().raw_decode(text[start:])
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


def analyze_text(document):
    load_dotenv(ENV_PATH, override=True)
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("Clé API absente. Ajoutez GEMINI_API_KEY dans backend/.env.")

    clipped = document.strip()[:12000]
    payload = {
        "contents": [{"parts": [{"text": PROMPT.format(document=clipped)}]}],
        "generationConfig": {
            "temperature": 0.2,
            "thinkingConfig": {"thinkingLevel": "minimal"},
        },
    }

    print("jurilex: appel Gemma 4", MODEL_NAME, flush=True)
    with httpx.Client(timeout=45.0, trust_env=False) as client:
        response = client.post(
            GEMINI_URL,
            params={"key": api_key},
            json=payload,
        )
    print("jurilex: Gemma 4 HTTP", response.status_code, flush=True)

    if response.status_code >= 400:
        raise RuntimeError(
            "Gemma 4 n’a pas pu analyser le document. Vérifiez la clé API et le nom du modèle."
        )

    body = response.json()
    try:
        raw = collect_text(body)
    except (KeyError, IndexError, TypeError) as error:
        raise RuntimeError("Réponse Gemma 4 inattendue.") from error

    return parse_json(raw)
