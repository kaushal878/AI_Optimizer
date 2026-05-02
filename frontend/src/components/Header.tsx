import {
  ExternalLink,
  History,
  Library,
  Moon,
  Sparkles,
  Sun,
} from 'lucide-react'
import { cn } from '../lib/cn'

interface HeaderProps {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onOpenHistory: () => void
  onOpenTemplates: () => void
  backendOnline: boolean | null
}

export function Header({
  theme,
  onToggleTheme,
  onOpenHistory,
  onOpenTemplates,
  backendOnline,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 grid place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-glow">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">PromptOptimizer AI</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Save tokens. Improve structure. Get better answers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'pill',
              backendOnline === null
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 ring-slate-200 dark:ring-slate-700'
                : backendOnline
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-200/70 dark:ring-emerald-500/30'
                  : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-200/70 dark:ring-amber-500/30'
            )}
            title={
              backendOnline
                ? 'Using backend tiktoken counts'
                : backendOnline === false
                  ? 'Backend not reachable — using local tokenizer'
                  : 'Checking backend…'
            }
          >
            <span
              className={cn(
                'size-1.5 rounded-full',
                backendOnline === null
                  ? 'bg-slate-400'
                  : backendOnline
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
              )}
            />
            {backendOnline === null
              ? 'checking…'
              : backendOnline
                ? 'tiktoken'
                : 'local tokenizer'}
          </span>

          <button className="btn-ghost" onClick={onOpenTemplates}>
            <Library className="size-4" />
            <span className="hidden sm:inline">Templates</span>
          </button>
          <button className="btn-ghost" onClick={onOpenHistory}>
            <History className="size-4" />
            <span className="hidden sm:inline">History</span>
          </button>
          <a
            href="https://github.com/kaushal878/AI_Optimizer"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
            title="View source on GitHub"
          >
            <ExternalLink className="size-4" />
          </a>
          <button
            className="btn-ghost"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}
