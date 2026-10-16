import { useId, useRef, useState } from 'react'
import { Link } from 'wouter'
import { Icon } from '../components/Icon'
import { lessonById, questionById, type Question } from '../content/catalog'
import { db } from '../lib/db'
import { nextQueue, recommend, resolve, tally, toAnswer, type Answer } from '../lib/quiz'

interface Props {
  /** Main sequence of question ids. Follow-ups are inserted adaptively. */
  ids: string[]
  source: string
  lessonId: string | null
  title: string
}

type Phase = 'intro' | 'asking' | 'done'

export function QuizRunner({ ids, source, lessonId, title }: Props) {
  const uid = useId()
  const [phase, setPhase] = useState<Phase>('intro')
  const [queue, setQueue] = useState<string[]>(ids)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<'idle' | 'saved' | 'failed'>('idle')
  const headRef = useRef<HTMLHeadingElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  const current: Question | undefined = questionById(queue[0] ?? '')
  const asked = new Set(answers.map((a) => a.questionId))
  // queue[0] is the current question until the learner moves on.
  const left = queue.length - (submitted ? 1 : 0)
  const progress = answers.length / Math.max(1, answers.length + left)

  const start = () => {
    setQueue(ids)
    setAnswers([])
    setSelected(null)
    setSubmitted(false)
    setError(null)
    setSaved('idle')
    setPhase('asking')
    requestAnimationFrame(() => headRef.current?.focus())
  }

  const submit = () => {
    if (!current) return
    if (!selected) {
      setError('Choose an answer first.')
      return
    }
    setError(null)
    setAnswers((a) => [...a, toAnswer(current, selected)])
    setSubmitted(true)
    requestAnimationFrame(() => nextRef.current?.focus())
  }

  const advance = async () => {
    if (!current) return
    const last = answers[answers.length - 1]!
    const nextQ = nextQueue(queue, current, last.correct, asked)
    setQueue(nextQ)
    setSelected(null)
    setSubmitted(false)
    if (nextQ.length === 0) {
      setPhase('done')
      // Only finished quizzes are recorded.
      const t = tally(answers)
      try {
        // Runs from the Next button handler, not during render.
        // eslint-disable-next-line react-hooks/purity
        await db.attempts.add({ source, lessonId, answers, correct: t.correct, total: t.total, outcome: recommend(answers, lessonId).outcome, at: Date.now() })
        setSaved('saved')
      } catch {
        setSaved('failed')
      }
    }
    requestAnimationFrame(() => headRef.current?.focus())
  }

  if (ids.length === 0) {
    return <p className="empty">No questions in this set yet.</p>
  }

  if (phase === 'intro') {
    return (
      <div className="quiz quiz--intro">
        <p className="eyebrow">Quiz · {ids.length} questions</p>
        <h3 className="quiz__title">{title}</h3>
        <p className="muted">One question at a time. Miss one and Lumen follows up with a simpler question on the same idea.</p>
        <button type="button" className="btn btn--accent" onClick={start}>
          Start the quiz
          <Icon name="next" size={18} />
        </button>
      </div>
    )
  }

  if (phase === 'done') {
    const t = tally(answers)
    const rec = recommend(answers, lessonId)
    return (
      <div className="quiz quiz--done" data-outcome={rec.outcome}>
        <p className="eyebrow">Result</p>
        <h3 className="quiz__title" ref={headRef} tabIndex={-1}>
          {t.correct} of {t.total} correct
        </h3>
        <div className="quiz__meter" aria-hidden="true">
          <span style={{ transform: `scaleX(${t.total ? t.correct / t.total : 0})` }} />
        </div>
        {t.total !== t.mainTotal && (
          <p className="muted">
            {t.mainCorrect} of {t.mainTotal} main questions, plus {t.total - t.mainTotal} simpler follow-up {t.total - t.mainTotal === 1 ? 'question' : 'questions'}.
          </p>
        )}
        <section className="recommend" aria-labelledby={`${uid}-rec`}>
          <h4 id={`${uid}-rec`} className="recommend__title">
            {rec.title}
          </h4>
          <p>{rec.text}</p>
          <ul className="recommend__actions">
            {rec.actions.map((a) => (
              <li key={a.href + a.label}>
                <Link href={a.href} className="arrow-link">
                  {a.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <p className="inline-status" role="status">
          {saved === 'saved' && 'Result saved to My Learning.'}
          {saved === 'failed' && 'This result could not be saved in this browser.'}
        </p>
        <details className="quiz__review">
          <summary>Review every answer</summary>
          <ol>
            {resolve(answers.map((a) => a.questionId)).map((q, i) => {
              const a = answers[i]!
              return (
                <li key={q.id} data-correct={a.correct}>
                  <p className="quiz__review-q">{q.prompt}</p>
                  <p>
                    Your answer: <strong>{q.choices.find((c) => c.id === a.chosen)?.text}</strong> {a.correct ? '(correct)' : '(incorrect)'}
                  </p>
                  {!a.correct && <p>Correct answer: {q.choices.find((c) => c.id === q.answer)?.text}</p>}
                  <p className="muted">{q.explanation}</p>
                </li>
              )
            })}
          </ol>
        </details>
        <button type="button" className="btn" onClick={start}>
          <Icon name="replay" size={18} />
          Retry the quiz
        </button>
      </div>
    )
  }

  if (!current) return null
  const last = submitted ? answers[answers.length - 1] : undefined
  const picked = current.choices.find((c) => c.id === selected)
  const willFollowUp = last && !last.correct && current.followUp && !asked.has(current.followUp)

  return (
    <div className="quiz">
      <div className="quiz__progress">
        <span>
          Question {answers.length + (submitted ? 0 : 1)} · {queue.length - 1 > 0 ? `${queue.length - 1} more after this` : 'last in this set'}
          {current.remedial && ' · simpler follow-up'}
        </span>
        <span className="quiz__bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </span>
      </div>
      <div className="quiz__card" key={current.id}>
        <h3 className="quiz__prompt" ref={headRef} tabIndex={-1} id={`${uid}-q`}>
          {current.prompt}
        </h3>
        {current.code && <pre className="code code--inline"><code>{current.code}</code></pre>}
        <fieldset className="choices" aria-labelledby={`${uid}-q`} aria-describedby={error ? `${uid}-err` : undefined} disabled={submitted}>
          {current.choices.map((c) => {
            const state = !submitted ? undefined : c.id === current.answer ? 'right' : c.id === selected ? 'wrong' : undefined
            return (
              <label key={c.id} className="choice" data-state={state}>
                <input type="radio" name={`${uid}-choice`} value={c.id} checked={selected === c.id} onChange={() => (setSelected(c.id), setError(null))} />
                <span className="choice__mark" aria-hidden="true" />
                <span className="choice__text">{c.text}</span>
                {state === 'right' && <span className="choice__tag">Correct answer</span>}
                {state === 'wrong' && <span className="choice__tag">Your answer</span>}
              </label>
            )
          })}
        </fieldset>
        {error && (
          <p id={`${uid}-err`} className="field__error" role="alert">
            {error}
          </p>
        )}
        <div className="quiz__feedback" role="status" aria-live="polite">
          {last && (
            <div className="feedback" data-correct={last.correct}>
              <p className="feedback__verdict">
                <Icon name={last.correct ? 'check' : 'close'} size={18} />
                {last.correct ? 'Correct.' : 'Not quite.'}
              </p>
              {!last.correct && picked?.why && <p>{picked.why}</p>}
              <p>{current.explanation}</p>
              {!last.correct && <ConceptLink lessonId={current.lessonId} concept={current.concept} />}
              {willFollowUp && <p className="feedback__next">Next: a simpler question on the same idea.</p>}
            </div>
          )}
        </div>
        <div className="row">
          {!submitted ? (
            <button type="button" className="btn btn--accent" onClick={submit}>
              Check answer
            </button>
          ) : (
            <button type="button" className="btn btn--accent" ref={nextRef} onClick={advance}>
              {queue.length > 1 || willFollowUp ? 'Next question' : 'See results'}
              <Icon name="next" size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ConceptLink({ lessonId, concept }: { lessonId: string; concept: string }) {
  const c = lessonById(lessonId)?.concepts[concept]
  if (!c) return null
  return (
    <p>
      <Link href={c.href.startsWith('#') ? `/learn/${lessonId}${c.href}` : c.href} className="arrow-link">
        Re-read: {c.label}
      </Link>
    </p>
  )
}

