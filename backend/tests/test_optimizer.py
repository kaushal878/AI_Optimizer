"""Smoke tests for the rule-based optimizer + tiktoken integration."""

from __future__ import annotations

from app.optimizer import CustomizationFlags, OptimizeRequest, optimize
from app.tokens import count_tokens


def test_optimize_balanced_reduces_tokens_on_verbose_prompt() -> None:
    verbose = (
        "Hi there! I would like to kindly ask you, please, if you could in order to "
        "help me, give a very detailed explanation of how recursion works in Python. "
        "Basically, I just want to actually understand it. It is important to note "
        "that I am a beginner. Due to the fact that I have never used recursion, "
        "could you please walk me through the topic step by step. Please note that "
        "I would really appreciate it if you could include examples. Thank you so much!"
    )
    req = OptimizeRequest(prompt=verbose, mode="balanced", ai_mode="chatgpt")
    result = optimize(req)

    original_tokens = count_tokens(verbose, "gpt-4o")
    optimized_tokens = count_tokens(result.optimized_prompt, "gpt-4o")

    assert optimized_tokens < original_tokens, result.optimized_prompt
    assert "please" not in result.optimized_prompt.lower()
    assert any(e.label.startswith("Compressed") for e in result.enhancements)


def test_optimize_detects_chart_intent() -> None:
    prompt = "Generate a bar chart of monthly revenue for 2023 (Jan: 10k, Feb: 15k, Mar: 22k)."
    req = OptimizeRequest(
        prompt=prompt,
        mode="balanced",
        customization=CustomizationFlags(add_charts=True),
    )
    result = optimize(req)
    assert result.intents[0].intent == "chart"
    assert "Chart.js" in result.optimized_prompt or "chart.js" in result.optimized_prompt.lower()


def test_optimize_quality_keeps_politeness() -> None:
    prompt = "Hi there, please explain quicksort. Thank you!"
    req = OptimizeRequest(prompt=prompt, mode="quality", ai_mode="claude")
    result = optimize(req)
    assert "please" in result.optimized_prompt.lower()


def test_count_tokens_handles_unknown_model() -> None:
    assert count_tokens("hello world", "some-future-model") > 0


def test_optimize_minimal_strips_articles() -> None:
    prompt = "The cat sat on the mat. A dog barked at an owl."
    req = OptimizeRequest(prompt=prompt, mode="minimal", ai_mode="universal")
    result = optimize(req)
    # Minimal mode trims standalone articles; first words should no longer be 'The' / 'A'.
    body = result.optimized_prompt.split("\n\n", 1)[-1]
    assert " the " not in body.lower()
