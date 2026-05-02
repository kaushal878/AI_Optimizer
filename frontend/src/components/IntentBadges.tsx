import {
  BarChart3,
  Brain,
  Code2,
  GitCompareArrows,
  Layers,
  type LucideIcon,
} from 'lucide-react'
import type { Intent, IntentSignal } from '../types'

const INTENT_META: Record<Intent, { label: string; icon: LucideIcon; tone: string }> = {
  chart: {
    label: 'Chart',
    icon: BarChart3,
    tone: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-500/30',
  },
  code: {
    label: 'Code',
    icon: Code2,
    tone: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-500/30',
  },
  explanation: {
    label: 'Explanation',
    icon: Brain,
    tone: 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-brand-200 dark:ring-brand-500/30',
  },
  comparison: {
    label: 'Comparison',
    icon: GitCompareArrows,
    tone: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-purple-200 dark:ring-purple-500/30',
  },
  general: {
    label: 'General',
    icon: Layers,
    tone: 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 ring-slate-200 dark:ring-slate-700',
  },
}

interface IntentBadgesProps {
  intents: IntentSignal[]
}

export function IntentBadges({ intents }: IntentBadgesProps) {
  if (!intents.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {intents.map((s) => {
        const meta = INTENT_META[s.intent]
        const Icon = meta.icon
        return (
          <span
            key={s.intent}
            className={`pill ring-1 ring-inset ${meta.tone}`}
            title={s.reasons.join(', ')}
          >
            <Icon className="size-3" />
            {meta.label}
            <span className="opacity-70">{(s.confidence * 100).toFixed(0)}%</span>
          </span>
        )
      })}
    </div>
  )
}
