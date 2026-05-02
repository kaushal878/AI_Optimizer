import type { OptimizeResult } from '../types'

export function downloadBlob(content: BlobPart, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadPromptText(prompt: string, ext: 'txt' | 'md' = 'txt') {
  downloadBlob(prompt, `optimized-prompt.${ext}`, ext === 'md' ? 'text/markdown' : 'text/plain')
}

export function buildAnalysisPayload(original: string, result: OptimizeResult) {
  return {
    original_prompt: original,
    optimized_prompt: result.optimized_prompt,
    token_reduction: result.token_reduction,
    token_reduction_pct: result.token_reduction_pct,
    original_tokens: result.original_tokens,
    optimized_tokens: result.optimized_tokens,
    enhancements: result.enhancements,
    intents: result.intents,
    suggested_format: result.suggested_format,
    model: result.model,
    download_ready: true,
    generated_at: new Date().toISOString(),
  }
}

export function downloadPromptJson(original: string, result: OptimizeResult) {
  downloadBlob(
    JSON.stringify(buildAnalysisPayload(original, result), null, 2),
    'prompt-analysis.json',
    'application/json'
  )
}

/**
 * jsPDF and html2canvas together weigh ~600 kB minified, so we lazy-load them
 * only when the user actually clicks Download PDF.
 */
export async function downloadPromptPdf(original: string, result: OptimizeResult) {
  const { default: jsPDF } = await import('jspdf')

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 48
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  const wrapLines = (text: string, width: number): string[] =>
    doc.splitTextToSize(text, width) as string[]

  const writeLines = (lines: string[], lineHeight = 14) => {
    for (const line of lines) {
      ensureSpace(lineHeight)
      doc.text(line, margin, y)
      y += lineHeight
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('PromptOptimizer AI — Analysis Report', margin, y)
  y += 26

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor('#475569')
  doc.text(`Generated ${new Date().toLocaleString()}`, margin, y)
  y += 22

  const stat = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor('#0f172a')
    doc.text(label, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#1e293b')
    doc.text(value, margin + 130, y)
    y += 16
  }

  stat('Original tokens', String(result.original_tokens))
  stat('Optimized tokens', String(result.optimized_tokens))
  stat('Reduction', result.token_reduction)
  stat('Suggested format', result.suggested_format)
  stat('Tokenizer model', result.model)
  y += 8

  const section = (title: string) => {
    ensureSpace(28)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor('#0f172a')
    doc.text(title, margin, y)
    y += 18
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#1e293b')
  }

  section('Detected intents')
  for (const it of result.intents) {
    writeLines(
      wrapLines(
        `• ${it.intent} (${(it.confidence * 100).toFixed(0)}%) — ${it.reasons.join(', ') || '—'}`,
        contentWidth
      )
    )
  }
  y += 4

  section('Enhancements applied')
  if (!result.enhancements.length) {
    writeLines(['(no automatic enhancements were needed)'])
  } else {
    for (const e of result.enhancements) {
      writeLines(wrapLines(`• ${e.label}: ${e.detail}`, contentWidth))
    }
  }
  y += 4

  section('Original prompt')
  writeLines(wrapLines(original, contentWidth))
  y += 4

  section('Optimized prompt')
  writeLines(wrapLines(result.optimized_prompt, contentWidth))

  doc.save('promptoptimizer-report.pdf')
}

export async function downloadAll(original: string, result: OptimizeResult) {
  downloadPromptText(result.optimized_prompt, 'md')
  downloadPromptJson(original, result)
  await downloadPromptPdf(original, result)
}
