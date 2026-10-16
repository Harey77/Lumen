import { useLiveQuery } from 'dexie-react-hooks'
import { useId, useRef, useState, type FormEvent } from 'react'
import { Link } from 'wouter'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CopyButton } from '../components/CopyButton'
import { Icon } from '../components/Icon'
import { formatDateTime } from '../components/Small'
import { mitochondrion as m } from '../content/mitochondrion'
import { db, type Note } from '../lib/db'
import { usePageTitle } from './usePageTitle'

export function Library() {
  usePageTitle('Library')
  const notes = useLiveQuery(() => db.notes.orderBy('createdAt').reverse().toArray())
  const review = useLiveQuery(() => db.review.orderBy('addedAt').toArray())
  const [deleting, setDeleting] = useState<Note | null>(null)

  return (
    <div className="page">
      <header className="page__head">
        <h1 className="display display--small">Library</h1>
        <p className="lead">Everything you have kept on this device: steps to revisit and your own notes.</p>
      </header>

      <section className="section" aria-labelledby="review-title">
        <h2 id="review-title" className="section-title">
          Review list
        </h2>
        {review === undefined ? null : review.length === 0 ? (
          <p className="empty">
            Nothing to revisit yet. When you miss a recall check, or keep a recap result, the step lands here so you can come back to it.
          </p>
        ) : (
          <ul className="list">
            {review.map((r) => {
              const i = m.steps.findIndex((s) => s.id === r.stepId)
              const step = m.steps[i]
              if (!step) return null
              return (
                <li key={r.stepId} className="list__row">
                  <div>
                    <Link href={`/learn/mitochondrion?step=${i + 1}`} className="list__title">
                      Step {i + 1}. {step.title}
                    </Link>
                    <p className="muted">
                      {r.reason === 'missed' ? 'A recall check was missed' : 'Kept from the recap quiz'} · {formatDateTime(r.addedAt)}
                    </p>
                  </div>
                  <button type="button" className="btn btn--quiet btn--small" onClick={() => db.review.delete(r.stepId)} aria-label={`Mark step ${i + 1}, ${step.title}, as reviewed`}>
                    <Icon name="check" size={16} />
                    <span>Done</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="section" aria-labelledby="notes-title">
        <h2 id="notes-title" className="section-title">
          Notes
        </h2>
        <NoteForm />
        {notes && notes.length === 0 && (
          <p className="empty">
            No notes yet. Write one above, or tap a part in the <Link href="/learn/mitochondrion">explainer</Link> and choose "Save to notes".
          </p>
        )}
        {notes && notes.length > 0 && (
          <ul className="list">
            {notes.map((n) => (
              <li key={n.id} className="note">
                <h3 className="note__title">{n.title}</h3>
                <p className="note__body">{n.body}</p>
                <div className="row">
                  <span className="muted">{formatDateTime(n.createdAt)}</span>
                  <CopyButton text={`${n.title}\n${n.body}`} label={`Copy note: ${n.title}`} />
                  <button type="button" className="btn btn--quiet btn--small" onClick={() => setDeleting(n)} aria-label={`Delete note: ${n.title}`}>
                    <Icon name="trash" size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section" aria-labelledby="modules-title">
        <h2 id="modules-title" className="section-title">
          Lessons on this device
        </h2>
        <ul className="list">
          <li className="list__row">
            <div>
              <Link href="/learn/mitochondrion" className="list__title">
                {m.title}
              </Link>
              <p className="muted">3D explainer, 8 steps, recall checks. Stored with the app, so it works offline.</p>
            </div>
          </li>
          <li className="list__row">
            <div>
              <Link href="/perspectives" className="list__title">
                How does food energy reach ATP?
              </Link>
              <p className="muted">Perspective scenario with 5 cited sources. Works offline; source links need a connection.</p>
            </div>
          </li>
        </ul>
      </section>

      <ConfirmDialog
        open={!!deleting}
        title="Delete this note?"
        confirmLabel="Delete note"
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id !== undefined) await db.notes.delete(deleting.id)
        }}
      >
        <p>
          "{deleting?.title}" will be removed from this device. There is no undo and no copy anywhere else.
        </p>
      </ConfirmDialog>
    </div>
  )
}

function NoteForm() {
  const id = useId()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({})
  const [status, setStatus] = useState<{ kind: 'idle' | 'saving' | 'saved' | 'invalid' | 'storage'; text: string }>({ kind: 'idle', text: '' })
  const titleRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (status.kind === 'saving') return
    const next: typeof errors = {}
    const t = title.trim()
    const b = body.trim()
    if (!t) next.title = 'Give the note a title.'
    else if (t.length > 120) next.title = `Keep the title under 120 characters (now ${t.length}).`
    if (!b) next.body = 'Write something in the note.'
    else if (b.length > 5000) next.body = `Keep the note under 5000 characters (now ${b.length}).`
    setErrors(next)
    if (next.title || next.body) {
      setStatus({ kind: 'invalid', text: 'The note was not saved. Fix the highlighted field.' })
      ;(next.title ? titleRef : bodyRef).current?.focus()
      return
    }
    setStatus({ kind: 'saving', text: 'Saving…' })
    try {
      await db.notes.add({ title: t, body: b, createdAt: Date.now() })
      setTitle('')
      setBody('')
      setStatus({ kind: 'saved', text: 'Note saved on this device.' })
    } catch (err) {
      const quota = err instanceof Error && /quota/i.test(err.name + err.message)
      setStatus({
        kind: 'storage',
        text: quota
          ? 'This device is out of storage space, so the note was not saved. Your text is still here.'
          : 'The browser blocked saving, so the note was not saved. Your text is still here.',
      })
    }
  }

  return (
    <form className="form" onSubmit={submit} noValidate aria-labelledby={`${id}-legend`}>
      <p id={`${id}-legend`} className="eyebrow">
        New note
      </p>
      <div className="field">
        <label htmlFor={`${id}-t`}>Title</label>
        <input
          ref={titleRef}
          id={`${id}-t`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? `${id}-te` : undefined}
          autoComplete="off"
        />
        {errors.title && (
          <p id={`${id}-te`} className="field__error">
            {errors.title}
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor={`${id}-b`}>Note</label>
        <textarea
          ref={bodyRef}
          id={`${id}-b`}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-invalid={!!errors.body}
          aria-describedby={errors.body ? `${id}-be` : undefined}
        />
        {errors.body && (
          <p id={`${id}-be`} className="field__error">
            {errors.body}
          </p>
        )}
      </div>
      <div className="row">
        <button type="submit" className="btn btn--accent" disabled={status.kind === 'saving'} aria-busy={status.kind === 'saving'}>
          Save note
        </button>
        <p className={`form__status form__status--${status.kind}`} role="status">
          {status.kind === 'saved' && <Icon name="check" size={16} />}
          {status.text}
        </p>
      </div>
    </form>
  )
}
