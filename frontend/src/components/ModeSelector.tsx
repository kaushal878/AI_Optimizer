import { Gauge, Scale, Sparkles } from 'lucide-react'
import type { Mode } from '../types'
import { cn } from '../lib/cn'

interface ModeSelectorProps {
  value: Mode
  onChange: (mode: Mode) => void
}

const MODES: {
  id: Mode
  title: string
  description: string
  icon: typeof Gauge
}[] = [
  {
    id: 'minimal',
    title: 'Minimal Tokens',
    description: 'Maximum compression. Strips politeness, articles, fillers.',
    icon: Gauge,
  },
  {
    id: 'balanced',
    title: 'Balanced',
    description: 'Good savings, preserves meaning and tone.',
    icon: Scale,
  },
  {
    id: 'quality',
    title: 'Maximum Quality',
    description: 'Light edits only. Keeps voice, adds structure.',
    icon: Sparkles,
  },
]

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div>
      <p className="label mb-2">Optimization mode</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {MODES.map((m) => {
          const Icon = m.icon
          const active = value === m.id
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              className={cn(
                'text-left rounded-xl ring-1 ring-inset px-3.5 py-3 transition flex flex-col gap-1.5',
                active
                  ? 'bg-brand-50 dark:bg-brand-500/10 ring-brand-300 dark:ring-brand-500/40 shadow-glow'
                  : 'bg-white/60 dark:bg-slate-900/60 ring-slate-200 dark:ring-slate-800 hover:bg-white dark:hover:bg-slate-900'
              )}
              type="button"
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={cn(
                    'size-4',
                    active ? 'text-brand-600 dark:text-brand-300' : 'text-slate-500'
                  )}
                />
                <span className="text-sm font-semibold">{m.title}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                {m.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
