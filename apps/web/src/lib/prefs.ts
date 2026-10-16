import { useSyncExternalStore } from 'react'
import type { AnalogyDomain } from '../content/types'

export type ThemeChoice = 'system' | 'light' | 'dark'
export type Mode = 'guided' | 'reader'

export interface Prefs {
  motion: 'system' | 'reduce'
  adaptation: boolean
  analogy: AnalogyDomain
  tier: 'auto' | '3d' | '2d'
  rate: number
  captions: boolean
  sound: boolean
  noticeSeen: boolean
  /** Explanation level for the tutor and recommendations. */
  level: 'beginner' | 'intermediate' | 'advanced'
}

const PREFS_KEY = 'lumen.prefs'
const THEME_KEY = 'lumen.theme'

export const defaultPrefs: Prefs = {
  motion: 'system',
  adaptation: true,
  analogy: 'machines',
  tier: 'auto',
  rate: 1,
  captions: true,
  sound: true,
  noticeSeen: false,
  level: 'beginner',
}

// localStorage can throw (private mode, blocked storage); the app must still run.
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* preference simply won't persist */
  }
}

let prefs: Prefs = { ...defaultPrefs, ...read<Partial<Prefs>>(PREFS_KEY, {}) }
let theme: ThemeChoice = (() => {
  try {
    return (localStorage.getItem(THEME_KEY) as ThemeChoice | null) ?? 'dark'
  } catch {
    return 'dark'
  }
})()

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function setPrefs(patch: Partial<Prefs>) {
  prefs = { ...prefs, ...patch }
  write(PREFS_KEY, prefs)
  applyMotion()
  emit()
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribe, () => prefs)
}

const darkQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null
const reduceQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null

export function resolvedTheme(): 'light' | 'dark' {
  if (theme === 'system') return darkQuery?.matches ? 'dark' : 'light'
  return theme
}

function applyTheme() {
  document.documentElement.dataset.theme = resolvedTheme()
}
function applyMotion() {
  if (prefs.motion === 'reduce') document.documentElement.dataset.motion = 'reduce'
  else delete document.documentElement.dataset.motion
}

export function setTheme(next: ThemeChoice) {
  theme = next
  try {
    localStorage.setItem(THEME_KEY, next)
  } catch {
    /* not persisted */
  }
  applyTheme()
  emit()
}

darkQuery?.addEventListener('change', () => {
  if (theme === 'system') {
    applyTheme()
    emit()
  }
})
reduceQuery?.addEventListener('change', emit)

export function useTheme(): { choice: ThemeChoice; resolved: 'light' | 'dark' } {
  const choice = useSyncExternalStore(subscribe, () => theme)
  const resolved = useSyncExternalStore(subscribe, resolvedTheme)
  return { choice, resolved }
}

export function useReducedMotion(): boolean {
  const p = usePrefs()
  const system = useSyncExternalStore(subscribe, () => reduceQuery?.matches ?? false)
  return p.motion === 'reduce' || system
}

export function clearPrefs() {
  try {
    localStorage.removeItem(PREFS_KEY)
    localStorage.removeItem(THEME_KEY)
  } catch {
    /* nothing stored */
  }
  prefs = { ...defaultPrefs }
  theme = 'dark'
  applyTheme()
  applyMotion()
  emit()
}
