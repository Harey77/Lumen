import { useSyncExternalStore } from 'react'
import { usePrefs } from '../lib/prefs'
import { initialLoad, nextLoad, revert, type LoadLevel, type LoadState, type Signal, type SignalKind } from './load-engine'

// Session-only: signals live in memory and are gone when the tab closes (PRD: deletable, local).
let signals: Signal[] = []
let state: LoadState = initialLoad
let snapshot = { state, signals }

const listeners = new Set<() => void>()
const emit = () => {
  snapshot = { state, signals }
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function recordSignal(kind: SignalKind, stepId: string) {
  const now = Date.now()
  signals = [...signals, { kind, stepId, at: now }].slice(-200)
  state = nextLoad(state, signals, now, stepId)
  emit()
}

export const currentLevel = () => state.level

export function revertLoad() {
  state = revert(state, Date.now())
  emit()
}

export function clearSignals() {
  signals = []
  state = initialLoad
  emit()
}

export function useLoad(): { level: LoadLevel; state: LoadState; signals: Signal[]; enabled: boolean } {
  const snap = useSyncExternalStore(subscribe, () => snapshot)
  const { adaptation } = usePrefs()
  return { level: adaptation ? snap.state.level : 'low', state: snap.state, signals: snap.signals, enabled: adaptation }
}
