# Kokoro on-device TTS sidecar (opt-in via docker compose profile "tts").
# CPU-only, no API keys, OpenAI-compatible /v1/audio endpoints.
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    espeak-ng curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir fastapi uvicorn kokoro-onnx soundfile numpy

WORKDIR /app
COPY server.py entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8000/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
