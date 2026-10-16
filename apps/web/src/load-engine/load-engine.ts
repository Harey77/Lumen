/**
 * Cognitive-load engine (PRD Pillar 1, decision D-010).
 * A transparent points model over recent in-lesson signals. Pure functions; no I/O.
 * Load estimates only shape the interface. They never grade or label the learner.
 */

export type LoadLevel = 'low' | 'medium' | 'high'
export type SignalKind = 'miss' | 'hit' | 'back' | 'replay' | 'hesitate'

export interface Signal {
  kind: SignalKind
  stepId: string
  at: number
}

export interface LoadState {
  level: LoadLevel
  changedAt: number
  reason: string | null
  /** Signals at or before this time are ignored (set when the learner reverts). */
  since: number
}

export const WEIGHTS: Record<Exclude<SignalKind, 'hit'>, number> = {
  miss: 1.5,
  back: 1,
  replay: 0.75,
  hesitate: 1,
}
export const WINDOW_MS = 3 * 60_000
// Two quick misses alone stay below medium: change needs a sustained signal (design doc 6).
export const THRESHOLDS = { medium: 4, high: 7 }
export const MIN_CHANGE_MS = 60_000
export const MISS_STREAK = 3

export const initialLoad: LoadState = { level: 'low', changedAt: 0, reason: null, since: 0 }

const LABEL: Record<Exclude<SignalKind, 'hit'>, [string, string]> = {
  miss: ['missed tap', 'missed taps'],
  back: ['step back', 'steps back'],
  replay: ['replay', 'replays'],
  hesitate: ['long pause', 'long pauses'],
}

function recent(signals: Signal[], now: number, since: number) {
  return signals.filter((s) => s.at > since && now - s.at <= WINDOW_MS)
}

export function score(signals: Signal[], now: number, since = 0): number {
  return recent(signals, now, since).reduce((sum, s) => sum + (s.kind === 'hit' ? 0 : WEIGHTS[s.kind]), 0)
}

/** Misses on this step since its last hit. */
export function missStreak(signals: Signal[], stepId: string, since = 0): number {
  let n = 0
  for (let i = signals.length - 1; i >= 0; i--) {
    const s = signals[i]!
    if (s.at <= since) break
    if (s.stepId !== stepId) continue
    if (s.kind === 'hit') break
    if (s.kind === 'miss') n++
  }
  return n
}

export function levelFor(points: number): LoadLevel {
  if (points >= THRESHOLDS.high) return 'high'
  if (points >= THRESHOLDS.medium) return 'medium'
  return 'low'
}

function describe(signals: Signal[]): string {
  const counts = new Map<Exclude<SignalKind, 'hit'>, number>()
  for (const s of signals) if (s.kind !== 'hit') counts.set(s.kind, (counts.get(s.kind) ?? 0) + 1)
  const parts = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${n} ${LABEL[k][n === 1 ? 0 : 1]}`)
  return parts.length ? `${parts.join(', ')} in the last 3 minutes` : 'fewer signs of struggle lately'
}

export function nextLoad(state: LoadState, signals: Signal[], now: number, stepId: string): LoadState {
  // Acceptance rule (PRD Pillar 1): three consecutive misses on one step simplify at once.
  const streak = missStreak(signals, stepId, state.since)
  if (streak >= MISS_STREAK && state.level !== 'high') {
    return { ...state, level: 'high', changedAt: now, reason: `${streak} missed taps in a row on this step` }
  }
  const target = levelFor(score(signals, now, state.since))
  if (target === state.level || now - state.changedAt < MIN_CHANGE_MS) return state
  return { ...state, level: target, changedAt: now, reason: describe(recent(signals, now, state.since)) }
}

/** One-tap revert: back to the full view, ignoring the signals that caused the change. */
export function revert(state: LoadState, now: number): LoadState {
  return { ...state, level: 'low', changedAt: now, reason: null, since: now }
}
