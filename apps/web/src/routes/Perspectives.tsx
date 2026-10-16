import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link } from 'wouter'
import { BackToTop, ScrollProgress } from '../components/ScrollAids'
import { InkLoader, formatDate } from '../components/Small'
import { chemiosmosis as c, type Choice } from '../content/chemiosmosis'
import { db, type PerspectiveRecord } from '../lib/db'
import { usePageTitle } from './usePageTitle'

const MIN = 40
const MAX = 2000

async function save(patch: Partial<PerspectiveRecord>) {
  const current = (await db.perspectives.get(c.id)) ?? { scenarioId: c.id }
  await db.perspectives.put({ ...current, ...patch })
}

export function Perspectives() {
  usePageTitle('Perspectives')
  const record = useLiveQuery(() => db.perspectives.get(c.id).then((r) => r ?? null))
  return (
    <>
      <ScrollProgress />
      <article className="page page--reading">
        <header className="page__head">
          <p className="eyebrow">Perspective scenario · Biology, history of science</p>
          <h1 className="display display--small">{c.title}</h1>
          <p className="lead">{c.question}</p>
          <p className="guardrail">{c.guardrail}</p>
          <p className="muted">
            The role below is a written brief based on cited sources, not an AI character. Quotations are never invented; paraphrases are marked.
          </p>
        </header>
        {record === undefined ? <InkLoader label="Opening your saved answers" /> : <Scenario record={record} />}
        <footer className="sources">
          <h2 className="section-title">Sources</h2>
          <ul>
            {Object.entries(c.sources).map(([k, v]) => (
              <li key={k}>{v}</li>
            ))}
          </ul>
          <p className="meta">
            Subject-expert review: {c.reviewer ?? 'not yet assigned'}. Scenario last revised {formatDate(c.revised)}, from the scenario file.
          </p>
        </footer>
      </article>
      <BackToTop />
    </>
  )
}

function Radios({ name, legend, choices, value, onChange, error, describedBy }: { name: string; legend: string; choices: Choice[]; value: string | undefined; onChange: (v: string) => void; error?: string; describedBy?: string }) {
  const id = useId()
  return (
    <fieldset className="radios" aria-invalid={!!error} aria-describedby={error ? `${id}-e` : describedBy}>
      <legend>{legend}</legend>
      {choices.map((ch) => (
        <label key={ch.id} className="radio">
          <input type="radio" name={name} value={ch.id} checked={value === ch.id} onChange={() => onChange(ch.id)} />
          <span>{ch.label}</span>
        </label>
      ))}
      {error && (
        <p id={`${id}-e`} className="field__error">
          {error}
        </p>
      )}
    </fieldset>
  )
}

