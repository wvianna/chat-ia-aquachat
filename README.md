# AquaChat 🌿

Interface web de chat com IA local via [Ollama](https://ollama.com), com tema ambiental e acesso a partir de qualquer dispositivo da rede.

---

## Pré-requisitos

| Requisito | Versão mínima |
|-----------|---------------|
| Python | 3.8+ |
| Ollama | qualquer versão recente |
| Modelo instalado | `lama3.1-jovem-t0.9-rude:latest` |

Verifique se o Ollama está rodando:

```bash
ollama list
```

---

## Iniciar o servidor

```bash
./start.sh
```

Saída esperada:

```
✅ EcoChat iniciado (PID 12345)
   Local:    http://localhost:8080
   Rede:     http://10.129.220.234:8080
   Logs:     /caminho/para/chat-ia/.server.log
```

Abra o endereço **Rede** em qualquer dispositivo conectado à mesma rede Wi-Fi ou LAN.

---

## Parar o servidor

```bash
./stop.sh
```

---

## Acompanhar os logs em tempo real

```bash
tail -f .server.log
```

---

## Estrutura do projeto

```
chat-ia/
├── server.py        # Servidor HTTP + proxy reverso para o Ollama
├── index.html       # Interface SPA (EcoChat)
├── css/
│   └── styles.css   # Tema floresta/eco
├── js/
│   └── app.js       # Lógica do chat (streaming, histórico)
├── start.sh         # Inicia o serviço
├── stop.sh          # Para o serviço
├── .server.pid      # PID do processo em execução (gerado automaticamente)
└── .server.log      # Log do servidor (gerado automaticamente)
```

---

## Como funciona

```
Navegador / Celular
      │  GET /          → arquivos estáticos (index.html, css, js)
      │  POST /api/chat → proxy transparente
      ▼
  server.py :8080
      │
      │  POST http://localhost:11434/api/chat
      ▼
  Ollama (local)
```

O `server.py` atua como proxy reverso: todos os dispositivos da rede enviam requisições para a porta **8080**, e o servidor repassa internamente para o Ollama na porta **11434**. Isso evita a necessidade de expor o Ollama diretamente na rede.

---

## Trocar o modelo

Edite a constante no topo de `js/app.js`:

```js
const MODEL = "lama3.1-jovem-t0.9-rude:latest";
```

Substitua pelo nome de qualquer modelo instalado localmente (`ollama list`).

---

## Solução de problemas

| Sintoma | Causa provável | Solução |
|---------|---------------|---------|
| `❌ Porta 8080 já está em uso` | Outro processo na porta | `lsof -i:8080` → encerre o processo |
| Erro 502 no chat | Ollama não está rodando | `ollama serve` |
| Erro 502 "Not Found" | Modelo não encontrado | `ollama pull <modelo>` |
| Chat não responde no celular | Firewall bloqueando 8080 | Libere a porta no firewall do host |

---

## Licença

MIT License — software livre para uso, modificação e distribuição.

```
Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
