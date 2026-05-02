import { useMemo } from 'react'
import { wordDiff } from '../lib/diff'

interface DiffViewProps {
  original: string
  optimized: string
}

export function DiffView({ original, optimized }: DiffViewProps) {
  const { left, right } = useMemo(() => wordDiff(original, optimized), [original, optimized])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="surface p-3">
        <p className="label mb-1.5">Original</p>
        <p className="text-xs leading-relaxed font-mono whitespace-pre-wrap break-words">
          {left.map((tok, i) =>
            tok.type === 'removed' ? (
              <span
                key={i}
                className="bg-rose-100/70 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 line-through rounded-sm"
              >
                {tok.text}
              </span>
            ) : (
              <span key={i}>{tok.text}</span>
            )
          )}
        </p>
      </div>
      <div className="surface p-3">
        <p className="label mb-1.5">Optimized</p>
        <p className="text-xs leading-relaxed font-mono whitespace-pre-wrap break-words">
          {right.map((tok, i) =>
            tok.type === 'added' ? (
              <span
                key={i}
                className="bg-emerald-100/70 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-sm"
              >
                {tok.text}
              </span>
            ) : (
              <span key={i}>{tok.text}</span>
            )
          )}
        </p>
      </div>
    </div>
  )
}
