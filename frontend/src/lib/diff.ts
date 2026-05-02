export interface DiffToken {
  text: string
  type: 'kept' | 'added' | 'removed'
}

/**
 * Lightweight word-level LCS diff. Returns three streams suitable for the
 * before/after view: original (kept/removed) and optimized (kept/added).
 */
export function wordDiff(original: string, optimized: string) {
  const a = original.split(/(\s+)/)
  const b = optimized.split(/(\s+)/)
  const m = a.length
  const n = b.length

  // Build LCS matrix.
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const left: DiffToken[] = []
  const right: DiffToken[] = []
  let i = 0
  let j = 0
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      left.push({ text: a[i], type: 'kept' })
      right.push({ text: b[j], type: 'kept' })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      left.push({ text: a[i], type: 'removed' })
      i++
    } else {
      right.push({ text: b[j], type: 'added' })
      j++
    }
  }
  while (i < m) {
    left.push({ text: a[i++], type: 'removed' })
  }
  while (j < n) {
    right.push({ text: b[j++], type: 'added' })
  }

  return { left, right }
}
