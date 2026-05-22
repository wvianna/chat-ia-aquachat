#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.server.pid"
PORT=8080

if [[ ! -f "$PID_FILE" ]]; then
  echo "ℹ️  Nenhum servidor registrado (arquivo .server.pid não encontrado)."
  # Tenta matar por porta como fallback
  PID=$(lsof -ti:"$PORT" 2>/dev/null || true)
  if [[ -n "$PID" ]]; then
    kill "$PID" && echo "✅ Processo na porta $PORT encerrado (PID $PID)."
  fi
  exit 0
fi

PID=$(cat "$PID_FILE")

if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  echo "✅ EcoChat encerrado (PID $PID)."
else
  echo "ℹ️  Processo $PID não estava mais ativo."
fi

rm -f "$PID_FILE"
