export type Mode = 'minimal' | 'balanced' | 'quality'

export type AIMode = 'chatgpt' | 'claude' | 'gemini' | 'universal'

export type Intent = 'chart' | 'code' | 'explanation' | 'comparison' | 'general'

export interface CustomizationFlags {
  add_examples: boolean
  add_step_by_step: boolean
  add_formatting: boolean
  add_emojis: boolean
  add_diagrams: boolean
  add_charts: boolean
  add_code_blocks: boolean
}

export const DEFAULT_CUSTOMIZATION: CustomizationFlags = {
  add_examples: false,
  add_step_by_step: false,
  add_formatting: false,
  add_emojis: false,
  add_diagrams: false,
  add_charts: false,
  add_code_blocks: false,
}

export interface IntentSignal {
  intent: Intent
  confidence: number
  reasons: string[]
}

export interface Enhancement {
  label: string
  detail: string
}

export interface OptimizeResult {
  optimized_prompt: string
  token_reduction: string
  token_reduction_pct: number
  original_tokens: number
  optimized_tokens: number
  enhancements: Enhancement[]
  intents: IntentSignal[]
  suggested_format: string
  download_ready: true
  model: string
}

export interface HistoryEntry {
  id: string
  created_at: number
  original: string
  optimized: string
  mode: Mode
  ai_mode: AIMode
  customization: CustomizationFlags
  result: OptimizeResult
}

export interface PromptTemplate {
  id: string
  name: string
  category: string
  description: string
  prompt: string
}
