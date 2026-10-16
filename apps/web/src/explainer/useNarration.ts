import { useEffect, useRef, useState } from 'react'

export type Engine = 'speech' | 'captions'

interface Options {
  sentences: string[]
  /** Changes whenever narration should restart from the first sentence (step change, replay). */
  restartKey: string
  playing: boolean
  sound: boolean
  rate: number
  pauseMs: number
  onDone: () => void
}

// Some environments expose speechSynthesis but never speak (no voices, headless, blocked audio).
let speechBroken = typeof speechSynthesis === 'undefined'

function readingMs(text: string, rate: number) {
  const words = text.split(/\s+/).length
  return Math.max(1800, (words / (160 * rate)) * 60_000)
}

/**
 * Speaks one sentence at a time so captions stay in sync (design doc 6A).
 * Falls back to captions paced for reading when speech is unavailable or sound is off (D-009).
 */
export function useNarration({ sentences, restartKey, playing, sound, rate, pauseMs, onDone }: Options) {
  // Position is tied to the restart key, so a new step or replay starts at sentence 0 with no reset effect.
  const [pos, setPos] = useState({ key: restartKey, index: 0 })
  const index = pos.key === restartKey ? pos.index : 0
  const [failed, setFailed] = useState(speechBroken)
  const engine: Engine = sound && !failed ? 'speech' : 'captions'
  const indexRef = useRef({ key: restartKey, index: 0 })
  const done = useRef(onDone)
  useEffect(() => {
    done.current = onDone
  })

  useEffect(() => {
    if (!playing) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let watchdog: ReturnType<typeof setTimeout> | undefined
    const useSpeech = sound && !speechBroken
    if (indexRef.current.key !== restartKey) indexRef.current = { key: restartKey, index: 0 }
    const at = () => indexRef.current.index

    const advance = () => {
      if (cancelled) return
      const next = at() + 1
      if (next >= sentences.length) {
        done.current()
        return
      }
      indexRef.current = { key: restartKey, index: next }
      setPos({ key: restartKey, index: next })
      timer = setTimeout(say, pauseMs)
    }

    const sayWithTimer = () => {
      timer = setTimeout(advance, readingMs(sentences[at()] ?? '', rate))
    }

    function say() {
      if (cancelled) return
      const text = sentences[at()] ?? ''
      if (!useSpeech || speechBroken) return sayWithTimer()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = rate
      u.lang = 'en'
      let started = false
      u.onstart = () => {
        started = true
        clearTimeout(watchdog)
      }
      u.onend = () => started && advance()
      u.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') return
        speechBroken = true
        setFailed(true)
        sayWithTimer()
      }
      watchdog = setTimeout(() => {
        if (started || cancelled) return
        speechBroken = true
        speechSynthesis.cancel()
        setFailed(true)
        sayWithTimer()
      }, 2500)
      speechSynthesis.speak(u)
    }

    say()
    return () => {
      cancelled = true
      clearTimeout(timer)
      clearTimeout(watchdog)
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
    }
  }, [playing, sound, rate, pauseMs, sentences, restartKey])

  return { index, engine }
}
