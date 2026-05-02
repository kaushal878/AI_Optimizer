import { CheckCircle2 } from 'lucide-react'
import type { Enhancement } from '../types'

interface EnhancementsListProps {
  enhancements: Enhancement[]
}

export function EnhancementsList({ enhancements }: EnhancementsListProps) {
  if (!enhancements.length) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
        No automatic enhancements were applied — your prompt is already lean.
      </p>
    )
  }
  return (
    <ul className="space-y-1.5">
      {enhancements.map((e, idx) => (
        <li key={idx} className="flex items-start gap-2">
          <CheckCircle2 className="size-4 text-emerald-500 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-tight">{e.label}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              {e.detail}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
