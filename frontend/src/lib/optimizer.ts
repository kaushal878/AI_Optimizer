import type {
  AIMode,
  CustomizationFlags,
  Enhancement,
  IntentSignal,
  Intent,
  Mode,
  OptimizeResult,
} from '../types'
import { detectIntents } from './intent'
import { countTokensLocal } from './tokens'

interface ModeProfile {
  collapseWhitespace: boolean
  compressPhrases: boolean
  stripPoliteness: boolean
  stripGreetings: boolean
  dedupeSentences: boolean
  articleTrim: boolean
}

const MODE_PROFILES: Record<Mode, ModeProfile> = {
  minimal: {
    collapseWhitespace: true,
    compressPhrases: true,
    stripPoliteness: true,
    stripGreetings: true,
    dedupeSentences: true,
    articleTrim: true,
  },
  balanced: {
    collapseWhitespace: true,
    compressPhrases: true,
    stripPoliteness: true,
    stripGreetings: true,
    dedupeSentences: true,
    articleTrim: false,
  },
  quality: {
    collapseWhitespace: true,
    compressPhrases: true,
    stripPoliteness: false,
    stripGreetings: false,
    dedupeSentences: false,
    articleTrim: false,
  },
}

const PHRASE_COMPRESSIONS: [RegExp, string][] = [
  [/\bin order to\b/gi, 'to'],
  [/\bdue to the fact that\b/gi, 'because'],
  [/\bfor the purpose of\b/gi, 'to'],
  [/\bwith regard to\b/gi, 'about'],
  [/\bin the event that\b/gi, 'if'],
  [/\bat this point in time\b/gi, 'now'],
  [/\bat the present time\b/gi, 'now'],
  [/\bin the near future\b/gi, 'soon'],
  [/\bin spite of the fact that\b/gi, 'although'],
  [/\bdespite the fact that\b/gi, 'although'],
  [/\ba large number of\b/gi, 'many'],
  [/\ba majority of\b/gi, 'most'],
  [/\bthe majority of\b/gi, 'most'],
  [/\bon a regular basis\b/gi, 'regularly'],
  [/\bon a daily basis\b/gi, 'daily'],
  [/\bin the process of\b/gi, ''],
  [/\bit is important to note that\b/gi, ''],
  [/\bit should be noted that\b/gi, ''],
  [/\bit is worth mentioning that\b/gi, ''],
  [/\bplease be advised that\b/gi, ''],
  [/\bplease note that\b/gi, ''],
  [/\bi would like to\b/gi, "I'll"],
  [/\bi am writing to\b/gi, ''],
  [/\bcould you please\b/gi, 'please'],
  [/\bwould you be able to\b/gi, 'can you'],
  [/\bare able to\b/gi, 'can'],
  [/\bis able to\b/gi, 'can'],
  [/\bin a manner that is\b/gi, ''],
  [/\bin a way that is\b/gi, ''],
  [/\bas a matter of fact\b/gi, ''],
  [/\bfor all intents and purposes\b/gi, ''],
  [/\bneedless to say\b/gi, ''],
  [/\bin my (?:humble )?opinion\b/gi, ''],
  [/\bbasically\b/gi, ''],
  [/\bactually\b/gi, ''],
  [/\bjust\b/gi, ''],
  [/\bvery\b/gi, ''],
  [/\bquite\b/gi, ''],
  [/\breally\b/gi, ''],
  [/\bsort of\b/gi, ''],
  [/\bkind of\b/gi, ''],
]

const POLITENESS_FILLERS: RegExp[] = [
  /\bplease\b/gi,
  /\bkindly\b/gi,
  /\bthank you( so much)?\b/gi,
  /\bthanks( a lot)?\b/gi,
  /\bappreciate it\b/gi,
  /\bappreciated\b/gi,
  /\bif you don't mind\b/gi,
  /\bif possible\b/gi,
  /\bwhen you have a moment\b/gi,
]

const GREETING_RE = /^\s*(hi|hello|hey|greetings|good (morning|afternoon|evening))[!,. ]*/i
const SIGNOFF_RE = /\b(thanks|thank you|cheers|regards|best|sincerely)[!,. ]*$/i

