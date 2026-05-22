#!/usr/bin/env python3
"""
Servidor estático + proxy reverso para a interface Chat-IA com Ollama.

Threading habilitado: cada conexão é tratada em thread separada, então
respostas em streaming não bloqueiam outras conexões (corrige HTTP 405
que ocorria quando o smartphone tentava conectar durante um streaming ativo).

O Ollama permanece em localhost:11434 (padrão, sem necessidade de alterar
OLLAMA_HOST ou OLLAMA_ORIGINS). O servidor faz o proxy internamente.

Iniciar:
    python3 server.py

Acesse de outros dispositivos: http://<IP_DO_SERVIDOR>:8080
"""

import http.server
import socketserver
import os
import urllib.request
import urllib.error

HOST        = "0.0.0.0"
PORT        = 8080
OLLAMA_BASE = "http://localhost:11434"

os.chdir(os.path.dirname(os.path.abspath(__file__)))


class ThreadedHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    """HTTP multithreaded — cada conexão em sua própria thread."""
    allow_reuse_address = True   # definido antes de __init__ para ter efeito
    daemon_threads      = True   # threads encerram junto com o processo principal


class Handler(http.server.SimpleHTTPRequestHandler):

    def log_message(self, fmt, *args):
        print(f"[chat-ia] {self.address_string()} – {fmt % args}")

    def _add_cors(self):
        """Adiciona cabeçalhos CORS em qualquer resposta."""
        self.send_header("Access-Control-Allow-Origin",  "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    # ------------------------------------------------------------------
    # Proxy: encaminha POST /api/* → Ollama local
    # ------------------------------------------------------------------
    def do_POST(self):
        if self.path.startswith("/api/"):
            self._proxy_to_ollama()
        else:
            self.send_error(404, "Not Found")

    def _proxy_to_ollama(self):
        length = int(self.headers.get("Content-Length", 0))
        body   = self.rfile.read(length)
        target = f"{OLLAMA_BASE}{self.path}"

        req = urllib.request.Request(
            target,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(req) as resp:
                self.send_response(resp.status)
                self._add_cors()
                for key, value in resp.headers.items():
                    if key.lower() not in ("transfer-encoding", "connection",
                                           "keep-alive"):
                        self.send_header(key, value)
                self.end_headers()
                # Encaminha chunks do streaming conforme chegam
                while True:
                    chunk = resp.read(512)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    self.wfile.flush()

        except urllib.error.URLError as exc:
            self.send_error(502, f"Ollama indisponível: {exc.reason}")

    # ------------------------------------------------------------------
    # CORS pre-flight — alguns browsers enviam OPTIONS antes do POST
    # ------------------------------------------------------------------
    def do_OPTIONS(self):
        self.send_response(204)
        self._add_cors()
        self.send_header("Content-Length", "0")
        self.end_headers()


with ThreadedHTTPServer((HOST, PORT), Handler) as httpd:
    print(f"[chat-ia] Servidor (threading) iniciado em http://{HOST}:{PORT}")
    print(f"[chat-ia] Proxy ativo: /api/* → {OLLAMA_BASE}")
    print(f"[chat-ia] Acesse de outros dispositivos via http://<IP_DA_MÁQUINA>:{PORT}")
    print("[chat-ia] Ctrl+C para encerrar")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[chat-ia] Servidor encerrado.")
