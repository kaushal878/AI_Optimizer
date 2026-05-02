import { useEffect, useMemo, useState } from 'react'
import { Loader2, Wand2 } from 'lucide-react'
import { Header } from './components/Header'
import { ModeSelector } from './components/ModeSelector'
import { AIModeSelector } from './components/AIModeSelector'
import { CustomizationPanel } from './components/CustomizationPanel'
import { PromptInput } from './components/PromptInput'
import { OptimizedOutput } from './components/OptimizedOutput'
import { TokenStats } from './components/TokenStats'
import { IntentBadges } from './components/IntentBadges'
import { EnhancementsList } from './components/EnhancementsList'
import { DiffView } from './components/DiffView'
import { HistoryDrawer } from './components/HistoryDrawer'
import { TemplatesDrawer } from './components/TemplatesDrawer'
import { ChartPreview } from './components/ChartPreview'
import { MermaidPreview } from './components/MermaidPreview'
import {
  DEFAULT_CUSTOMIZATION,
  type AIMode,
  type CustomizationFlags,
  type HistoryEntry,
  type Mode,
  type OptimizeResult,
} from './types'
import { optimizeLocal } from './lib/optimizer'
import { detectIntents } from './lib/intent'
import { countTokensLocal } from './lib/tokens'
import { checkBackend, optimizeRemote } from './lib/api'
import { appendHistory, clearHistory, loadHistory, loadTheme, saveTheme } from './lib/storage'
import { TEMPLATES } from './lib/templates'

