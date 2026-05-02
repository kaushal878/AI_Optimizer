import { describe, expect, it } from 'vitest'
import { wordDiff } from './diff'

describe('wordDiff', () => {
  it('marks removed-only tokens on the left', () => {
    const { left, right } = wordDiff('please explain recursion', 'explain recursion')
    expect(left.some((t) => t.type === 'removed' && /please/i.test(t.text))).toBe(true)
    expect(right.every((t) => t.type !== 'removed')).toBe(true)
  })

  it('marks added-only tokens on the right', () => {
    const { left, right } = wordDiff('explain recursion', 'explain recursion clearly')
    expect(right.some((t) => t.type === 'added' && /clearly/i.test(t.text))).toBe(true)
    expect(left.every((t) => t.type !== 'added')).toBe(true)
  })

  it('marks unchanged tokens as kept on both sides', () => {
    const { left, right } = wordDiff('explain recursion', 'explain recursion')
    expect(left.every((t) => t.type === 'kept')).toBe(true)
    expect(right.every((t) => t.type === 'kept')).toBe(true)
  })

  it('handles total replacement', () => {
    const { left, right } = wordDiff('foo bar baz', 'qux quux')
    expect(left.every((t) => t.type === 'removed' || /^\s+$/.test(t.text))).toBe(true)
    expect(right.every((t) => t.type === 'added' || /^\s+$/.test(t.text))).toBe(true)
  })
})
