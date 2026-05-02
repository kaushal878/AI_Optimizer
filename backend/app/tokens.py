"""Token counting utilities backed by tiktoken.

Encodings are cached on first use so repeated calls are cheap. We expose a
small surface area that the API layer (and tests) can rely on.
"""

from __future__ import annotations

from functools import lru_cache

import tiktoken

# Logical model name -> tiktoken encoding name.
# We keep this conservative: anything we don't recognise falls back to o200k_base
# (the modern OpenAI encoding) which is a reasonable proxy for current frontier
# tokenizers across vendors.
MODEL_TO_ENCODING: dict[str, str] = {
    "gpt-4o": "o200k_base",
    "gpt-4o-mini": "o200k_base",
    "gpt-4-turbo": "cl100k_base",
    "gpt-4": "cl100k_base",
    "gpt-3.5-turbo": "cl100k_base",
    "claude-3.5-sonnet": "cl100k_base",
    "claude-3-opus": "cl100k_base",
    "claude-3-haiku": "cl100k_base",
    "gemini-1.5-pro": "cl100k_base",
    "gemini-1.5-flash": "cl100k_base",
    "universal": "o200k_base",
}

DEFAULT_ENCODING = "o200k_base"


@lru_cache(maxsize=8)
def _get_encoding(name: str) -> tiktoken.Encoding:
    return tiktoken.get_encoding(name)


def encoding_for_model(model: str | None) -> tiktoken.Encoding:
    """Return the tiktoken encoding most appropriate for ``model``."""
    name = MODEL_TO_ENCODING.get((model or "").lower(), DEFAULT_ENCODING)
    return _get_encoding(name)


def count_tokens(text: str, model: str | None = None) -> int:
    """Count tokens in ``text`` using the encoding mapped from ``model``."""
    if not text:
        return 0
    enc = encoding_for_model(model)
    return len(enc.encode(text, disallowed_special=()))
