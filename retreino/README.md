# Retreino do Modelo — lama3.1-jovem-t0.9

Este diretório contém o `modelfile` para criar um modelo personalizado baseado no `llama3.1:8b` via Ollama.

---

## O que o modelo faz

O modelo é especializado em **recursos hídricos e meio ambiente** para um público jovem (10–15 anos), com as seguintes características:

- Responde sempre em **português brasileiro**
- Tom **divertido e engraçado** para engajar jovens
- Estilo poético à la **Machado de Assis**
- Admite quando não sabe a resposta
- Respostas **curtas e diretas**
- `temperature 1.1` (mais criativo) · `top_p 0.9`

---

## Pré-requisitos

1. **Ollama instalado** — [ollama.com](https://ollama.com)
2. **Modelo base disponível localmente:**

```bash
ollama pull llama3.1:8b
```

Verifique com:

```bash
ollama list
```

---

## Criar o modelo

Execute a partir deste diretório:

```bash
cd retreino/
ollama create lama3.1-jovem-t0.9 -f ./modelfile
```

O processo leva alguns segundos. Ao final, o modelo aparece em `ollama list`.

---

## Testar no terminal

```bash
ollama run lama3.1-jovem-t0.9
```

Experimente perguntas como:
- *"O que é ciclo da água?"*
- *"Por que não devo jogar lixo no rio?"*
- *"Como funciona uma estação de tratamento?"*

Saia com `Ctrl+D` ou `/bye`.

---

## Atualizar o modelo

Após editar o `modelfile`, recrie o modelo com o mesmo comando:

```bash
ollama create lama3.1-jovem-t0.9 -f ./modelfile
```

O Ollama substitui a versão anterior automaticamente.

---

## Remover o modelo

```bash
ollama rm lama3.1-jovem-t0.9
```

---

## Usar com a interface web (AquaChat)

O modelo já está configurado como padrão no `js/app.js`:

```js
const MODEL = "lama3.1-jovem-t0.9:latest";
```

Inicie o servidor a partir da raiz do projeto:

```bash
./start.sh
```

Acesse `http://localhost:8080` ou pelo IP da rede.
