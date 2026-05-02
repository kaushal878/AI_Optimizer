# PromptOptimizer AI

A production-ready web application that helps you **save tokens** and **improve
prompt structure** for ChatGPT, Claude, Gemini, and other LLMs. Optimization is
deterministic, explainable, and runs entirely in the browser — with an optional
FastAPI backend for accurate `tiktoken` counts.

![PromptOptimizer AI banner](https://img.shields.io/badge/PromptOptimizer-AI-3a63ff?style=for-the-badge&labelColor=0b1020)

## Features

- ✍️ **Multi-line Monaco editor** — Markdown / plaintext, drag-and-paste, file upload (`.txt` / `.md`).
- ⚡ **Three optimization modes** — *Minimal Tokens*, *Balanced*, *Maximum Quality*.
- 🎯 **Four AI mode adapters** — ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google), Universal.
- 🧮 **Live token estimator** — original / optimized / % saved with visual progress.
- 🧠 **Auto-detected intent** — chart / code / explanation / comparison / general, each with a tailored output contract.
- 🎛 **Smart-enhancement toggles** — examples, step-by-step, tables, emojis, Mermaid diagrams, charts, code blocks.
- 📊 **Live chart preview** — parses `Jan 10k, Feb 15k, …`-style series and renders Bar / Line / Pie via Chart.js.
- 🧬 **Live Mermaid preview** — renders ` ```mermaid ` blocks the optimizer adds.
- 📥 **Downloads** — `.md`, structured `.json`, full `.pdf` analysis report, or all three.
- 📝 **Before/After diff** — word-level LCS diff highlights what was removed and what was added.
- 💾 **Local history** (last 25 optimizations) and **prompt templates** library.
- 🌗 **Dark / light themes**, responsive layout, fully keyboard accessible.

## Architecture

```
AI_Optimizer/
├── frontend/   # React + Vite + TypeScript + TailwindCSS + Monaco + Chart.js + Mermaid
└── backend/    # FastAPI + tiktoken + Pydantic
```

The frontend ships a fully functional rule-based optimizer + token estimator
(via `gpt-tokenizer`) so the app is useful even with no backend deployed. When
the backend is reachable at `VITE_API_BASE_URL`, the frontend prefers it for:

- **Accurate tokenization** via real `tiktoken` encodings (`o200k_base`, `cl100k_base`).
- **Server-side optimization** for parity across multiple clients / API mode.

Both implementations of the optimizer share the same rules and produce
identical structured JSON, so client and server stay in lock-step.

### Optimization rules

Rule-based, explainable transformations applied in this order:

1. Strip greetings & sign-offs (`Hi / Hello / Thanks / Cheers`).
2. Remove politeness fillers (`please / kindly / thank you / appreciated`).
3. Compress ~40 verbose phrases (`in order to → to`, `due to the fact that → because`, …).
4. Deduplicate identical sentences.
5. *(Minimal mode only)* Trim leading articles (`the / a / an`).
6. Collapse runs of whitespace and blank lines.
7. Append intent-aware enhancements (chart schema / code contract / step-by-step / table / Mermaid / examples / emoji headings).
8. Prepend a tuned system prefix for the chosen AI mode.

Each transformation records a short reason returned to the UI as
`enhancements: [{ label, detail }]`.

### Final response shape

```json
{
  "optimized_prompt": "…",
  "token_reduction": "27.3%",
  "token_reduction_pct": 27.3,
  "original_tokens": 153,
  "optimized_tokens": 111,
  "enhancements": [
    { "label": "Compressed verbose phrases", "detail": "Replaced 4 wordy patterns…" }
  ],
  "intents": [
    { "intent": "explanation", "confidence": 0.65, "reasons": ["explain", "step by step"] }
  ],
  "suggested_format": "Numbered steps + 1-line summary",
  "model": "gpt-4o",
  "download_ready": true
}
```

## Running locally

### Backend (optional but recommended)

```bash
cd backend
uv sync                                       # install deps (or: pip install -e .[dev])
uv run uvicorn app.main:app --reload --port 8000
# → http://127.0.0.1:8000/api/health
```

Tests:

```bash
uv run pytest
uv run ruff check
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # → http://localhost:5173 (proxies /api → http://127.0.0.1:8000)
npm run build        # production bundle in frontend/dist
npm run lint
```

The frontend's backend URL is controlled by:

- `VITE_API_BASE_URL` — set to e.g. `https://promptoptimizer.example.com` when
  deploying frontend and backend separately. Leave unset and rely on the
  `/api` proxy when running both locally.

## API reference (backend)

| Method | Path                | Body                                              | Returns                              |
| ------ | ------------------- | ------------------------------------------------- | ------------------------------------ |
| GET    | `/api/health`       | —                                                 | `{ status, version, supported_models }` |
| POST   | `/api/tokens/count` | `{ text, model? }`                                | `{ tokens, model, characters }`     |
| POST   | `/api/optimize`     | `{ prompt, mode, ai_mode, model?, customization }` | Structured result (above)            |

`mode`: `"minimal" | "balanced" | "quality"`
`ai_mode`: `"chatgpt" | "claude" | "gemini" | "universal"`
`model`: any key in `supported_models` (controls tokenizer encoding).

## Deployment

- **Frontend**: any static host (Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, devinapps).
  The app works **standalone** — token counting falls back to `gpt-tokenizer`.
- **Backend**: any container / FaaS (Fly.io, Railway, Render, Cloud Run). The
  pyproject is hatchling-based; standard `uvicorn app.main:app` works.

## License

MIT — see [LICENSE](LICENSE).
