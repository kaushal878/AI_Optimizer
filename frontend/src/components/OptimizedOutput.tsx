import { Check, Copy, Download, FileJson, FileText, Layers } from 'lucide-react'
import { useState } from 'react'
import type { OptimizeResult } from '../types'
import {
  downloadAll,
  downloadPromptJson,
  downloadPromptPdf,
  downloadPromptText,
} from '../lib/downloads'
import { cn } from '../lib/cn'

interface OptimizedOutputProps {
  original: string
  result: OptimizeResult | null
  loading: boolean
}

export function OptimizedOutput({ original, result, loading }: OptimizedOutputProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result.optimized_prompt)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <section className="surface flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-accent-500" />
          <h2 className="text-sm font-semibold">Optimized prompt</h2>
          {result && (
            <span className="pill bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-brand-200/70 dark:ring-brand-500/30">
              {result.suggested_format}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            className="btn-ghost py-1 px-2 text-xs"
            disabled={!result}
            onClick={copy}
            title="Copy optimized prompt"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            className="btn-ghost py-1 px-2 text-xs"
            disabled={!result}
            onClick={() => result && downloadPromptText(result.optimized_prompt, 'md')}
            title="Download as Markdown"
          >
            <FileText className="size-3.5" />
            <span className="hidden sm:inline">.md</span>
          </button>
          <button
            className="btn-ghost py-1 px-2 text-xs"
            disabled={!result}
            onClick={() => result && downloadPromptJson(original, result)}
            title="Download structured analysis as JSON"
          >
            <FileJson className="size-3.5" />
            <span className="hidden sm:inline">.json</span>
          </button>
          <button
            className="btn-ghost py-1 px-2 text-xs"
            disabled={!result}
            onClick={() => result && downloadPromptPdf(original, result)}
            title="Download full PDF report"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">.pdf</span>
          </button>
          <button
            className="btn-soft py-1 px-2 text-xs"
            disabled={!result}
            onClick={() => result && downloadAll(original, result)}
            title="Download .md + .json + .pdf"
          >
            <Download className="size-3.5" />
            <span>All</span>
          </button>
        </div>
      </div>
      <div
        className={cn(
          'flex-1 min-h-[280px] p-4 overflow-auto scroll-thin font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words',
          'bg-slate-50/60 dark:bg-slate-900/40 rounded-b-2xl'
        )}
      >
        {loading && (
          <div className="text-slate-500 dark:text-slate-400 text-xs">Optimizing prompt…</div>
        )}
        {!loading && !result && (
          <div className="text-slate-500 dark:text-slate-400 text-xs">
            Click <span className="font-semibold">Optimize</span> to compress the prompt and apply
            intent-aware enhancements. The optimized version will appear here.
          </div>
        )}
        {!loading && result && result.optimized_prompt}
      </div>
    </section>
  )
}
