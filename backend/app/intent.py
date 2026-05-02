"""Heuristic prompt-intent detection.

We keep this dependency-free on purpose: it has to run on every optimize call
and ship a deterministic explanation back to the UI. Each detector returns a
confidence score in [0.0, 1.0]; the caller selects the strongest signal(s).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

Intent = Literal["chart", "code", "explanation", "comparison", "general"]


@dataclass(frozen=True)
class IntentSignal:
    intent: Intent
    confidence: float
    reasons: tuple[str, ...]


CHART_KEYWORDS = (
    "chart",
    "graph",
    "plot",
    "visualize",
    "visualisation",
    "visualization",
    "bar chart",
    "line chart",
    "pie chart",
    "histogram",
    "scatter",
    "dashboard",
    "trend",
)

CODE_KEYWORDS = (
    "code",
    "function",
    "class",
    "implement",
    "refactor",
    "debug",
    "compile",
    "stack trace",
    "unit test",
    "regex",
    "snippet",
    "module",
    "library",
    "api",
    "endpoint",
    "sql query",
)

EXPLANATION_KEYWORDS = (
    "explain",
    "describe",
    "what is",
    "how does",
    "why is",
    "walk me through",
    "step by step",
    "step-by-step",
    "breakdown",
    "summary of",
    "overview of",
    "for a beginner",
)

COMPARISON_KEYWORDS = (
    "compare",
    "comparison",
    "vs",
    "versus",
    "pros and cons",
    "pros & cons",
    "difference between",
    "differences between",
    "tradeoffs",
    "trade-offs",
    "which is better",
)

CODE_FENCE_RE = re.compile(r"```|`[^`]+`")
NUMERIC_DATA_RE = re.compile(r"\b\d+(?:\.\d+)?\s*(?:%|usd|eur|gbp|k|m|million|billion)?\b", re.I)


def _keyword_score(text: str, keywords: tuple[str, ...]) -> tuple[float, tuple[str, ...]]:
    lower = text.lower()
    hits = tuple(k for k in keywords if k in lower)
    if not hits:
        return 0.0, ()
    # Saturate after a handful of matches; we mostly care that *something* hit.
    return min(1.0, 0.35 + 0.15 * len(hits)), hits


def detect_intents(text: str) -> list[IntentSignal]:
    """Return a sorted list of intents (highest confidence first)."""
    signals: list[IntentSignal] = []

    chart_score, chart_hits = _keyword_score(text, CHART_KEYWORDS)
    if NUMERIC_DATA_RE.search(text) and chart_score > 0:
        chart_score = min(1.0, chart_score + 0.2)
    if chart_score:
        signals.append(IntentSignal("chart", chart_score, chart_hits))

    code_score, code_hits = _keyword_score(text, CODE_KEYWORDS)
    if CODE_FENCE_RE.search(text):
        code_score = max(code_score, 0.7)
        code_hits = code_hits + ("code fence",)
    if code_score:
        signals.append(IntentSignal("code", code_score, code_hits))

    expl_score, expl_hits = _keyword_score(text, EXPLANATION_KEYWORDS)
    if expl_score:
        signals.append(IntentSignal("explanation", expl_score, expl_hits))

    cmp_score, cmp_hits = _keyword_score(text, COMPARISON_KEYWORDS)
    if cmp_score:
        signals.append(IntentSignal("comparison", cmp_score, cmp_hits))

    if not signals:
        signals.append(IntentSignal("general", 0.5, ("no specific intent keywords",)))

    signals.sort(key=lambda s: s.confidence, reverse=True)
    return signals


def primary_intent(text: str) -> IntentSignal:
    return detect_intents(text)[0]