const AI_MODE_PREFIX: Record<AIMode, string> = {
  chatgpt: 'You are a senior assistant. Answer concisely and accurately.',
  claude: 'You are Claude. Think step-by-step but only show conclusions unless asked.',
  gemini: 'You are Gemini. Be factual, structured, and cite uncertainty.',
  universal: 'You are an expert assistant. Be precise, structured, and concise.',
}

const SUGGESTED_FORMAT: Record<Intent, string> = {
  chart: 'Chart.js JSON + Mermaid fallback',
  code: 'Fenced code blocks (```lang)',
  explanation: 'Numbered steps + 1-line summary',
  comparison: 'Markdown comparison table',
  general: 'Plain Markdown',
}

function smartReplace(text: string, pattern: RegExp, replacement: string): string {
  return text.replace(pattern, (match) => {
    if (!replacement) return ''
    if (match[0] && match[0] === match[0].toUpperCase() && /[a-z]/i.test(match[0])) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1)
    }
    return replacement
  })
}

function compressPhrases(text: string, enhancements: Enhancement[]): string {
  let count = 0
  for (const [pattern, replacement] of PHRASE_COMPRESSIONS) {
    const before = text
    text = smartReplace(text, pattern, replacement)
    if (before !== text) count++
  }
  if (count) {
    enhancements.push({
      label: 'Compressed verbose phrases',
      detail: `Replaced ${count} wordy patterns with concise equivalents.`,
    })
  }
  return text
}

function stripPoliteness(text: string, enhancements: Enhancement[]): string {
  const before = text
  for (const pattern of POLITENESS_FILLERS) {
    text = smartReplace(text, pattern, '')
  }
  if (text !== before) {
    enhancements.push({
      label: 'Removed politeness fillers',
      detail: "Stripped 'please / thanks / kindly'-style fillers that don't change meaning.",
    })
  }
  return text
}

function stripGreetings(text: string, enhancements: Enhancement[]): string {
  const before = text
  text = text.replace(GREETING_RE, '').replace(SIGNOFF_RE, '')
  if (text !== before) {
    enhancements.push({
      label: 'Removed greetings & sign-offs',
      detail: "Trimmed 'Hi / Hello / Thanks / Cheers'-style chrome.",
    })
  }
  return text
}

function collapseWhitespace(text: string, enhancements?: Enhancement[]): string {
  const before = text
  text = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').replace(/ *\n */g, '\n').trim()
  if (enhancements && text !== before) {
    enhancements.push({
      label: 'Collapsed whitespace',
      detail: 'Normalised runs of spaces, tabs, and blank lines.',
    })
  }
  return text
}

function dedupeSentences(text: string, enhancements: Enhancement[]): string {
  const sentences = text.split(/(?<=[.!?])\s+/)
  const seen = new Set<string>()
  const out: string[] = []
  let removed = 0
  for (const s of sentences) {
    const key = s.trim().toLowerCase()
    if (!key) {
      out.push(s)
      continue
    }
    if (seen.has(key)) {
      removed++
      continue
    }
    seen.add(key)
    out.push(s)
  }
  if (removed) {
    enhancements.push({
      label: 'Removed duplicate sentences',
      detail: `Dropped ${removed} sentence(s) that repeated earlier content.`,
    })
  }
  return out.join(' ')
}

function articleTrim(text: string, enhancements: Enhancement[]): string {
  const before = text
  text = text.replace(/\b(?:the|a|an) (?=\w)/gi, '')
  if (text !== before) {
    enhancements.push({
      label: 'Trimmed articles',
      detail: 'Removed leading articles (the / a / an) where safe.',
    })
  }
  return text
}

