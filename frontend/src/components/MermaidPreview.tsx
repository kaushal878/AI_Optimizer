import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Workflow } from 'lucide-react'

const MermaidRenderer = lazy(async () => {
  const mod = await import('mermaid')
  const mermaid = mod.default
  mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' })

  function Renderer({ code }: { code: string }) {
    const [svg, setSvg] = useState('')
    const [error, setError] = useState<string | null>(null)
    useEffect(() => {
      let alive = true
      const id = `mmd-${Math.random().toString(36).slice(2, 9)}`
      mermaid
        .render(id, code)
        .then((out) => {
          if (alive) {
            setSvg(out.svg)
            setError(null)
          }
        })
        .catch((err) => {
          if (alive) setError(err instanceof Error ? err.message : String(err))
        })
      return () => {
        alive = false
      }
    }, [code])
    if (error) {
      return (
        <p className="text-xs text-rose-600 dark:text-rose-400">
          Mermaid render failed: {error}
        </p>
      )
    }
    return <div className="overflow-auto" dangerouslySetInnerHTML={{ __html: svg }} />
  }

  return { default: Renderer }
})

interface MermaidPreviewProps {
  text: string
}

const MERMAID_FENCE = /```mermaid\n([\s\S]*?)```/g

export function MermaidPreview({ text }: MermaidPreviewProps) {
  const blocks = useMemo(() => {
    const out: string[] = []
    let m: RegExpExecArray | null
    const re = new RegExp(MERMAID_FENCE)
    while ((m = re.exec(text)) !== null) {
      if (m[1]?.trim()) out.push(m[1].trim())
    }
    return out
  }, [text])

  if (!blocks.length) return null

  return (
    <div className="surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Workflow className="size-4 text-accent-500" />
        <p className="label">Mermaid preview</p>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">
          rendered from ```mermaid blocks
        </span>
      </div>
      <Suspense fallback={<p className="text-xs text-slate-500">Loading mermaid…</p>}>
        <div className="space-y-3">
          {blocks.map((code, i) => (
            <div
              key={i}
              className="rounded-lg ring-1 ring-slate-200 dark:ring-slate-800 bg-white p-3"
            >
              <MermaidRenderer code={code} />
            </div>
          ))}
        </div>
      </Suspense>
    </div>
  )
}
