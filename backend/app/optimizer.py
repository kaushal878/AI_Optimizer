"""Rule-based prompt optimizer.

The engine is deliberately deterministic and explainable: every transformation
records a short reason that the API surfaces to the UI as ``enhancements``.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Literal

from .intent import IntentSignal, detect_intents

Mode = Literal["minimal", "balanced", "quality"]
AIMode = Literal[
    "chatgpt",
    "claude",
    "gemini",
    "universal",
]


@dataclass
class CustomizationFlags:
    add_examples: bool = False
    add_step_by_step: bool = False
    add_formatting: bool = False
    add_emojis: bool = False
    add_diagrams: bool = False
    add_charts: bool = False
    add_code_blocks: bool = False


@dataclass
class OptimizeRequest:
    prompt: str
    mode: Mode = "balanced"
    ai_mode: AIMode = "universal"
    customization: CustomizationFlags = field(default_factory=CustomizationFlags)


@dataclass
class Enhancement:
    label: str
    detail: str


# ---------------------------------------------------------------------------
# Verbose-phrase compression table
# ---------------------------------------------------------------------------
# These pairs come from common prompt-engineering style guides. We apply them
# case-insensitively but preserve the matched word's leading capitalisation so
# sentence-initial replacements still read naturally.
PHRASE_COMPRESSIONS: tuple[tuple[str, str], ...] = (
    (r"\bin order to\b", "to"),
    (r"\bdue to the fact that\b", "because"),
    (r"\bfor the purpose of\b", "to"),
    (r"\bwith regard to\b", "about"),
    (r"\bin the event that\b", "if"),
    (r"\bat this point in time\b", "now"),
    (r"\bat the present time\b", "now"),
    (r"\bin the near future\b", "soon"),
    (r"\bin spite of the fact that\b", "although"),
    (r"\bdespite the fact that\b", "although"),
    (r"\ba large number of\b", "many"),
    (r"\ba majority of\b", "most"),
    (r"\bthe majority of\b", "most"),
    (r"\bon a regular basis\b", "regularly"),
    (r"\bon a daily basis\b", "daily"),
    (r"\bin the process of\b", ""),
    (r"\bit is important to note that\b", ""),
    (r"\bit should be noted that\b", ""),
    (r"\bit is worth mentioning that\b", ""),
    (r"\bplease be advised that\b", ""),
    (r"\bplease note that\b", ""),
    (r"\bi would like to\b", "I'll"),
    (r"\bi am writing to\b", ""),
    (r"\bcould you please\b", "please"),
    (r"\bwould you be able to\b", "can you"),
    (r"\bare able to\b", "can"),
    (r"\bis able to\b", "can"),
    (r"\bin a manner that is\b", ""),
    (r"\bin a way that is\b", ""),
    (r"\bas a matter of fact\b", ""),
    (r"\bfor all intents and purposes\b", ""),
    (r"\bneedless to say\b", ""),
    (r"\bin my (?:humble )?opinion\b", ""),
    (r"\bbasically\b", ""),
    (r"\bactually\b", ""),
    (r"\bjust\b", ""),
    (r"\bvery\b", ""),
    (r"\bquite\b", ""),
    (r"\breally\b", ""),
    (r"\bsort of\b", ""),
    (r"\bkind of\b", ""),
)

POLITENESS_FILLERS = (
    r"\bplease\b",
    r"\bkindly\b",
    r"\bthank you( so much)?\b",
    r"\bthanks( a lot)?\b",
    r"\bappreciate it\b",
    r"\bappreciated\b",
    r"\bif you don't mind\b",
    r"\bif possible\b",
    r"\bwhen you have a moment\b",
)

GREETING_RE = re.compile(
    r"^\s*(hi|hello|hey|greetings|good (morning|afternoon|evening))[!,. ]*",
    re.I,
)
SIGNOFF_RE = re.compile(
    r"\b(thanks|thank you|cheers|regards|best|sincerely)[!,. ]*$",
    re.I,
)


# ---------------------------------------------------------------------------
# Mode profiles
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class ModeProfile:
    collapse_whitespace: bool
    compress_phrases: bool
    strip_politeness: bool
    strip_greetings: bool
    strip_filler_qualifiers: bool
    dedupe_sentences: bool
    article_trim: bool


MODE_PROFILES: dict[Mode, ModeProfile] = {
    "minimal": ModeProfile(
        collapse_whitespace=True,
        compress_phrases=True,
        strip_politeness=True,
        strip_greetings=True,
        strip_filler_qualifiers=True,
        dedupe_sentences=True,
        article_trim=True,
    ),
    "balanced": ModeProfile(
        collapse_whitespace=True,
        compress_phrases=True,
        strip_politeness=True,
        strip_greetings=True,
        strip_filler_qualifiers=True,
        dedupe_sentences=True,
        article_trim=False,
    ),
    "quality": ModeProfile(
        collapse_whitespace=True,
        compress_phrases=True,
        strip_politeness=False,
        strip_greetings=False,
        strip_filler_qualifiers=False,
        dedupe_sentences=False,
        article_trim=False,
    ),
}


# ---------------------------------------------------------------------------
# AI-mode system prefixes (kept terse; quality mode uses these fully, others
# are trimmed by the caller).
# ---------------------------------------------------------------------------
AI_MODE_PREFIX: dict[AIMode, str] = {
    "chatgpt": "You are a senior assistant. Answer concisely and accurately.",
    "claude": "You are Claude. Think step-by-step but only show conclusions unless asked.",
    "gemini": "You are Gemini. Be factual, structured, and cite uncertainty.",
    "universal": "You are an expert assistant. Be precise, structured, and concise.",
}


def _smart_replace(pattern: str, replacement: str, text: str) -> str:
    """Case-insensitive regex replace that preserves the first-letter case."""

    regex = re.compile(pattern, re.IGNORECASE)

    def _sub(match: re.Match[str]) -> str:
        original = match.group(0)
        if not replacement:
            return ""
        if original[:1].isupper():
            return replacement[:1].upper() + replacement[1:]
        return replacement

    return regex.sub(_sub, text)


def _compress_phrases(text: str, enhancements: list[Enhancement]) -> str:
    before = text
    hit_phrases: list[str] = []
    for pattern, replacement in PHRASE_COMPRESSIONS:
        new = _smart_replace(pattern, replacement, text)
        if new != text:
            hit_phrases.append(pattern.strip("\\b"))
        text = new
    if hit_phrases and text != before:
        enhancements.append(
            Enhancement(
                "Compressed verbose phrases",
                f"Replaced {len(hit_phrases)} wordy patterns with concise equivalents.",
            )
        )
    return text


def _strip_politeness(text: str, enhancements: list[Enhancement]) -> str:
    before = text
    for pattern in POLITENESS_FILLERS:
        text = _smart_replace(pattern, "", text)
    if text != before:
        enhancements.append(
            Enhancement(
                "Removed politeness fillers",
                "Stripped 'please / thanks / kindly'-style fillers that don't change meaning.",
            )
        )
    return text


def _strip_greetings(text: str, enhancements: list[Enhancement]) -> str:
    before = text
    text = GREETING_RE.sub("", text)
    text = SIGNOFF_RE.sub("", text)
    if text != before:
        enhancements.append(
            Enhancement(
                "Removed greetings & sign-offs",
                "Trimmed 'Hi / Hello / Thanks / Cheers'-style chrome.",
            )
        )
    return text


def _collapse_whitespace(text: str, enhancements: list[Enhancement]) -> str:
    before = text
    # Collapse runs of spaces/tabs but preserve paragraph breaks.
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" *\n *", "\n", text)
    text = text.strip()
    if text != before:
        enhancements.append(
            Enhancement(
                "Collapsed whitespace",
                "Normalised runs of spaces, tabs, and blank lines.",
            )
        )
    return text


def _dedupe_sentences(text: str, enhancements: list[Enhancement]) -> str:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    seen: set[str] = set()
    out: list[str] = []
    removed = 0
    for s in sentences:
        key = s.strip().lower()
        if not key:
            out.append(s)
            continue
        if key in seen:
            removed += 1
            continue
        seen.add(key)
        out.append(s)
    if removed:
        enhancements.append(
            Enhancement(
                "Removed duplicate sentences",
                f"Dropped {removed} sentence(s) that repeated earlier content.",
            )
        )
    return " ".join(out)


def _article_trim(text: str, enhancements: list[Enhancement]) -> str:
    """Aggressive: drop standalone leading articles ('the report' -> 'report')."""
    before = text
    text = re.sub(r"\b(?:the|a|an) (?=\w)", "", text, flags=re.IGNORECASE)
    if text != before:
        enhancements.append(
            Enhancement(
                "Trimmed articles",
                "Removed leading articles (the / a / an) where safe.",
            )
        )
    return text


# ---------------------------------------------------------------------------
# Intent-driven additions
# ---------------------------------------------------------------------------
def _intent_additions(
    text: str,
    intents: list[IntentSignal],
    custom: CustomizationFlags,
    mode: Mode,
    enhancements: list[Enhancement],
) -> str:
    """Append intent-aware structural hints (only when relevant)."""

    appendix: list[str] = []
    primary = intents[0].intent if intents else "general"

    if (custom.add_charts or primary == "chart") and "chart.js" not in text.lower():
        appendix.append(
            "Output: Chart.js JSON config (type, data.labels, data.datasets) AND a Mermaid "
            "fallback. Include axis labels and a one-line takeaway."
        )
        enhancements.append(
            Enhancement(
                "Chart output schema",
                "Asked the model to return Chart.js JSON + Mermaid fallback so the UI can render it directly.",
            )
        )

    if (custom.add_code_blocks or primary == "code") and "```" not in text:
        appendix.append(
            "Return runnable code in fenced blocks (```lang ... ```). Include imports, "
            "types, and 1–2 line comments only where intent isn't obvious."
        )
        enhancements.append(
            Enhancement(
                "Code formatting contract",
                "Required fenced code blocks with imports + minimal comments.",
            )
        )

    if custom.add_step_by_step or primary == "explanation":
        appendix.append(
            "Structure: numbered steps. End with a 1-sentence summary."
            if mode != "minimal"
            else "Numbered steps + 1-line summary."
        )
        enhancements.append(
            Enhancement(
                "Step-by-step structure",
                "Required numbered reasoning ending in a one-line summary.",
            )
        )

    if custom.add_examples:
        appendix.append("Include 1–2 worked examples.")
        enhancements.append(
            Enhancement("Worked examples", "Asked for 1–2 concrete examples.")
        )

    if custom.add_formatting or primary == "comparison":
        appendix.append(
            "Format: Markdown table with columns as appropriate (e.g. Option | Pros | Cons | When to use)."
        )
        enhancements.append(
            Enhancement(
                "Tabular formatting",
                "Required a Markdown comparison table (Option / Pros / Cons / When to use).",
            )
        )

    if custom.add_diagrams:
        appendix.append(
            "Include a Mermaid diagram (flowchart / sequence) inside a ```mermaid block."
        )
        enhancements.append(
            Enhancement(
                "Mermaid diagram",
                "Asked for a Mermaid flowchart/sequence diagram.",
            )
        )

    if custom.add_emojis and mode != "minimal":
        appendix.append("Use a single leading emoji per section heading. No emoji spam.")
        enhancements.append(
            Enhancement("Emoji headings", "Allowed one emoji per heading.")
        )

    if not appendix:
        return text

    joiner = "\n\n" if mode != "minimal" else "\n"
    return text.rstrip() + joiner + "\n".join(f"- {a}" for a in appendix)


def _ai_mode_prefix(text: str, ai_mode: AIMode, mode: Mode, enhancements: list[Enhancement]) -> str:
    prefix = AI_MODE_PREFIX[ai_mode]
    if mode == "minimal":
        # Trim aggressively in minimal mode.
        prefix = prefix.split(".", 1)[0] + "."
    if not text.lower().startswith(prefix.lower()[:30]):
        enhancements.append(
            Enhancement(
                f"{ai_mode.title()} system prefix",
                f"Prepended a tuned system prompt for {ai_mode}.",
            )
        )
        return prefix + "\n\n" + text
    return text


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
@dataclass
class OptimizeResult:
    optimized_prompt: str
    enhancements: list[Enhancement]
    intents: list[IntentSignal]
    suggested_format: str

    def to_dict(self, *, original_tokens: int, optimized_tokens: int) -> dict:
        reduction = 0.0
        if original_tokens:
            reduction = round(
                (original_tokens - optimized_tokens) / original_tokens * 100, 1
            )
        return {
            "optimized_prompt": self.optimized_prompt,
            "token_reduction": f"{reduction}%",
            "token_reduction_pct": reduction,
            "original_tokens": original_tokens,
            "optimized_tokens": optimized_tokens,
            "enhancements": [
                {"label": e.label, "detail": e.detail} for e in self.enhancements
            ],
            "intents": [
                {
                    "intent": i.intent,
                    "confidence": round(i.confidence, 3),
                    "reasons": list(i.reasons),
                }
                for i in self.intents
            ],
            "suggested_format": self.suggested_format,
            "download_ready": True,
        }


SUGGESTED_FORMAT: dict[str, str] = {
    "chart": "Chart.js JSON + Mermaid fallback",
    "code": "Fenced code blocks (```lang)",
    "explanation": "Numbered steps + 1-line summary",
    "comparison": "Markdown comparison table",
    "general": "Plain Markdown",
}


def optimize(req: OptimizeRequest) -> OptimizeResult:
    text = req.prompt
    enhancements: list[Enhancement] = []
    profile = MODE_PROFILES[req.mode]

    if profile.strip_greetings:
        text = _strip_greetings(text, enhancements)
    if profile.strip_politeness:
        text = _strip_politeness(text, enhancements)
    if profile.compress_phrases:
        text = _compress_phrases(text, enhancements)
    if profile.dedupe_sentences:
        text = _dedupe_sentences(text, enhancements)
    if profile.article_trim:
        text = _article_trim(text, enhancements)
    if profile.collapse_whitespace:
        text = _collapse_whitespace(text, enhancements)

    intents = detect_intents(text)
    text = _intent_additions(text, intents, req.customization, req.mode, enhancements)
    text = _ai_mode_prefix(text, req.ai_mode, req.mode, enhancements)
    text = _collapse_whitespace(text, enhancements=[])  # final tidy, don't double-record

    suggested_format = SUGGESTED_FORMAT.get(intents[0].intent, "Plain Markdown")

    return OptimizeResult(
        optimized_prompt=text,
        enhancements=enhancements,
        intents=intents,
        suggested_format=suggested_format,
    )
