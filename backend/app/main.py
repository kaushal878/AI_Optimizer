"""FastAPI entrypoint for PromptOptimizer AI."""

from __future__ import annotations

import os
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import __version__
from .optimizer import (
    AIMode,
    CustomizationFlags,
    Mode,
    OptimizeRequest,
    optimize,
)
from .tokens import MODEL_TO_ENCODING, count_tokens

app = FastAPI(
    title="PromptOptimizer AI",
    version=__version__,
    description=(
        "Rule-based prompt optimizer with accurate tiktoken counting and "
        "intent-aware enhancements. Pairs with the React frontend in `/frontend`."
    ),
)

# CORS — wide open in dev; in production set ALLOWED_ORIGINS to a comma-separated list.
_origins = os.getenv("ALLOWED_ORIGINS", "*")
allow_origins = ["*"] if _origins == "*" else [o.strip() for o in _origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CustomizationModel(BaseModel):
    add_examples: bool = False
    add_step_by_step: bool = False
    add_formatting: bool = False
    add_emojis: bool = False
    add_diagrams: bool = False
    add_charts: bool = False
    add_code_blocks: bool = False


class OptimizeBody(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=200_000)
    mode: Mode = "balanced"
    ai_mode: AIMode = "universal"
    model: str | None = Field(
        default=None,
        description="Optional model name used for tokenization (e.g. gpt-4o, claude-3.5-sonnet).",
    )
    customization: CustomizationModel = CustomizationModel()


class CountBody(BaseModel):
    text: str = Field(..., max_length=400_000)
    model: str | None = None


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "version": __version__,
        "supported_models": sorted(MODEL_TO_ENCODING.keys()),
    }


@app.post("/api/tokens/count")
def tokens_count(body: CountBody) -> dict[str, Any]:
    return {
        "tokens": count_tokens(body.text, body.model),
        "model": body.model,
        "characters": len(body.text),
    }


@app.post("/api/optimize")
def optimize_endpoint(body: OptimizeBody) -> dict[str, Any]:
    if not body.prompt.strip():
        raise HTTPException(status_code=400, detail="prompt must not be empty")

    req = OptimizeRequest(
        prompt=body.prompt,
        mode=body.mode,
        ai_mode=body.ai_mode,
        customization=CustomizationFlags(**body.customization.model_dump()),
    )
    result = optimize(req)
    original_tokens = count_tokens(body.prompt, body.model)
    optimized_tokens = count_tokens(result.optimized_prompt, body.model)
    payload = result.to_dict(
        original_tokens=original_tokens,
        optimized_tokens=optimized_tokens,
    )
    payload["model"] = body.model
    return payload


@app.get("/")
def root() -> dict[str, Any]:
    return {
        "name": "PromptOptimizer AI",
        "version": __version__,
        "endpoints": ["/api/health", "/api/tokens/count", "/api/optimize"],
    }
