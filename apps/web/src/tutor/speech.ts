import { useSyncExternalStore } from 'react'

/** Converts a Markdown answer into text worth hearing. Code is skipped unless asked for. */
export function speakable(markdown: string, includeCode = false): string {
  return markdown
    .replace(/```lumen-visual[\s\S]*?```/g, '')
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang: string, code: string) =>
      includeCode ? `Code${lang ? ` in ${lang}` : ''}: ${code.replace(/\n+/g, '. ')}.` : 'A code example is shown on screen.',
    )
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+(.*)$/gm, '$1.')
    .replace(/\*\*([^*]+)\*\*|\*([^*]+)\*/g, '$1$2')
    .replace(/^\s*([-*]|\d+\.)\s+/gm, '')
    .replace(/\.\.+/g, '.')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

/** Short chunks, because some browsers cut off long utterances. */
export function chunks(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((s) => (s.length > 220 ? s.match(/.{1,220}(\s|$)/g) ?? [s] : [s]))
}

export type SpeechStatus = 'idle' | 'starting' | 'speaking' | 'paused' | 'error'
interface State {
  id: string | null
  status: SpeechStatus
  error: string | null
}

export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

let state: State = { id: null, status: 'idle', error: null }
const listeners = new Set<() => void>()
const set = (s: Partial<State>) => {
  state = { ...state, ...s }
  listeners.forEach((l) => l())
}
let run = 0
let watchdog: ReturnType<typeof setTimeout> | undefined

export function stopSpeech() {
  run++
  clearTimeout(watchdog)
  if (speechSupported()) speechSynthesis.cancel()
  if (state.status !== 'idle' || state.id) set({ id: null, status: 'idle', error: null })
}

/** Plays one answer; starting another stops the previous one. */
export function playSpeech(id: string, text: string) {
  stopSpeech()
  if (!speechSupported()) return set({ id, status: 'error', error: 'Your browser does not support reading aloud.' })
  const parts = chunks(text)
  if (!parts.length) return
  const mine = ++run
  set({ id, status: 'starting', error: null })
  let i = 0
  // If the engine never starts (no voices, blocked audio), say so instead of pretending to read.
  watchdog = setTimeout(() => {
    if (run === mine && state.status === 'starting') {
      speechSynthesis.cancel()
      set({ status: 'error', error: 'Reading aloud could not start on this device. Check that a speech voice is installed.' })
    }
  }, 4000)
  const next = () => {
    if (run !== mine) return
    if (i >= parts.length) return set({ id: null, status: 'idle' })
    const u = new SpeechSynthesisUtterance(parts[i++])
    u.rate = 1
    u.lang = 'en-US'
    u.onstart = () => {
      if (run !== mine) return
      clearTimeout(watchdog)
      if (state.status !== 'paused') set({ status: 'speaking' })
    }
    u.onend = () => next()
    u.onerror = (e) => {
      if (run !== mine || e.error === 'interrupted' || e.error === 'canceled') return
      clearTimeout(watchdog)
      set({ status: 'error', error: `Reading aloud stopped: ${e.error}.` })
    }
    speechSynthesis.speak(u)
  }
  next()
}

export function pauseSpeech() {
  if (state.status === 'speaking') {
    if (speechSupported()) speechSynthesis.pause()
    set({ status: 'paused' })
  }
}
export function resumeSpeech() {
  if (state.status === 'paused') {
    if (speechSupported()) speechSynthesis.resume()
    set({ status: 'speaking' })
  }
}

export function useSpeech(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}
