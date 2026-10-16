import { describe, expect, it } from 'vitest'
import { initialLoad, missStreak, nextLoad, revert, score, type Signal } from './load-engine'

const s = (kind: Signal['kind'], at: number, stepId = 'a'): Signal => ({ kind, at, stepId })

describe('load engine', () => {
  it('three consecutive misses on one step force high load immediately', () => {
    const sig = [s('miss', 1000), s('miss', 1500), s('miss', 2000)]
    const next = nextLoad(initialLoad, sig, 2000, 'a')
    expect(next.level).toBe('high')
    expect(next.reason).toBe('3 missed taps in a row on this step')
  })

  it('a hit breaks the streak, and misses on other steps do not count', () => {
    expect(missStreak([s('miss', 1), s('miss', 2), s('hit', 3), s('miss', 4)], 'a')).toBe(1)
    expect(missStreak([s('miss', 1), s('miss', 2, 'b'), s('miss', 3)], 'a')).toBe(2)
  })

  it('ignores signals older than the window', () => {
    expect(score([s('back', 1)], 4 * 60_000)).toBe(0)
    expect(score([s('back', 1)], 60_000)).toBe(1)
  })

  it('rate-limits ordinary changes to once a minute', () => {
    const sig = [s('back', 100_000), s('back', 100_001), s('replay', 100_002), s('hesitate', 100_003), s('replay', 100_004)]
    const recentChange = { ...initialLoad, changedAt: 90_000 }
    expect(nextLoad(recentChange, sig, 100_010, 'a').level).toBe('low')
    expect(nextLoad(recentChange, sig, 150_001, 'a').level).toBe('medium')
  })

  it('revert restores the full view and ignores the signals that caused it', () => {
    const sig = [s('miss', 1), s('miss', 2), s('miss', 3)]
    const high = nextLoad(initialLoad, sig, 3, 'a')
    const back = revert(high, 10)
    expect(back.level).toBe('low')
    expect(nextLoad(back, sig, 11, 'a').level).toBe('low')
    const more = [...sig, s('miss', 20), s('miss', 21), s('miss', 22)]
    expect(nextLoad(back, more, 22, 'a').level).toBe('high')
  })
})
