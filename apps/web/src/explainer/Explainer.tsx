import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { BlobWindow, blobMask } from '../components/BlobWindow'
import { Icon } from '../components/Icon'
import { InkLoader, formatDate } from '../components/Small'
import { db } from '../lib/db'
import { setPrefs, usePrefs, useReducedMotion, type Mode } from '../lib/prefs'
import { currentLevel, recordSignal, revertLoad, useLoad } from '../load-engine/store'
import type { ExplainerModule, PartId } from '../content/types'
import Diagram2D from './Diagram2D'
import { AnalogyLayer, freshQuiz, PartDetail, PartsTray, RecallPanel, RecapQuiz, ViewTray, type QuizState, type RecallState } from './panels'
import { webglAvailable, type StageProps, type ViewCommand } from './stage'
import { useNarration } from './useNarration'

const Model3D = lazy(() => import('./Model3D'))
const STAGE_MASK = blobMask(7, 0.06)
const HESITATE_MS = 45_000

interface Props {
  module: ExplainerModule
  initialStep: number
  initialMode: Mode
  initialViewed: string[]
}

export function Explainer({ module: m, initialStep, initialMode, initialViewed }: Props) {
  const prefs = usePrefs()
  const reduced = useReducedMotion()
  const { level, state: load, enabled } = useLoad()

  const [step, setStep] = useState(initialStep)
  const [mode, setMode] = useState<Mode>(initialMode)
  const [viewed, setViewed] = useState<string[]>(() => {
    const id = m.steps[initialStep]!.id
    return initialViewed.includes(id) ? initialViewed : [...initialViewed, id]
  })
  const [selected, setSelected] = useState<PartId | null>(null)
  const [outerVisible, setOuterVisible] = useState(true)
  const [command, setCommand] = useState<ViewCommand | null>(null)
  const [replayKey, setReplayKey] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [idea, setIdea] = useState(0)
  const [recall, setRecall] = useState<RecallState>({ status: 'asking', feedback: null })
  const [quiz, setQuiz] = useState<QuizState>(freshQuiz)
  const [quizActive, setQuizActive] = useState(false)
  const [kept, setKept] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [saveError, setSaveError] = useState(false)

  const s = m.steps[step]!
  const parts = useMemo(() => Object.values(m.parts), [m])
  const names = useMemo(() => Object.fromEntries(parts.map((p) => [p.id, p.name])) as Record<PartId, string>, [parts])
  const use3d = prefs.tier !== '2d' && webglAvailable()
  const asking = (!!s.recall && recall.status === 'asking' && level !== 'high') || quizActive
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)
  const [, navigate] = useLocation()

  // Keep the address shareable and reload-safe without adding history entries.
  useEffect(() => {
    navigate(`/learn/${m.id}?step=${step + 1}`, { replace: true })
  }, [step, m.id, navigate])

  // Persist position and mode on every change (the learner can close the tab at any point).
  useEffect(() => {
    db.progress
      .put({ moduleId: m.id, step, mode, viewed, updatedAt: Date.now() })
      .then(() => setSaveError(false), () => setSaveError(true))
  }, [step, mode, m.id, viewed])

  // Move focus to the new step title for keyboard and screen-reader users.
  useEffect(() => {
    if (firstRender.current) firstRender.current = false
    else headingRef.current?.focus({ preventScroll: true })
  }, [step])

  /** Every step change goes through here so per-step state resets in the same render. */
  const changeStep = useCallback(
    (next: number) => {
      const id = m.steps[next]!.id
      setStep(next)
      setViewed((v) => (v.includes(id) ? v : [...v, id]))
      setSelected(null)
      setIdea(0)
      setRecall({ status: 'asking', feedback: null })
      setReplayKey((k) => k + 1)
    },
    [m.steps],
  )

  // Hesitation signal: a long stretch on one step with no interaction.
  const lastAct = useRef(0)
  const touch = useCallback(() => {
    lastAct.current = Date.now()
  }, [])
  useEffect(() => {
    lastAct.current = Date.now()
    const t = setInterval(() => {
      if (!document.hidden && !playing && Date.now() - lastAct.current > HESITATE_MS) {
        recordSignal('hesitate', s.id)
        lastAct.current = Date.now()
      }
    }, 5000)
    return () => clearInterval(t)
  }, [s.id, playing])

  const go = (next: number) => {
    touch()
    if (next < 0 || next >= m.steps.length) return
    if (next < step) recordSignal('back', s.id)
    setQuizActive(false)
    changeStep(next)
  }

  const onPick = (part: PartId) => {
    touch()
    if (quizActive) return answerQuiz(part)
    setSelected(part)
    if (!s.recall || recall.status !== 'asking' || level === 'high') return
    const correct = part === s.recall.target
    // onPick runs only from tap/click handlers; the compiler cannot see that through stageProps.
    // eslint-disable-next-line react-hooks/purity
    db.events.add({ moduleId: m.id, type: 'recall', stepId: s.id, target: s.recall.target, chosen: part, correct, at: Date.now() }).catch(() => setSaveError(true))
    recordSignal(correct ? 'hit' : 'miss', s.id)
    if (correct) {
      setRecall({ status: 'correct', feedback: `Yes. ${s.recall.why}` })
    } else {
      const p = m.parts[part]
      setRecall({ status: 'asking', feedback: `That is the ${p.name.toLowerCase()}, ${p.role.toLowerCase()}. Try again.` })
      // eslint-disable-next-line react-hooks/purity
      db.review.put({ stepId: s.id, reason: 'missed', addedAt: Date.now() }).catch(() => setSaveError(true))
      // If this miss simplified the lesson, refocus on the step's own part.
      if (enabled && currentLevel() === 'high') setSelected(null)
    }
  }

  const answerQuiz = (part: PartId) => {
    const target = m.recapQuiz[quiz.i]!
    const correct = part === target
    db.events.add({ moduleId: m.id, type: 'quiz', stepId: s.id, target, chosen: part, correct, at: Date.now() }).catch(() => setSaveError(true))
    const advance = (q: QuizState): QuizState => {
      const i = q.i + 1
      if (i >= m.recapQuiz.length) {
        setQuizActive(false)
        return { ...q, i: q.i, tries: 0, done: true, feedback: null }
      }
      return { ...q, i, tries: 0 }
    }
    setQuiz((q) => {
      if (correct) {
        const base = q.tries === 0 ? { ...q, firstTry: [...q.firstTry, target] } : q
        return advance({ ...base, feedback: `Yes, that is the ${m.parts[target].name.toLowerCase()}.` })
      }
      const missed = q.missed.includes(target) ? q.missed : [...q.missed, target]
      if (q.tries >= 1) return advance({ ...q, missed, feedback: `That was the ${m.parts[part].name.toLowerCase()}. Moving on; the ${m.parts[target].name.toLowerCase()} is now on your list.` })
      return { ...q, tries: q.tries + 1, missed, feedback: `That is the ${m.parts[part].name.toLowerCase()}. One more try.` }
    })
  }

  const keepWeak = async () => {
    const steps = quiz.missed.map((p) => m.steps.find((x) => x.partId === p)!.id)
    try {
      await db.review.bulkPut(steps.map((stepId) => ({ stepId, reason: 'kept' as const, addedAt: Date.now() })))
      setKept(true)
    } catch {
      setSaveError(true)
    }
  }

  // Guided narration: sound or captions must stay on (design doc 6A).
  const highLoad = level === 'high'
  const playingRef = useRef(playing)
  useEffect(() => {
    playingRef.current = playing
  }, [playing])
  const onNarrationDone = useCallback(() => {
    // Pause at checks so the learner answers; otherwise move on after a hold.
    if (s.recall || step === m.steps.length - 1) return setPlaying(false)
    setTimeout(() => playingRef.current && changeStep(Math.min(step + 1, m.steps.length - 1)), highLoad ? 3000 : 1500)
  }, [s.recall, step, m.steps.length, highLoad, changeStep])
  const narration = useNarration({
    sentences: s.narration,
    restartKey: `${step}:${replayKey}`,
    playing: mode === 'guided' && playing,
    sound: prefs.sound,
    rate: prefs.rate * (highLoad ? 0.85 : 1),
    pauseMs: highLoad ? 1200 : 350,
    onDone: onNarrationDone,
  })

  const setSound = (sound: boolean) => {
    if (!sound && !prefs.captions) return switchToReader('Guided mode needs sound or captions, so you are now in Reader mode.')
    setPrefs({ sound })
  }
  const setCaptions = (captions: boolean) => {
    if (!captions && !prefs.sound) return switchToReader('Guided mode needs sound or captions, so you are now in Reader mode.')
    setPrefs({ captions })
  }
  const switchToReader = (why: string) => {
    setPlaying(false)
    setMode('reader')
    setNotice(why)
  }
  const chooseMode = (next: Mode) => {
    touch()
    if (next === 'reader') setPlaying(false)
    setMode(next)
    setNotice(null)
  }

  // While a check is asking, nothing is pre-highlighted: that would give the answer away.
  const highlight = selected ?? (asking ? null : s.partId)
  const labels = useMemo<PartId[]>(() => {
    if (asking) return []
    if (level === 'high') return s.partId ? [s.partId] : []
    if (level === 'medium') return s.focus
    return parts.map((p) => p.id)
  }, [asking, level, s.partId, s.focus, parts])

  const stageProps: StageProps = {
    stepIndex: step,
    highlight,
    labels,
    outerVisible,
    flow: s.flow,
    animate: !reduced,
    replayKey,
    command,
    partNames: names,
    onPick,
    onNotice: setNotice,
  }

  const isRecap = step === m.steps.length - 1
  const lines = highLoad ? [s.scaffold[idea]!] : s.reader

  return (
    <div className="explainer" data-load={level}>
      <div className="explainer__top">
        <div>
          <p className="eyebrow">
            Step {step + 1} of {m.steps.length}
          </p>
          <h2 ref={headingRef} tabIndex={-1} className="explainer__title">
            {s.title}
          </h2>
        </div>
        <div className="segmented" role="group" aria-label="Explainer mode">
          <button type="button" aria-pressed={mode === 'guided'} onClick={() => chooseMode('guided')}>
            Listen and watch
          </button>
          <button type="button" aria-pressed={mode === 'reader'} onClick={() => chooseMode('reader')}>
            Read and watch
          </button>
        </div>
      </div>

      <div className="adapt" role="status" aria-live="polite">
        {enabled && level !== 'low' && load.reason && (
          <div className="adapt__notice">
            <p>
              <strong>{highLoad ? 'Simplified' : 'Lightened'}:</strong> {load.reason}.{' '}
              {highLoad
                ? `Showing one idea at a time, fewer labels${mode === 'guided' ? ' and slower narration' : ''}.`
                : 'Showing labels for this step only.'}
            </p>
            <div className="row">
              <button type="button" className="btn btn--small" onClick={revertLoad}>
                Back to full view
              </button>
              <Link href="/settings#learning" className="btn btn--quiet btn--small">
                Adaptation settings
              </Link>
            </div>
          </div>
        )}
        {notice && <p className="adapt__info">{notice}</p>}
        {saveError && <p className="field__error">Progress could not be saved on this device. You can keep learning, but it may not be here next time.</p>}
      </div>

      <div className="explainer__grid">
        <div className="explainer__visual">
          <div className="stage" style={{ ['--blob-mask' as string]: STAGE_MASK }}>
            {/* Static: the model is masked to this exact shape, and lesson visuals should not drift. */}
            <BlobWindow seed={7} width={800} height={500} wobble={0.06} stars={26} className="stage__bg" />
            {use3d ? (
              <Suspense fallback={<InkLoader label="Loading the 3D model" />}>
                <Model3D {...stageProps} />
              </Suspense>
            ) : (
              <Diagram2D {...stageProps} />
            )}
          </div>
          <p className="stage__caption">
            {use3d ? '3D teaching model drawn in code. Drag to turn it, tap a part to read about it.' : 'Diagram tier: a flat cross-section with the same parts and steps.'}{' '}
            Simplified, not to scale.
            {!use3d && prefs.tier !== '2d' && ' 3D is not available on this device.'}
          </p>
          {use3d && <ViewTray onCommand={(type) => setCommand({ type, n: Date.now() })} outerVisible={outerVisible} setOuterVisible={setOuterVisible} />}
          <PartsTray parts={parts} active={selected} asking={asking} onPick={onPick} />
        </div>

        <div className="explainer__text">
          {mode === 'reader' ? (
            <section className="card-step" aria-label="Step text">
              {highLoad && (
                <p className="eyebrow">
                  Idea {idea + 1} of {s.scaffold.length}
                </p>
              )}
              {lines.map((l, i) => (
                <p key={i} className={i === 0 ? 'lead' : undefined}>
                  {l}
                </p>
              ))}
              <div className="row">
                <button type="button" className="btn" onClick={() => go(step - 1)} disabled={step === 0}>
                  <Icon name="prev" size={18} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    touch()
                    recordSignal('replay', s.id)
                    setReplayKey((k) => k + 1)
                  }}
                >
                  <Icon name="replay" size={18} />
                  <span>Replay</span>
                </button>
                {highLoad && idea < s.scaffold.length - 1 ? (
                  <button type="button" className="btn btn--accent" onClick={() => setIdea(idea + 1)}>
                    <span>Next idea</span>
                    <Icon name="next" size={18} />
                  </button>
                ) : (
                  <button type="button" className="btn btn--accent" onClick={() => go(step + 1)} disabled={isRecap}>
                    <span>Next step</span>
                    <Icon name="next" size={18} />
                  </button>
                )}
              </div>
            </section>
          ) : (
            <section className="guided" aria-label="Narration">
              <div className="guided__bar">
                <button type="button" className="btn" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Previous step">
                  <Icon name="prev" size={18} />
                </button>
                <button type="button" className="btn btn--accent" onClick={() => (touch(), setPlaying(!playing))}>
                  <Icon name={playing ? 'pause' : 'play'} size={18} />
                  <span>{playing ? 'Pause' : 'Play'}</span>
                </button>
                <button type="button" className="btn" onClick={() => go(step + 1)} disabled={isRecap} aria-label="Next step">
                  <Icon name="next" size={18} />
                </button>
                <label className="select-inline">
                  <span>Speed</span>
                  <select value={prefs.rate} onChange={(e) => setPrefs({ rate: Number(e.target.value) })}>
                    <option value={0.8}>0.8x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                  </select>
                </label>
              </div>
              <div className="row">
                <label className="check">
                  <input type="checkbox" checked={prefs.sound} onChange={(e) => setSound(e.target.checked)} />
                  <span>Sound</span>
                </label>
                <label className="check">
                  <input type="checkbox" checked={prefs.captions} onChange={(e) => setCaptions(e.target.checked)} />
                  <span>Captions</span>
                </label>
              </div>
              {prefs.captions && (
                <p className="caption" aria-live="off">
                  {s.narration[narration.index]}
                </p>
              )}
              <p className="inline-status">
                {playing && narration.engine === 'captions'
                  ? prefs.sound
                    ? 'Spoken narration is not available here, so captions are paced for reading.'
                    : 'Sound is off. Captions are paced for reading.'
                  : playing
                    ? 'Narrating.'
                    : 'Paused.'}
              </p>
              <details className="transcript">
                <summary>Full transcript</summary>
                {m.steps.map((x, i) => (
                  <div key={x.id}>
                    <h4>
                      {i + 1}. {x.title}
                    </h4>
                    <p>{x.narration.join(' ')}</p>
                  </div>
                ))}
              </details>
            </section>
          )}

          {selected && <PartDetail part={m.parts[selected]} onClose={() => setSelected(null)} />}

          {isRecap ? (
            <RecapQuiz
              module={m}
              quiz={quiz}
              active={quizActive}
              kept={kept}
              onStart={() => {
                setQuiz(freshQuiz)
                setKept(false)
                setSelected(null)
                setQuizActive(true)
              }}
              onKeep={keepWeak}
            />
          ) : (
            <RecallPanel
              step={s}
              state={recall}
              parts={m.parts}
              level={level}
              onSkip={() => setRecall({ status: 'correct', feedback: 'Skipped. It will come back in the recap quiz.' })}
            />
          )}

          <AnalogyLayer key={`${s.id}:${level}`} step={s} domain={prefs.analogy} level={level} />
        </div>
      </div>

      <nav className="steps" aria-label="Explainer steps">
        <ol>
          {m.steps.map((x, i) => (
            <li key={x.id}>
              <button type="button" aria-current={i === step ? 'step' : undefined} data-viewed={viewed.includes(x.id)} onClick={() => go(i)}>
                <span className="steps__dot" aria-hidden="true" />
                <span className="steps__label">
                  {i + 1}. {x.title}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <footer className="sources">
        <h3>Sources and accuracy</h3>
        <p>{m.simplification}</p>
        <ul>
          {m.sources.map((src) => (
            <li key={src.id}>
              {src.citation}
              {src.url && (
                <>
                  {' '}
                  <a href={src.url} target="_blank" rel="noreferrer">
                    Open source (online)
                  </a>
                </>
              )}
            </li>
          ))}
        </ul>
        <p className="meta">
          Subject-expert review: {m.reviewer ?? 'not yet assigned'}. Content last revised {formatDate(m.revised)}, from the module file.
        </p>
      </footer>
    </div>
  )
}