function intentAdditions(
  text: string,
  intents: IntentSignal[],
  custom: CustomizationFlags,
  mode: Mode,
  enhancements: Enhancement[]
): string {
  const appendix: string[] = []
  const primary = intents[0]?.intent ?? 'general'

  if ((custom.add_charts || primary === 'chart') && !text.toLowerCase().includes('chart.js')) {
    appendix.push(
      'Output: Chart.js JSON config (type, data.labels, data.datasets) AND a Mermaid fallback. Include axis labels and a one-line takeaway.'
    )
    enhancements.push({
      label: 'Chart output schema',
      detail:
        'Asked the model to return Chart.js JSON + Mermaid fallback so the UI can render it directly.',
    })
  }

  if ((custom.add_code_blocks || primary === 'code') && !text.includes('```')) {
    appendix.push(
      "Return runnable code in fenced blocks (```lang ... ```). Include imports, types, and 1–2 line comments only where intent isn't obvious."
    )
    enhancements.push({
      label: 'Code formatting contract',
      detail: 'Required fenced code blocks with imports + minimal comments.',
    })
  }

  if (custom.add_step_by_step || primary === 'explanation') {
    appendix.push(
      mode === 'minimal'
        ? 'Numbered steps + 1-line summary.'
        : 'Structure: numbered steps. End with a 1-sentence summary.'
    )
    enhancements.push({
      label: 'Step-by-step structure',
      detail: 'Required numbered reasoning ending in a one-line summary.',
    })
  }

  if (custom.add_examples) {
    appendix.push('Include 1–2 worked examples.')
    enhancements.push({
      label: 'Worked examples',
      detail: 'Asked for 1–2 concrete examples.',
    })
  }

  if (custom.add_formatting || primary === 'comparison') {
    appendix.push(
      'Format: Markdown table with columns as appropriate (e.g. Option | Pros | Cons | When to use).'
    )
    enhancements.push({
      label: 'Tabular formatting',
      detail: 'Required a Markdown comparison table (Option / Pros / Cons / When to use).',
    })
  }

  if (custom.add_diagrams) {
    appendix.push('Include a Mermaid diagram (flowchart / sequence) inside a ```mermaid block.')
    enhancements.push({
      label: 'Mermaid diagram',
      detail: 'Asked for a Mermaid flowchart/sequence diagram.',
    })
  }

  if (custom.add_emojis && mode !== 'minimal') {
    appendix.push('Use a single leading emoji per section heading. No emoji spam.')
    enhancements.push({
      label: 'Emoji headings',
      detail: 'Allowed one emoji per heading.',
    })
  }

  if (!appendix.length) return text

  const joiner = mode === 'minimal' ? '\n' : '\n\n'
  return text.replace(/\s+$/, '') + joiner + appendix.map((a) => `- ${a}`).join('\n')
}

function aiModePrefix(text: string, aiMode: AIMode, mode: Mode, enhancements: Enhancement[]): string {
  let prefix = AI_MODE_PREFIX[aiMode]
  if (mode === 'minimal') {
    prefix = prefix.split('.', 1)[0] + '.'
  }
  if (text.toLowerCase().startsWith(prefix.toLowerCase().slice(0, 30))) {
    return text
  }
  enhancements.push({
    label: `${aiMode === 'chatgpt' ? 'ChatGPT' : aiMode.charAt(0).toUpperCase() + aiMode.slice(1)} system prefix`,
    detail: `Prepended a tuned system prompt for ${aiMode}.`,
  })
  return prefix + '\n\n' + text
}

export interface OptimizeOptions {
  prompt: string
  mode: Mode
  ai_mode: AIMode
  customization: CustomizationFlags
}

export function optimizeLocal(opts: OptimizeOptions): OptimizeResult {
  let text = opts.prompt
  const enhancements: Enhancement[] = []
  const profile = MODE_PROFILES[opts.mode]

  if (profile.stripGreetings) text = stripGreetings(text, enhancements)
  if (profile.stripPoliteness) text = stripPoliteness(text, enhancements)
  if (profile.compressPhrases) text = compressPhrases(text, enhancements)
  if (profile.dedupeSentences) text = dedupeSentences(text, enhancements)
  if (profile.articleTrim) text = articleTrim(text, enhancements)
  if (profile.collapseWhitespace) text = collapseWhitespace(text, enhancements)

  const intents = detectIntents(text)
  text = intentAdditions(text, intents, opts.customization, opts.mode, enhancements)
  text = aiModePrefix(text, opts.ai_mode, opts.mode, enhancements)
  text = collapseWhitespace(text)

  const originalTokens = countTokensLocal(opts.prompt)
  const optimizedTokens = countTokensLocal(text)
  const reduction = originalTokens
    ? Math.round(((originalTokens - optimizedTokens) / originalTokens) * 1000) / 10
    : 0

  return {
    optimized_prompt: text,
    token_reduction: `${reduction}%`,
    token_reduction_pct: reduction,
    original_tokens: originalTokens,
    optimized_tokens: optimizedTokens,
    enhancements,
    intents,
    suggested_format: SUGGESTED_FORMAT[intents[0].intent],
    download_ready: true,
    model: 'local-gpt-tokenizer',
  }
}
