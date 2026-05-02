import type { AIMode } from '../types'

interface AIModeSelectorProps {
  value: AIMode
  onChange: (mode: AIMode) => void
}

const OPTIONS: { id: AIMode; label: string }[] = [
  { id: 'chatgpt', label: 'ChatGPT (OpenAI)' },
  { id: 'claude', label: 'Claude (Anthropic)' },
  { id: 'gemini', label: 'Gemini (Google)' },
  { id: 'universal', label: 'Universal' },
]

export function AIModeSelector({ value, onChange }: AIModeSelectorProps) {
  return (
    <div>
      <p className="label mb-2">Target AI</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AIMode)}
        className="w-full rounded-lg bg-white dark:bg-slate-900 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
