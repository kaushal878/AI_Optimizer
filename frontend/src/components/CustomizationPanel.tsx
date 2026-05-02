import {
  BarChart3,
  Code2,
  ListOrdered,
  Smile,
  Sparkles,
  Table,
  Workflow,
} from 'lucide-react'
import type { CustomizationFlags } from '../types'
import { cn } from '../lib/cn'

interface CustomizationPanelProps {
  value: CustomizationFlags
  onChange: (next: CustomizationFlags) => void
}

const TOGGLES: {
  key: keyof CustomizationFlags
  label: string
  hint: string
  icon: typeof BarChart3
}[] = [
  { key: 'add_examples', label: 'Examples', hint: 'Adds 1–2 worked examples', icon: Sparkles },
  { key: 'add_step_by_step', label: 'Step-by-step', hint: 'Numbered reasoning + summary', icon: ListOrdered },
  { key: 'add_formatting', label: 'Tables / bullets', hint: 'Markdown table when comparing', icon: Table },
  { key: 'add_emojis', label: 'Emoji headings', hint: 'One emoji per heading max', icon: Smile },
  { key: 'add_diagrams', label: 'Mermaid diagram', hint: 'Flowchart / sequence', icon: Workflow },
  { key: 'add_charts', label: 'Charts', hint: 'Chart.js JSON + Mermaid fallback', icon: BarChart3 },
  { key: 'add_code_blocks', label: 'Code blocks', hint: 'Fenced ```lang blocks', icon: Code2 },
]

export function CustomizationPanel({ value, onChange }: CustomizationPanelProps) {
  const toggle = (key: keyof CustomizationFlags) =>
    onChange({ ...value, [key]: !value[key] })

  return (
    <div>
      <p className="label mb-2">Smart enhancements</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {TOGGLES.map((t) => {
          const Icon = t.icon
          const active = value[t.key]
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => toggle(t.key)}
              className={cn(
                'group flex items-start gap-2 px-3 py-2.5 rounded-lg ring-1 ring-inset text-left transition',
                active
                  ? 'bg-brand-50 dark:bg-brand-500/10 ring-brand-300 dark:ring-brand-500/40'
                  : 'bg-white/60 dark:bg-slate-900/60 ring-slate-200 dark:ring-slate-800 hover:bg-white dark:hover:bg-slate-900'
              )}
            >
              <Icon
                className={cn(
                  'size-4 mt-0.5 shrink-0',
                  active ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400'
                )}
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold leading-tight">{t.label}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {t.hint}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
