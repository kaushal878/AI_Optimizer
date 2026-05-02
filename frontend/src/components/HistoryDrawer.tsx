import { Trash2, X } from 'lucide-react'
import type { HistoryEntry } from '../types'

interface HistoryDrawerProps {
  open: boolean
  entries: HistoryEntry[]
  onClose: () => void
  onLoad: (entry: HistoryEntry) => void
  onClear: () => void
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

export function HistoryDrawer({ open, entries, onClose, onLoad, onClear }: HistoryDrawerProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside className="ml-auto relative h-full w-full max-w-md bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-semibold">Prompt history</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Last {entries.length} optimization{entries.length === 1 ? '' : 's'} · stored in your browser
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="btn-ghost py-1 px-2 text-xs"
              onClick={onClear}
              disabled={!entries.length}
              title="Clear all history"
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
            <button className="btn-ghost py-1 px-2" onClick={onClose} aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto scroll-thin p-3 space-y-2">
          {!entries.length && (
            <p className="text-xs text-slate-500 dark:text-slate-400 px-2">
              No history yet. Run an optimization and it'll show up here automatically.
            </p>
          )}
          {entries.map((e) => (
            <button
              key={e.id}
              onClick={() => onLoad(e)}
              className="w-full text-left rounded-lg ring-1 ring-slate-200 dark:ring-slate-800 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
                  {e.mode} · {e.ai_mode}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {relativeTime(e.created_at)}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-slate-700 dark:text-slate-300">
                {e.original.slice(0, 220)}
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                <span>{e.result.original_tokens} → {e.result.optimized_tokens} tokens</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  −{e.result.token_reduction_pct.toFixed(1)}%
                </span>
              </div>
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}
