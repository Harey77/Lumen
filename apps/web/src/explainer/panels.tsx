import { useState } from 'react'
import { Link } from 'wouter'
import { CopyButton } from '../components/CopyButton'
import { Icon } from '../components/Icon'
import { db } from '../lib/db'
import type { ExplainerModule, Part, PartId, Step } from '../content/types'
import type { LoadLevel } from '../load-engine/load-engine'
import type { ViewCommand } from './stage'

export function PartsTray({
  parts,
  active,
  asking,
  onPick,
}: {
  parts: Part[]
  active: PartId | null
  asking: boolean
  onPick: (p: PartId) => void
}) {
  return (
    <div className="tray" role="group" aria-label={asking ? 'Answer by choosing a part' : 'Parts of the mitochondrion'}>
      <p className="eyebrow" aria-hidden="true">
        {asking ? 'Answer with a part' : 'Parts'}
      </p>
      <ul className="tray__list">
        {parts.map((p) => (
          <li key={p.id}>
            <button type="button" className="chip" aria-pressed={!asking && active === p.id} onClick={() => onPick(p.id)}>
              {p.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ViewTray({
  onCommand,
  outerVisible,
  setOuterVisible,
}: {
  onCommand: (t: ViewCommand['type']) => void
  outerVisible: boolean
  setOuterVisible: (v: boolean) => void
}) {
  return (
    <div className="view-tray" role="group" aria-label="View controls">
      <button type="button" className="tool" onClick={() => onCommand('rotate-left')}>
        <Icon name="rotateLeft" size={18} />
        <span>Turn left</span>
      </button>
      <button type="button" className="tool" onClick={() => onCommand('rotate-right')}>
        <Icon name="rotateRight" size={18} />
        <span>Turn right</span>
      </button>
      <button type="button" className="tool" onClick={() => onCommand('zoom-in')}>
        <Icon name="zoomIn" size={18} />
        <span>Closer</span>
      </button>
      <button type="button" className="tool" onClick={() => onCommand('zoom-out')}>
        <Icon name="zoomOut" size={18} />
        <span>Farther</span>
      </button>
      <button type="button" className="tool" onClick={() => onCommand('reset')}>
        <Icon name="reset" size={18} />
        <span>Reset view</span>
      </button>
      <button type="button" className="tool" aria-pressed={outerVisible} onClick={() => setOuterVisible(!outerVisible)}>
        <Icon name="layers" size={18} />
        <span>Outer layer</span>
      </button>
    </div>
  )
}

export function PartDetail({ part, onClose }: { part: Part; onClose: () => void }) {
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const text = `${part.name}: ${part.line}`
  const save = async () => {
    setSaved('saving')
    try {
      await db.notes.add({ title: part.name, body: `${part.role}. ${part.line}`, createdAt: Date.now() })
      setSaved('saved')
    } catch {
      setSaved('error')
    }
  }
  return (
    <section className="part-detail" aria-labelledby="part-detail-title">
      <p className="eyebrow">{part.role}</p>
      <h3 id="part-detail-title" className="part-detail__name">
        {part.name}
      </h3>
      <p>{part.line}</p>
      <div className="row">
        <CopyButton text={text} label={`Copy the definition of ${part.name}`} />
        <button type="button" className="btn btn--quiet btn--small" onClick={save} disabled={saved === 'saving' || saved === 'saved'}>
          <Icon name={saved === 'saved' ? 'check' : 'save'} size={16} />
          <span>{saved === 'saved' ? 'Saved to notes' : 'Save to notes'}</span>
        </button>
        <button type="button" className="btn btn--quiet btn--small" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="inline-status" role="status">
        {saved === 'saved' && (
          <>
            Saved on this device. <Link href="/library">Open Library</Link>
          </>
        )}
        {saved === 'error' && 'Could not save on this device. Storage may be full or blocked.'}
      </p>
    </section>
  )
}

export function AnalogyLayer({ step, domain, level }: { step: Step; domain: 'machines' | 'cooking'; level: LoadLevel }) {
  const [open, setOpen] = useState(level === 'low')
  if (level === 'high') return null
  const a = step.analogy[domain]
  const shown = open || level === 'low'
  return (
    <section className="analogy" aria-label="Analogy">
      {level !== 'low' && (
        <button type="button" className="btn btn--quiet btn--small" aria-expanded={shown} onClick={() => setOpen(!open)}>
          {shown ? 'Hide the analogy' : 'Show an analogy'}
        </button>
      )}
      {shown && (
        <>
          <p className="eyebrow">Analogy, {domain === 'machines' ? 'power and machines' : 'cooking'}</p>
          <p className="analogy__text">{a.text}</p>
          <p className="analogy__breaks">
            <strong>Where it breaks: </strong>
            {a.breaks}
          </p>
        </>
      )}
    </section>
  )
}

export interface RecallState {
  status: 'asking' | 'correct'
  feedback: string | null
}

export function RecallPanel({ step, state, parts, level, onSkip }: { step: Step; state: RecallState; parts: ExplainerModule['parts']; level: LoadLevel; onSkip: () => void }) {
  if (!step.recall) return null
  if (level === 'high' && state.status === 'asking') {
    return (
      <section className="recall" aria-labelledby="recall-title">
        <h3 id="recall-title" className="recall__title">
          Check moved to the recap
        </h3>
        <p>Focus on this step first. You can place {parts[step.recall.target].name} in the recap quiz at the end.</p>
      </section>
    )
  }
  return (
    <section className="recall" aria-labelledby="recall-title" data-status={state.status}>
      <p className="eyebrow">Check yourself</p>
      <h3 id="recall-title" className="recall__title">
        {step.recall.prompt}
      </h3>
      <p className="recall__hint">Tap the model, or choose a part below.</p>
      <p className="recall__feedback" role="status" aria-live="polite">
        {state.feedback}
      </p>
      {state.status === 'asking' && (
        <button type="button" className="btn btn--quiet btn--small" onClick={onSkip}>
          Skip this check
        </button>
      )}
    </section>
  )
}

export interface QuizState {
  i: number
  tries: number
  firstTry: PartId[]
  missed: PartId[]
  feedback: string | null
  done: boolean
}
export const freshQuiz: QuizState = { i: 0, tries: 0, firstTry: [], missed: [], feedback: null, done: false }

export function RecapQuiz({
  module,
  quiz,
  active,
  onStart,
  onKeep,
  kept,
}: {
  module: ExplainerModule
  quiz: QuizState
  active: boolean
  onStart: () => void
  onKeep: () => void
  kept: boolean
}) {
  const target = module.recapQuiz[quiz.i]
  if (!active && !quiz.done) {
    return (
      <section className="recall" aria-labelledby="quiz-title">
        <p className="eyebrow">Recap quiz</p>
        <h3 id="quiz-title" className="recall__title">
          Can you place the six parts?
        </h3>
        <p>Labels hide while you answer. Missed parts can be kept for review.</p>
        <button type="button" className="btn btn--accent" onClick={onStart}>
          Start the recap quiz
        </button>
      </section>
    )
  }
  if (quiz.done) {
    const name = (p: PartId) => module.parts[p].name
    return (
      <section className="recall" aria-labelledby="quiz-title" data-status="correct">
        <p className="eyebrow">Recap quiz</p>
        <h3 id="quiz-title" className="recall__title" tabIndex={-1}>
          Quiz finished
        </h3>
        {quiz.firstTry.length > 0 && <p>Placed on the first try: {quiz.firstTry.map(name).join(', ')}.</p>}
        {quiz.missed.length > 0 ? (
          <>
            <p>Worth another look: {quiz.missed.map(name).join(', ')}.</p>
            <button type="button" className="btn btn--accent" onClick={onKeep} disabled={kept}>
              {kept ? 'Kept for review' : 'Keep this for review'}
            </button>
            <p className="inline-status" role="status">
              {kept && (
                <>
                  Added to your review list. <Link href="/library">Open Library</Link>
                </>
              )}
            </p>
          </>
        ) : (
          <p>Every part placed on the first try.</p>
        )}
        <p>
          <Link href="/skills">See it in your skills</Link> or <Link href="/perspectives">find out how this was proven</Link>.
        </p>
      </section>
    )
  }
  return (
    <section className="recall" aria-labelledby="quiz-title">
      <p className="eyebrow">
        Recap quiz, {quiz.i + 1} of {module.recapQuiz.length}
      </p>
      <h3 id="quiz-title" className="recall__title">
        Tap the {module.parts[target!].name.toLowerCase()}.
      </h3>
      <p className="recall__feedback" role="status" aria-live="polite">
        {quiz.feedback}
      </p>
    </section>
  )
}
