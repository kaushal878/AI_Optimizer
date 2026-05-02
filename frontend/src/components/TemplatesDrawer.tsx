import { X } from 'lucide-react'
import type { PromptTemplate } from '../types'
import { TEMPLATES } from '../lib/templates'

interface TemplatesDrawerProps {
  open: boolean
  onClose: () => void
  onPick: (tpl: PromptTemplate) => void
}

export function TemplatesDrawer({ open, onClose, onPick }: TemplatesDrawerProps) {
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
            <h3 className="text-sm font-semibold">Prompt templates</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Click any template to load it into the editor.
            </p>
          </div>
          <button className="btn-ghost py-1 px-2" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto scroll-thin p-3 space-y-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onPick(t)
                onClose()
              }}
              className="w-full text-left rounded-lg ring-1 ring-slate-200 dark:ring-slate-800 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{t.name}</span>
                <span className="pill bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-brand-200/70 dark:ring-brand-500/30">
                  {t.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                {t.description}
              </p>
              <p className="mt-2 text-[11px] text-slate-700 dark:text-slate-300 line-clamp-3 font-mono">
                {t.prompt.slice(0, 220)}
              </p>
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}
