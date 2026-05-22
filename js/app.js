/**
 * Chat-IA — Frontend
 * Conecta-se ao Ollama via /api/chat com streaming.
 * A URL é construída dinamicamente para funcionar em qualquer dispositivo da rede.
 */

(() => {
  "use strict";

  // ──────────────────────────────────────────────
  // Configuração
  // O servidor Python em /api/* faz proxy para o Ollama local,
  // então o frontend nunca precisa conhecer o endereço do Ollama.
  // ──────────────────────────────────────────────
  const OLLAMA_URL = "/api/chat";
  const MODEL      = "lama3.1-jovem-t0.9:latest";

  // ──────────────────────────────────────────────
  // Referências DOM
  // ──────────────────────────────────────────────
  const messagesEl  = document.getElementById("messages");
  const inputEl     = document.getElementById("prompt-input");
  const sendBtn     = document.getElementById("send-btn");
  const errorToast  = document.getElementById("error-toast");
  const errorMsgEl  = document.getElementById("error-message");

  // ──────────────────────────────────────────────
  // Estado
  // ──────────────────────────────────────────────
  const history = [];   // [{role: "user"|"assistant", content: "..."}]
  let   isLoading = false;

  // ──────────────────────────────────────────────
  // Auto-resize do textarea
  // ──────────────────────────────────────────────
  function resizeInput() {
    inputEl.style.height = "auto";
    inputEl.style.height = `${Math.min(inputEl.scrollHeight, 160)}px`;
  }

  inputEl.addEventListener("input", resizeInput);

  // ──────────────────────────────────────────────
  // Atalhos de teclado
  // ──────────────────────────────────────────────
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  });

  sendBtn.addEventListener("click", submit);

  // ──────────────────────────────────────────────
  // Helpers de UI
  // ──────────────────────────────────────────────

  /** Cria e insere uma bolha de mensagem. Retorna o elemento .bubble-text */
  function addMessage(role, text) {
    const wrapper = document.createElement("div");
    wrapper.className = `message ${role}`;

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const span = document.createElement("span");
    span.className = "bubble-text";
    span.textContent = text;

    bubble.appendChild(span);
    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    scrollToBottom();
    return span;
  }

  /** Insere a animação de loading e retorna o elemento wrapper para remoção posterior */
  function addLoadingBubble() {
    const wrapper = document.createElement("div");
    wrapper.className = "message assistant";
    wrapper.id = "loading-bubble";

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    bubble.innerHTML = `
      <div class="loading-dots" aria-label="IA está digitando">
        <span></span><span></span><span></span>
      </div>`;

    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    scrollToBottom();
    return wrapper;
  }

  function removeLoadingBubble() {
    const el = document.getElementById("loading-bubble");
    if (el) el.remove();
  }

  function scrollToBottom() {
    const container = document.getElementById("chat-container");
    container.scrollTop = container.scrollHeight;
  }

  function setLoading(active) {
    isLoading = active;
    sendBtn.disabled = active;
    inputEl.disabled = active;
    if (!active) {
      inputEl.disabled = false;
      inputEl.focus();
    }
  }

  let toastTimer = null;
  function showError(msg) {
    errorMsgEl.textContent = msg;
    errorToast.setAttribute("aria-hidden", "false");
    errorToast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideError, 6000);
  }

  function hideError() {
    errorToast.classList.remove("visible");
    errorToast.setAttribute("aria-hidden", "true");
  }

  // ──────────────────────────────────────────────
  // Lógica principal: envio e streaming
  // ──────────────────────────────────────────────
  async function submit() {
    if (isLoading) return;

    const rawText = inputEl.value;
    const text = rawText.trim();
    if (!text) return;

    // Limpa o input imediatamente
    inputEl.value = "";
    resizeInput();

    // Exibe mensagem do usuário
    addMessage("user", text);

    // Adiciona ao histórico
    history.push({ role: "user", content: text });

    setLoading(true);
    const loadingBubble = addLoadingBubble();

    try {
      const response = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: history,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status}: ${errText || response.statusText}`);
      }

      // Remove o loader e cria a bolha da IA para streaming
      removeLoadingBubble();
      const aiSpan = addMessage("assistant", "");

      // Processa o stream chunk por chunk
      const reader  = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let   buffer  = "";
      let   fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // O Ollama envia uma linha JSON por chunk
        const lines = buffer.split("\n");
        buffer = lines.pop(); // mantém linha incompleta

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          let parsed;
          try {
            parsed = JSON.parse(trimmed);
          } catch {
            continue;
          }

          const token = parsed?.message?.content ?? "";
          if (token) {
            fullResponse += token;
            aiSpan.textContent = fullResponse;
            scrollToBottom();
          }

          if (parsed?.done) break;
        }
      }

      // Adiciona resposta completa ao histórico
      if (fullResponse) {
        history.push({ role: "assistant", content: fullResponse });
      }

    } catch (err) {
      removeLoadingBubble();
      console.error("[chat-ia] Erro:", err);

      const isNetworkErr =
        err instanceof TypeError && err.message.toLowerCase().includes("fetch");

      const userMsg = isNetworkErr
        ? `Não foi possível conectar ao Ollama. Verifique se o serviço está rodando localmente (porta 11434).`
        : `Erro ao comunicar com o Ollama: ${err.message}`;

      showError(userMsg);

      // Desfaz a última mensagem do usuário para que ele possa reenviar
      history.pop();

    } finally {
      setLoading(false);
    }
  }

  // ──────────────────────────────────────────────
  // Partículas de folhas (tema ambiental)
  // ──────────────────────────────────────────────
  function createLeafParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    const leaves = ['💧', '🌊', '❄️', '✦'];
    for (let i = 0; i < 18; i++) {
      const leaf = document.createElement('span');
      leaf.className = 'leaf';
      leaf.setAttribute('aria-hidden', 'true');
      leaf.style.cssText = [
        `left: ${Math.random() * 100}%`,
        `animation-delay: ${(Math.random() * 28).toFixed(1)}s`,
        `animation-duration: ${(18 + Math.random() * 22).toFixed(1)}s`,
        `font-size: ${(0.7 + Math.random() * 1.1).toFixed(2)}rem`,
        `opacity: ${(0.08 + Math.random() * 0.14).toFixed(2)}`,
      ].join(';');
      leaf.textContent = leaves[Math.floor(Math.random() * leaves.length)];
      container.appendChild(leaf);
    }
  }
  createLeafParticles();

  // ──────────────────────────────────────────────
  // Foco inicial
  // ──────────────────────────────────────────────
  inputEl.focus();
})();
