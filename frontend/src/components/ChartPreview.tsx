import { Bar, Line, Pie } from 'react-chartjs-2'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { useMemo, useState } from 'react'
import { Copy } from 'lucide-react'
import { cn } from '../lib/cn'

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip
)

type ChartKind = 'bar' | 'line' | 'pie'

interface ChartPreviewProps {
  active: boolean
  prompt: string
}

interface ParsedSeries {
  labels: string[]
  values: number[]
}

const NUMBER_RE = /(-?\d+(?:\.\d+)?)\s*([kKmMbB])?/

function normalizeNumber(value: string): number {
  const m = value.match(NUMBER_RE)
  if (!m) return Number.NaN
  const n = parseFloat(m[1])
  const suffix = (m[2] ?? '').toLowerCase()
  if (suffix === 'k') return n * 1_000
  if (suffix === 'm') return n * 1_000_000
  if (suffix === 'b') return n * 1_000_000_000
  return n
}

/**
 * Parse "Jan 10k, Feb 15k, ..." or "Jan: 10, Feb: 15"-style series out of the
 * prompt. Best-effort only — if we can't find a series we render a placeholder.
 */
function parseSeries(prompt: string): ParsedSeries {
  const candidates = prompt.match(/[A-Za-z][A-Za-z .'-]+\s*[:-]?\s*-?\d+(?:\.\d+)?\s*[kKmMbB]?/g)
  if (!candidates) return { labels: [], values: [] }
  const labels: string[] = []
  const values: number[] = []
  for (const part of candidates) {
    const numMatch = part.match(NUMBER_RE)
    if (!numMatch) continue
    const value = normalizeNumber(numMatch[0])
    if (Number.isNaN(value)) continue
    const label = part.slice(0, numMatch.index ?? 0).replace(/[:-]/g, '').trim()
    if (!label) continue
    labels.push(label)
    values.push(value)
    if (labels.length >= 24) break
  }
  return { labels, values }
}

export function ChartPreview({ active, prompt }: ChartPreviewProps) {
  const [kind, setKind] = useState<ChartKind>('bar')
  const series = useMemo(() => parseSeries(prompt), [prompt])

  if (!active) return null

  const palette = ['#3a63ff', '#9333ea', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#22d3ee', '#a855f7']
  const data = {
    labels: series.labels.length ? series.labels : ['No data parsed'],
    datasets: [
      {
        label: 'Series',
        data: series.values.length ? series.values : [0],
        backgroundColor:
          kind === 'pie'
            ? palette.slice(0, Math.max(1, series.labels.length))
            : 'rgba(58, 99, 255, 0.55)',
        borderColor: '#3a63ff',
        borderWidth: 1.5,
        tension: 0.3,
      },
    ],
  }

  const config = {
    type: kind,
    data: { labels: data.labels, datasets: [{ label: 'Series', data: data.datasets[0].data }] },
    options: { responsive: true, plugins: { legend: { display: kind === 'pie' } } },
  }

  const copyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2))
  }

  return (
    <div className="surface p-3">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2">
          <p className="label">Chart preview</p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            parsed from your prompt
          </span>
        </div>
        <div className="flex items-center gap-1">
          {(['bar', 'line', 'pie'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                'text-[11px] px-2 py-0.5 rounded ring-1 ring-inset',
                kind === k
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-brand-300 dark:ring-brand-500/40'
                  : 'bg-white/60 dark:bg-slate-900/60 ring-slate-200 dark:ring-slate-800'
              )}
            >
              {k}
            </button>
          ))}
          <button className="btn-ghost py-0.5 px-1.5 text-[11px]" onClick={copyConfig}>
            <Copy className="size-3" /> JSON
          </button>
        </div>
      </div>
      <div className="h-48">
        {kind === 'bar' && <Bar data={data} options={{ responsive: true, maintainAspectRatio: false }} />}
        {kind === 'line' && (
          <Line data={data} options={{ responsive: true, maintainAspectRatio: false }} />
        )}
        {kind === 'pie' && (
          <Pie data={data} options={{ responsive: true, maintainAspectRatio: false }} />
        )}
      </div>
      {!series.values.length && (
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          No numeric series detected. Add data like "Jan 10k, Feb 15k" to your prompt and
          we'll render it here.
        </p>
      )}
    </div>
  )
}
