#!/bin/sh
# Download the Kokoro ONNX model + voices once, then start the API server.
set -eu

MODEL_BASE="https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"

mkdir -p /data

if [ ! -f /data/kokoro-v1.0.fp16.onnx ]; then
  echo "Downloading kokoro-v1.0.fp16.onnx ..."
  curl -fSL -o /data/kokoro-v1.0.fp16.onnx "$MODEL_BASE/kokoro-v1.0.fp16.onnx" \
    || { echo "ERROR: model download failed" >&2; exit 1; }
fi

if [ ! -f /data/voices-v1.0.bin ]; then
  echo "Downloading voices-v1.0.bin ..."
  curl -fSL -o /data/voices-v1.0.bin "$MODEL_BASE/voices-v1.0.bin"
fi

exec uvicorn server:app --host 0.0.0.0 --port 8000
