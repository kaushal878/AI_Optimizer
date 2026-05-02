import { describe, expect, it } from 'vitest'
import { optimizeLocal } from './optimizer'
import { DEFAULT_CUSTOMIZATION } from '../types'

describe('optimizeLocal', () => {
  it('strips politeness fillers and shrinks tokens on a verbose prompt in balanced mode', () => {
    const prompt =
      'Hi there! I would really really like it if you could please, in order to help me, ' +
      'kindly explain in detail what recursion is. Thank you so much! ' +
      'Due to the fact that I am completely new to this topic, please be very patient. ' +
      'It is important to note that I really really need a clear and basically simple answer. ' +
      'I would really appreciate it if you could thank you very much basically. ' +
      'In the event that you have time, in order to make this work, please walk me through it. ' +
      'On a regular basis I just need to actually know how this works in real life. ' +
      'I would really appreciate concrete and actionable advice — thank you so much again kindly!'
    const res = optimizeLocal({
      prompt,
      mode: 'balanced',
      ai_mode: 'chatgpt',
      customization: DEFAULT_CUSTOMIZATION,
    })
    const optimized = res.optimized_prompt.toLowerCase()
    expect(optimized).not.toMatch(/\bplease\b/)
    expect(optimized).not.toMatch(/\bkindly\b/)
    expect(optimized).not.toMatch(/^hi\b/)
    expect(optimized).toContain('to') // "in order to" → "to"
    expect(optimized).not.toContain('in order to')
    expect(res.optimized_tokens).toBeLessThan(res.original_tokens)
    expect(res.enhancements.some((e) => /politeness/i.test(e.label))).toBe(true)
  })

  it('quality mode preserves politeness', () => {
    const prompt = 'Please summarise this paper for me, thank you.'
    const res = optimizeLocal({
      prompt,
      mode: 'quality',
      ai_mode: 'chatgpt',
      customization: DEFAULT_CUSTOMIZATION,
    })
    expect(res.optimized_prompt.toLowerCase()).toContain('please')
  })

  it('detects chart intent and adds Chart.js output instructions', () => {
    const prompt = 'Build a bar chart of monthly revenue: Jan 10k, Feb 12k, Mar 14k.'
    const res = optimizeLocal({
      prompt,
      mode: 'balanced',
      ai_mode: 'chatgpt',
      customization: DEFAULT_CUSTOMIZATION,
    })
    const primary = res.intents[0]
    expect(primary.intent).toBe('chart')
    expect(res.optimized_prompt.toLowerCase()).toContain('chart.js')
    expect(res.suggested_format.toLowerCase()).toContain('chart')
  })

  it('appends a code contract when intent is code and prompt has no fenced block', () => {
    const prompt =
      'Refactor this Python function so it is more readable and add unit test coverage.'
    const res = optimizeLocal({
      prompt,
      mode: 'balanced',
      ai_mode: 'chatgpt',
      customization: DEFAULT_CUSTOMIZATION,
    })
    expect(res.intents[0].intent).toBe('code')
    expect(res.optimized_prompt).toMatch(/fenced/i)
    expect(res.suggested_format.toLowerCase()).toContain('fenced')
  })

  it('detects code intent purely from a fenced block and suggests fenced format', () => {
    const prompt = 'Make this faster.\n```py\ndef f(x):\n  return x*x\n```'
    const res = optimizeLocal({
      prompt,
      mode: 'balanced',
      ai_mode: 'chatgpt',
      customization: DEFAULT_CUSTOMIZATION,
    })
    expect(res.intents[0].intent).toBe('code')
    expect(res.suggested_format.toLowerCase()).toContain('fenced')
  })

  it('switching AI mode changes the system prefix', () => {
    const prompt = 'Explain transformers briefly.'
    const a = optimizeLocal({
      prompt,
      mode: 'balanced',
      ai_mode: 'chatgpt',
      customization: DEFAULT_CUSTOMIZATION,
    })
    const b = optimizeLocal({
      prompt,
      mode: 'balanced',
      ai_mode: 'claude',
      customization: DEFAULT_CUSTOMIZATION,
    })
    expect(a.optimized_prompt).not.toEqual(b.optimized_prompt)
  })

  it('customization toggles change the optimized prompt', () => {
    const prompt = 'Summarise the CAP theorem.'
    const off = optimizeLocal({
      prompt,
      mode: 'balanced',
      ai_mode: 'chatgpt',
      customization: DEFAULT_CUSTOMIZATION,
    })
    const on = optimizeLocal({
      prompt,
      mode: 'balanced',
      ai_mode: 'chatgpt',
      customization: { ...DEFAULT_CUSTOMIZATION, add_step_by_step: true, add_examples: true },
    })
    expect(on.optimized_prompt.length).toBeGreaterThan(off.optimized_prompt.length)
    expect(on.enhancements.length).toBeGreaterThan(off.enhancements.length)
  })

  it('returns a structured result with download_ready=true', () => {
    const res = optimizeLocal({
      prompt: 'hello world',
      mode: 'balanced',
      ai_mode: 'universal',
      customization: DEFAULT_CUSTOMIZATION,
    })
    expect(res.download_ready).toBe(true)
    expect(res.original_tokens).toBeGreaterThan(0)
    expect(res.optimized_tokens).toBeGreaterThan(0)
    expect(typeof res.token_reduction).toBe('string')
  })
})
