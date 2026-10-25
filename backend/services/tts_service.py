import os
import tempfile
from pathlib import Path

MODEL_NAME = "facebook/mms-tts-ewe"
MAX_CHUNK = 220

_tokenizer = None
_model = None


def is_ready():
    return _model is not None and _tokenizer is not None


def load_tts():
    global _tokenizer, _model
    if is_ready():
        return
    import torch
    from transformers import AutoTokenizer, VitsModel

    print("jurilex: chargement TTS", MODEL_NAME, flush=True)
    _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    _model = VitsModel.from_pretrained(MODEL_NAME)
    _model.eval()
    print("jurilex: TTS prêt", flush=True)


def _chunks(text):
    cleaned = " ".join(text.split()).strip()
    if not cleaned:
        return []
    parts = []
    current = ""
    for piece in cleaned.replace("!", ".").replace("?", ".").split("."):
        piece = piece.strip()
        if not piece:
            continue
        candidate = f"{current} {piece}".strip() if current else piece
        if len(candidate) > MAX_CHUNK and current:
            parts.append(current)
            current = piece
        else:
            current = candidate
    if current:
        parts.append(current)
    return parts or [cleaned[:MAX_CHUNK]]


def _synthesize_chunk(text):
    import torch

    inputs = _tokenizer(text, return_tensors="pt")
    with torch.no_grad():
        waveform = _model(**inputs).waveform
    audio = waveform.squeeze().cpu().numpy()
    if audio.ndim > 1:
        audio = audio.T
    return audio


def synthesize_wav(text):
    import numpy as np
    import scipy.io.wavfile as wavfile

    if not is_ready():
        raise RuntimeError("La voix n’est pas encore prête.")
    pieces = _chunks(text[:2500])
    if not pieces:
        raise ValueError("Aucun texte à lire.")
    waves = [_synthesize_chunk(piece) for piece in pieces]
    audio = np.concatenate(waves) if len(waves) > 1 else waves[0]
    peak = np.max(np.abs(audio)) if audio.size else 0
    if peak > 1:
        audio = audio / peak
    pcm = np.int16(np.clip(audio, -1, 1) * 32767)
    handle, path = tempfile.mkstemp(suffix=".wav")
    os.close(handle)
    try:
        wavfile.write(path, int(_model.config.sampling_rate), pcm)
        return Path(path).read_bytes()
    finally:
        Path(path).unlink(missing_ok=True)
