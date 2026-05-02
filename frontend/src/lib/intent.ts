import type { Intent, IntentSignal } from '../types'

const CHART_KEYWORDS = [
  'chart',
  'graph',
  'plot',
  'visualize',
  'visualisation',
  'visualization',
  'bar chart',
  'line chart',
  'pie chart',
  'histogram',
  'scatter',
  'dashboard',
  'trend',
]

const CODE_KEYWORDS = [
  'code',
  'function',
  'class',
  'implement',
  'refactor',
  'debug',
  'compile',
  'stack trace',
  'unit test',
  'regex',
  'snippet',
  'module',
  'library',
  'api',
  'endpoint',
  'sql query',
]

const EXPLANATION_KEYWORDS = [
  'explain',
  'describe',
  'what is',
  'how does',
  'why is',
  'walk me through',
  'step by step',
  'step-by-step',
  'breakdown',
  'summary of',
  'overview of',
  'for a beginner',
]

const COMPARISON_KEYWORDS = [
  'compare',
  'comparison',
  ' vs ',
  ' versus ',
  'pros and cons',
  'pros & cons',
  'difference between',
  'differences between',
  'tradeoffs',
  'trade-offs',
  'which is better',
]

const CODE_FENCE_RE = /```|`[^`]+`/
const NUMERIC_DATA_RE =
  /\b\d+(?:\.\d+)?\s*(?:%|usd|eur|gbp|k|m|million|billion)?\b/i

function keywordScore(text: string, keywords: string[]): { score: number; hits: string[] } {
  const lower = text.toLowerCase()
  const hits = keywords.filter((k) => lower.includes(k))
  if (!hits.length) return { score: 0, hits: [] }
  return { score: Math.min(1, 0.35 + 0.15 * hits.length), hits }
}

export function detectIntents(text: string): IntentSignal[] {
  const signals: IntentSignal[] = []

  let chart = keywordScore(text, CHART_KEYWORDS)
  if (NUMERIC_DATA_RE.test(text) && chart.score > 0) {
    chart = { ...chart, score: Math.min(1, chart.score + 0.2) }
  }
  if (chart.score) signals.push({ intent: 'chart', confidence: chart.score, reasons: chart.hits })

  let code = keywordScore(text, CODE_KEYWORDS)
  if (CODE_FENCE_RE.test(text)) {
    code = { score: Math.max(code.score, 0.7), hits: [...code.hits, 'code fence'] }
  }
  if (code.score) signals.push({ intent: 'code', confidence: code.score, reasons: code.hits })

  const expl = keywordScore(text, EXPLANATION_KEYWORDS)
  if (expl.score)
    signals.push({ intent: 'explanation', confidence: expl.score, reasons: expl.hits })

  const cmp = keywordScore(text, COMPARISON_KEYWORDS)
  if (cmp.score)
    signals.push({ intent: 'comparison', confidence: cmp.score, reasons: cmp.hits })

  if (!signals.length) {
    signals.push({ intent: 'general', confidence: 0.5, reasons: ['no specific intent keywords'] })
  }

  signals.sort((a, b) => b.confidence - a.confidence)
  return signals
}

export function primaryIntent(text: string): Intent {
  return detectIntents(text)[0].intent
}