const DEFAULT_PROMPT = TEMPLATES[0].prompt

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => loadTheme())
  const [prompt, setPrompt] = useState<string>(DEFAULT_PROMPT)
  const [mode, setMode] = useState<Mode>('balanced')
  const [aiMode, setAiMode] = useState<AIMode>('chatgpt')
  const [customization, setCustomization] = useState<CustomizationFlags>(DEFAULT_CUSTOMIZATION)
  const [result, setResult] = useState<OptimizeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [showDiff, setShowDiff] = useState(true)
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null)

  // Theme application
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    saveTheme(theme)
  }, [theme])

  // Initial backend probe
  useEffect(() => {
    let cancelled = false
    void checkBackend().then((ok) => {
      if (!cancelled) setBackendOnline(ok)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const intents = useMemo(() => detectIntents(prompt), [prompt])
  const originalTokens = useMemo(() => countTokensLocal(prompt), [prompt])

  const optimize = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)
    setLastSubmitted(prompt)
    try {
      let res: OptimizeResult
      if (backendOnline) {
        try {
          res = await optimizeRemote({
            prompt,
            mode,
            ai_mode: aiMode,
            customization,
            model: aiMode === 'universal' ? 'gpt-4o' : aiModelFor(aiMode),
          })
        } catch (err) {
          console.warn('Backend optimize failed, falling back to local engine', err)
          res = optimizeLocal({ prompt, mode, ai_mode: aiMode, customization })
        }
      } else {
        res = optimizeLocal({ prompt, mode, ai_mode: aiMode, customization })
      }
      setResult(res)
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        created_at: Date.now(),
        original: prompt,
        optimized: res.optimized_prompt,
        mode,
        ai_mode: aiMode,
        customization,
        result: res,
      }
      setHistory(appendHistory(entry))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const loadHistoryEntry = (entry: HistoryEntry) => {
    setPrompt(entry.original)
    setMode(entry.mode)
    setAiMode(entry.ai_mode)
    setCustomization(entry.customization)
    setResult(entry.result)
    setHistoryOpen(false)
  }

  const chartActive =
    customization.add_charts || (result?.intents[0]?.intent === 'chart') || intents[0].intent === 'chart'

  return (
    <div className="min-h-full">
      <Header
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenTemplates={() => setTemplatesOpen(true)}
        backendOnline={backendOnline}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <section className="surface p-4 sm:p-5 space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ModeSelector value={mode} onChange={setMode} />
            </div>
            <AIModeSelector value={aiMode} onChange={setAiMode} />
          </div>
          <CustomizationPanel value={customization} onChange={setCustomization} />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="label">Detected intent:</span>
              <IntentBadges intents={intents} />
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  className="size-3.5 rounded border-slate-300 dark:border-slate-700"
                  checked={showDiff}
                  onChange={(e) => setShowDiff(e.target.checked)}
                />
                Before / after diff
              </label>
              <button
                className="btn-primary"
                onClick={optimize}
                disabled={loading || !prompt.trim()}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Wand2 className="size-4" />
                )}
                {loading ? 'Optimizing…' : 'Optimize'}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}
        </section>

        <section className="grid lg:grid-cols-2 gap-4 min-h-[420px]">
          <PromptInput value={prompt} onChange={setPrompt} theme={theme} />
          <OptimizedOutput
            original={lastSubmitted ?? prompt}
            result={result}
            loading={loading}
          />
        </section>

        <TokenStats originalTokens={originalTokens} result={result} />

        {result && (
          <section className="grid lg:grid-cols-3 gap-4">
            <div className="surface p-4 lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <p className="label">Enhancements applied</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Suggested format: <span className="font-semibold text-slate-700 dark:text-slate-200">{result.suggested_format}</span>
                </p>
              </div>
              <EnhancementsList enhancements={result.enhancements} />
            </div>
            <div className="surface p-4 space-y-2">
              <p className="label">Suggested use cases</p>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                {(result.intents[0]?.intent === 'chart' || customization.add_charts) && (
                  <li>• Drop the JSON config straight into Chart.js / Recharts.</li>
                )}
                {(result.intents[0]?.intent === 'code' || customization.add_code_blocks) && (
                  <li>• Pipe into Cursor / Copilot for refactoring tasks.</li>
                )}
                {(result.intents[0]?.intent === 'comparison' || customization.add_formatting) && (
                  <li>• Paste the optimized prompt into a docs PR for a comparison table.</li>
                )}
                {result.intents[0]?.intent === 'explanation' && (
                  <li>• Use as a study guide template — numbered + 1-line summary.</li>
                )}
                <li>• Save to history; lifetime savings tracked locally.</li>
                <li>• Ship the JSON via the API mode for batch optimization.</li>
              </ul>
            </div>
          </section>
        )}

        {result && showDiff && (
          <section>
            <p className="label mb-2">Before vs After (word diff)</p>
            <DiffView original={lastSubmitted ?? prompt} optimized={result.optimized_prompt} />
          </section>
        )}

        <ChartPreview active={chartActive} prompt={prompt} />

        {result && <MermaidPreview text={result.optimized_prompt} />}

        <footer className="pt-4 pb-8 text-center text-[11px] text-slate-500 dark:text-slate-400">
          Built with React + Tailwind + Monaco · FastAPI + tiktoken backend ·
          {' '}
          <a
            className="underline hover:text-brand-600 dark:hover:text-brand-300"
            href="https://github.com/kaushal878/AI_Optimizer"
            target="_blank"
            rel="noreferrer"
          >
            kaushal878/AI_Optimizer
          </a>
        </footer>
      </main>

      <HistoryDrawer
        open={historyOpen}
        entries={history}
        onClose={() => setHistoryOpen(false)}
        onLoad={loadHistoryEntry}
        onClear={() => {
          clearHistory()
          setHistory([])
        }}
      />
      <TemplatesDrawer
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onPick={(t) => {
          setPrompt(t.prompt)
          setResult(null)
        }}
      />
    </div>
  )
}

function aiModelFor(aiMode: AIMode): string {
  switch (aiMode) {
    case 'chatgpt':
      return 'gpt-4o'
    case 'claude':
      return 'claude-3.5-sonnet'
    case 'gemini':
      return 'gemini-1.5-pro'
    case 'universal':
      return 'gpt-4o'
  }
}

export default App
