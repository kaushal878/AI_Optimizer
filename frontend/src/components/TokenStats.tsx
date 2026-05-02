import { TrendingDown } from 'lucide-react'
import type { OptimizeResult } from '../types'
import { cn } from '../lib/cn'

interface TokenStatsProps {
  originalTokens: number
  result: OptimizeResult | null
}

function formatNumber(n: number) {
  return n.toLocaleString()
}

export function TokenStats({ originalTokens, result }: TokenStatsProps) {
  const optimized = result?.optimized_tokens ?? 0
  const reduction = result?.token_reduction_pct ?? 0
  const reductionClamped = Math.max(0, Math.min(100, reduction))

  return (
    <div className="grid grid-cols-3 gap-3">
      <Stat label="Original" value={formatNumber(originalTokens)} hint="tokens" />
      <Stat
        label="Optimized"
        value={result ? formatNumber(optimized) : '—'}
        hint="tokens"
        accent={result && optimized < originalTokens ? 'positive' : undefined}
      />
      <Stat
        label="Reduction"
        value={result ? `${reduction.toFixed(1)}%` : '—'}
        hint={
          result
            ? `${formatNumber(Math.max(0, originalTokens - optimized))} tokens saved`
            : 'optimize to see savings'
        }
        accent={result && reduction > 0 ? 'positive' : reduction < 0 ? 'negative' : undefined}
      >
        {result && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                reduction >= 0
                  ? 'bg-gradient-to-r from-brand-500 to-accent-500'
                  : 'bg-amber-500'
              )}
              style={{ width: `${reductionClamped}%` }}
            />
          </div>
        )}
      </Stat>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  accent,
  children,
}: {
  label: string
  value: string
  hint?: string
  accent?: 'positive' | 'negative'
  children?: React.ReactNode
}) {
  return (
    <div className="surface px-4 py-3">
      <p className="label">{label}</p>
      <div
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums flex items-center gap-1.5',
          accent === 'positive' && 'text-emerald-600 dark:text-emerald-400',
          accent === 'negative' && 'text-amber-600 dark:text-amber-400'
        )}
      >
        {value}
        {accent === 'positive' && <TrendingDown className="size-4" />}
      </div>
      {hint && <p className="text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>}
      {children}
    </div>
  )
}
