import { describe, expect, it } from 'vitest'
import { detectIntents, primaryIntent } from './intent'

describe('detectIntents', () => {
  it('detects chart intent on chart keywords', () => {
    expect(primaryIntent('Plot a bar chart of revenue by month.')).toBe('chart')
  })

  it('boosts chart confidence when numeric data is present', () => {
    const a = detectIntents('plot revenue by month')
    const b = detectIntents('plot revenue by month: Jan 10k, Feb 12k')
    const aChart = a.find((s) => s.intent === 'chart')!
    const bChart = b.find((s) => s.intent === 'chart')!
    expect(bChart.confidence).toBeGreaterThanOrEqual(aChart.confidence)
  })

  it('detects code intent from a fenced block alone', () => {
    expect(primaryIntent('```py\nprint(1)\n```')).toBe('code')
  })

  it('detects explanation intent', () => {
    expect(primaryIntent('Explain quantum entanglement step by step.')).toBe('explanation')
  })

  it('detects comparison intent', () => {
    expect(primaryIntent('Compare React vs Vue vs Svelte.')).toBe('comparison')
  })

  it('falls back to general for content with no signals', () => {
    expect(primaryIntent('blue green orange purple')).toBe('general')
  })

  it('returns intents sorted by confidence descending', () => {
    const intents = detectIntents('Compare React vs Vue and explain step by step why')
    for (let i = 1; i < intents.length; i++) {
      expect(intents[i - 1].confidence).toBeGreaterThanOrEqual(intents[i].confidence)
    }
  })
})
