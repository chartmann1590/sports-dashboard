"""Kokoro on-device TTS sidecar.

CPU-only, no API keys, OpenAI-compatible /v1/audio endpoints.
The model weights (~330MB) are downloaded once by entrypoint.sh into /data.
"""

import io

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

MODEL_PATH = '/data/kokoro-v0_19.fp16.onnx'
VOICES_PATH = '/data/voices-v1.0.bin'

VOICES = [
    {'id': 'af_heart', 'object': 'voice', 'name': 'Heart', 'description': 'Warm American female'},
    {'id': 'af_nicole', 'object': 'voice', 'name': 'Nicole', 'description': 'American female, news anchor style'},
    {'id': 'am_adam', 'object': 'voice', 'name': 'Adam', 'description': 'American male, deep and steady'},
    {'id': 'am_michael', 'object': 'voice', 'name': 'Michael', 'description': 'American male, sportscaster energy'},
    {'id': 'bf_emma', 'object': 'voice', 'name': 'Emma', 'description': 'British female, crisp'},
    {'id': 'bm_george', 'object': 'voice', 'name': 'George', 'description': 'British male, warm'},
]
VOICE_IDS = {v['id'] for v in VOICES}


class SpeechRequest(BaseModel):
    model: str = 'kokoro'
    input: str = ''
    voice: str = 'am_michael'
    response_format: str = 'wav'
    speed: float = 1.0
    stream: bool = False


app = FastAPI(title='Kokoro TTS sidecar')
_kokoro = None


def get_kokoro():
    """Load the model once at first use (lazy so /health works pre-download)."""
    global _kokoro
    if _kokoro is None:
        try:
            from kokoro_onnx import Kokoro
            _kokoro = Kokoro(MODEL_PATH, VOICES_PATH)
        except Exception as e:  # model missing or failed to load
            raise HTTPException(status_code=500, detail=f'tts model unavailable: {e}')
    return _kokoro


@app.get('/health')
def health():
    return {'status': 'ok'}


@app.get('/v1/audio/voices')
def voices():
    return {'object': 'list', 'data': VOICES}


@app.post('/v1/audio/speech')
def speech(req: SpeechRequest):
    text = (req.input or '').strip()
    if not text:
        raise HTTPException(status_code=400, detail='input must be a non-empty string')
    if len(text) > 4096:
        raise HTTPException(status_code=400, detail='input too long (max 4096 chars)')
    if not (0.5 <= req.speed <= 2.0):
        raise HTTPException(status_code=400, detail='speed must be between 0.5 and 2.0')
    voice = req.voice or 'am_michael'
    if voice not in VOICE_IDS:
        raise HTTPException(status_code=400, detail=f'unknown voice {voice!r}')

    try:
        kokoro = get_kokoro()
        samples, sample_rate = kokoro.create(text, voice=voice, speed=req.speed, lang='en-us')
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'synthesis failed: {e}')

    import soundfile as sf
    buf = io.BytesIO()
    sf.write(buf, samples, sample_rate, format='WAV')
    # Always WAV regardless of requested format; content-type says so.
    return Response(content=buf.getvalue(), media_type='audio/wav')
