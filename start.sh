#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.server.pid"
LOG_FILE="$SCRIPT_DIR/.server.log"
PORT=8080

# Verifica se já está rodando
if [[ -f "$PID_FILE" ]]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "⚠️  Servidor já está rodando (PID $PID) em http://0.0.0.0:$PORT"
    exit 0
  else
    rm -f "$PID_FILE"
  fi
fi

# Verifica se a porta está em uso por outro processo
if lsof -ti:"$PORT" &>/dev/null; then
  echo "❌ Porta $PORT já está em uso por outro processo."
  echo "   Use: sudo lsof -i:$PORT"
  exit 1
fi

# Inicia o servidor em background
nohup python3 "$SCRIPT_DIR/server.py" >"$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

sleep 1

PID=$(cat "$PID_FILE")
if kill -0 "$PID" 2>/dev/null; then
  echo "✅ EcoChat iniciado (PID $PID)"
  echo "   Local:    http://localhost:$PORT"
  # Tenta detectar o IP da rede local
  LOCAL_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')
  if [[ -n "$LOCAL_IP" ]]; then
    echo "   Rede:     http://$LOCAL_IP:$PORT"
  fi
  echo "   Logs:     $LOG_FILE"
else
  echo "❌ Falha ao iniciar. Verifique $LOG_FILE"
  rm -f "$PID_FILE"
  exit 1
fi