function Scenario({ record }: { record: PerspectiveRecord | null }) {
  const id = useId()
  const [pre, setPre] = useState(record?.preBelief)
  const [argument, setArgument] = useState(record?.argument ?? '')
  const [prediction, setPrediction] = useState(record?.prediction)
  const [convincer, setConvincer] = useState(record?.convincer)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<{ kind: 'idle' | 'saving' | 'saved' | 'invalid' | 'storage'; text: string }>(
    record?.savedAt ? { kind: 'saved', text: 'Your argument is saved on this device.' } : { kind: 'idle', text: '' },
  )
  const [post, setPost] = useState(record?.postBelief)
  const revealed = !!record?.revealedAt
  const revealRef = useRef<HTMLHeadingElement>(null)
  const dirty = argument.trim() !== (record?.argument ?? '') || prediction !== record?.prediction || convincer !== record?.convincer
  const canReveal = !!record?.savedAt && !dirty

  useEffect(() => {
    if (revealed) revealRef.current?.focus()
  }, [revealed])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (status.kind === 'saving') return
    const a = argument.trim()
    const next: Record<string, string> = {}
    if (a.length < MIN) next.argument = `Write at least ${MIN} characters so there is a real case to compare (now ${a.length}).`
    if (a.length > MAX) next.argument = `Keep it under ${MAX} characters (now ${a.length}).`
    if (!prediction) next.prediction = 'Choose what your hypothesis predicts.'
    if (!convincer) next.convincer = 'Choose the result that would hurt your side most.'
    setErrors(next)
    if (Object.keys(next).length) {
      setStatus({ kind: 'invalid', text: 'Not saved yet. Check the highlighted answers.' })
      document.getElementById(next.argument ? `${id}-arg` : next.prediction ? `${id}-pred` : `${id}-conv`)?.focus()
      return
    }
    setStatus({ kind: 'saving', text: 'Saving…' })
    try {
      await save({ argument: a, prediction, convincer, savedAt: Date.now() })
      setStatus({ kind: 'saved', text: 'Your argument is saved on this device.' })
    } catch {
      setStatus({ kind: 'storage', text: 'This browser would not save your argument. Your text is still here; try again.' })
    }
  }

  const label = (choices: Choice[], v?: string) => choices.find((x) => x.id === v)?.label ?? 'No answer'

  return (
    <>
      <section className="section" aria-labelledby={`${id}-s1`}>
        <h2 id={`${id}-s1`} className="section-title">
          1. Before you start
        </h2>
        <Radios
          name="pre"
          legend={c.belief.prompt}
          choices={c.belief.choices}
          value={pre}
          onChange={(v) => {
            setPre(v)
            save({ preBelief: v }).catch(() => setStatus({ kind: 'storage', text: 'Could not save that answer on this device.' }))
          }}
        />
      </section>

      <section className="section" aria-labelledby={`${id}-s2`}>
        <h2 id={`${id}-s2`} className="section-title">
          2. Your role
        </h2>
        <p className="eyebrow">{c.role.name}</p>
        {c.role.brief.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        <blockquote className="paraphrase">
          <p>{c.role.paraphrase.text}</p>
          <footer>Paraphrased from {c.sources[c.role.paraphrase.source]}</footer>
        </blockquote>
      </section>

      <section className="section" aria-labelledby={`${id}-s3`}>
        <h2 id={`${id}-s3`} className="section-title">
          3. Make your case
        </h2>
        <form className="form" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor={`${id}-arg`}>{c.argumentPrompt}</label>
            <textarea
              id={`${id}-arg`}
              rows={6}
              value={argument}
              onChange={(e) => setArgument(e.target.value)}
              aria-invalid={!!errors.argument}
              aria-describedby={`${id}-arg-help${errors.argument ? ` ${id}-arg-e` : ''}`}
              disabled={revealed}
            />
            <p id={`${id}-arg-help`} className="field__help">
              {argument.trim().length} characters. At least {MIN}.
            </p>
            {errors.argument && (
              <p id={`${id}-arg-e`} className="field__error">
                {errors.argument}
              </p>
            )}
          </div>
          <div id={`${id}-pred`} tabIndex={-1}>
            <Radios name="prediction" legend={c.prediction.prompt} choices={c.prediction.choices} value={prediction} onChange={setPrediction} error={errors.prediction} />
          </div>
          <div id={`${id}-conv`} tabIndex={-1}>
            <Radios name="convincer" legend={c.convincer.prompt} choices={c.convincer.choices} value={convincer} onChange={setConvincer} error={errors.convincer} />
          </div>
          {!revealed && (
            <div className="row">
              <button type="submit" className="btn btn--accent" disabled={status.kind === 'saving'} aria-busy={status.kind === 'saving'}>
                Save my argument
              </button>
              <button
                type="button"
                className="btn"
                disabled={!canReveal}
                onClick={() => save({ revealedAt: Date.now() }).catch(() => setStatus({ kind: 'storage', text: 'Could not save on this device.' }))}
              >
                Reveal the consensus
              </button>
            </div>
          )}
          <p className={`form__status form__status--${status.kind}`} role="status">
            {status.text}
            {!revealed && status.kind === 'saved' && dirty && ' You have unsaved changes; save them before the reveal.'}
          </p>
        </form>
      </section>

      {revealed && (
        <section className="section reveal" aria-labelledby={`${id}-s4`}>
          <h2 id={`${id}-s4`} className="section-title" ref={revealRef} tabIndex={-1}>
            4. What settled it
          </h2>
          {c.consensus.summary.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <blockquote className="paraphrase">
            <p>{c.consensus.paraphrase.text}</p>
            <footer>Paraphrased from {c.sources[c.consensus.paraphrase.source]}</footer>
          </blockquote>

          <h3 className="subhead">Your reasoning beside the evidence</h3>
          <div className="compare">
            <div>
              <p className="eyebrow">You argued</p>
              <p className="compare__quote">{record?.argument}</p>
            </div>
            <div>
              <p className="eyebrow">Leaky membranes</p>
              <p>
                You predicted: <strong>{label(c.prediction.choices, record?.prediction)}</strong>.
              </p>
              <p>{c.prediction.explanation}</p>
            </div>
            <div>
              <p className="eyebrow">The decisive result</p>
              <p>
                You chose: <strong>{label(c.convincer.choices, record?.convincer)}</strong>
                {record?.convincer === c.convincer.actual ? '. That is the experiment that did it.' : '.'}
              </p>
              <p>{c.convincer.explanation}</p>
            </div>
          </div>

          <h3 className="subhead">Timeline</h3>
          <ol className="timeline">
            {c.timeline.map((t) => (
              <li key={t.year}>
                <span className="timeline__year">{t.year}</span>
                <span>
                  {t.text} <span className="cite">({c.sources[t.source]?.split('.')[0]})</span>
                </span>
              </li>
            ))}
          </ol>

          <h3 className="subhead">5. And now?</h3>
          <Radios
            name="post"
            legend={c.belief.prompt}
            choices={c.belief.choices}
            value={post}
            onChange={(v) => {
              setPost(v)
              save({ postBelief: v }).catch(() => setStatus({ kind: 'storage', text: 'Could not save that answer on this device.' }))
            }}
          />
          {record?.postBelief && (
            <p className="inline-status" role="status">
              {record.preBelief && record.preBelief !== record.postBelief
                ? 'You changed your answer after weighing the evidence. That change is recorded in your skills.'
                : 'Your answer is saved.'}{' '}
              <Link href="/skills">Open Skills</Link>
            </p>
          )}
        </section>
      )}
    </>
  )
}
