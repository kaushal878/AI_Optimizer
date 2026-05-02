import type { CustomizationFlags, AIMode, Mode, OptimizeResult } from '../types'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

interface OptimizeArgs {
  prompt: string
  mode: Mode
  ai_mode: AIMode
  customization: CustomizationFlags
  model?: string
}

export async function optimizeRemote(args: OptimizeArgs): Promise<OptimizeResult> {
  if (!API_BASE) {
    throw new Error('VITE_API_BASE_URL is not configured')
  }
  const res = await fetch(`${API_BASE}/api/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Optimize failed (${res.status}): ${text}`)
  }
  return (await res.json()) as OptimizeResult
}

export async function checkBackend(): Promise<boolean> {
  if (!API_BASE) return false
  try {
    const res = await fetch(`${API_BASE}/api/health`, { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}

export const apiBase = API_BASE
