/* eslint-disable react-hooks/purity -- Date.now() runs only inside send/save, which are event handlers, never during render. */
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useLocation, useSearch } from 'wouter'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useOnline } from '../components/Header'
import { Icon } from '../components/Icon'
import { lessonById, subjectById, type SubjectId } from '../content/catalog'
import { HTML_STARTER, Playground } from '../learn/widgets2'
import { db, type Chat, type ChatMessage } from '../lib/db'
import { setPrefs, usePrefs } from '../lib/prefs'
import { ask, getStatus, TutorError, type Turn, type TutorStatus } from '../tutor/api'
import { Markdown } from '../tutor/Markdown'
import { offlineAnswer } from '../tutor/offline'
import { buildContext } from '../tutor/context'
import { ListenControls } from '../tutor/ListenControls'
import { stopSpeech } from '../tutor/speech'
import { extractVisual, type VisualSpec } from '../visual/spec'
import { VisualRenderer } from '../visual/VisualRenderer'
import { usePageTitle } from './usePageTitle'

const DRAFT_KEY = 'lumen.tutorDraft'
const readDraft = () => {
  try {
    return localStorage.getItem(DRAFT_KEY) ?? ''
  } catch {
    return ''
  }
}

const SUGGESTIONS = [
  'Explain the four chambers of the heart and how blood flows through them',
  'Why does my Python list change when I edit a copy of it?',
  'What is the CSS box model? Show me with an example',
  'Explain C pointers like I am a beginner',
  'How does photosynthesis work, and what limits it?',
  'What is the difference between == and equals() in Java?',
]

const SUBJECT_SUGGESTIONS: Record<SubjectId, string[]> = {
  javascript: [
    'How do closures capture variables in JavaScript? Show me an example',
    'Explain the difference between let, const, and var in loops',
    'What is the time complexity of binary search vs linear search?',
    'How does debouncing work in JavaScript and how do I write one?',
  ],
  python: [
    'Why does editing a copied list affect the original list in Python?',
    'Explain the difference between mutable and immutable types in Python',
    'How do list comprehensions work under the hood in Python?',
    'What is the difference between == and "is" in Python?',
  ],
  c: [
    'Explain C pointers and memory addresses like I am a beginner',
    'What causes a segmentation fault in C and how do I debug it?',
    'How do I safely allocate and free dynamic memory with malloc and free?',
    'Why must swap(int *a, int *b) take pointers to swap caller values?',
  ],
  csharp: [
    'What is the difference between value types (structs) and reference types (classes) in C#?',
    'Why is string immutable in C# even though it is a reference type?',
    'Explain boxing and unboxing in C# and their performance impact',
    'When should I use a record instead of a class or struct in C#?',
  ],
  java: [
    'What is the difference between == and .equals() in Java?',
    'What causes a NullPointerException in Java and how do I prevent it?',
    'How does heap vs stack memory work with Java objects and references?',
    'Why are Java Strings immutable and what is the String pool?',
  ],
  html: [
    'What is the minimal HTML document structure and why is <!DOCTYPE html> needed?',
    'Why should I use semantic tags like <nav> and <main> instead of <div>?',
    'What are void elements in HTML and how do they differ from normal elements?',
    'How do screen readers interpret the alt attribute on <img> tags?',
  ],
  css: [
    'What is the CSS box model? Show me the difference between content-box and border-box',
    'How does margin collapsing work between adjacent block elements in CSS?',
    'Explain the difference between flexbox and CSS grid with use cases',
    'How do CSS specificity and the cascade decide which rule wins?',
  ],
  anatomy: [
    'Explain the four chambers of the heart and how blood flows through them',
    'What is the difference between the pulmonary and systemic circuits?',
    'Why is the left ventricle wall significantly thicker than the right ventricle wall?',
    'What do the four heart valves do and what causes the "lub-dub" heartbeat sound?',
  ],
  biology: [
    'How does the electron transport chain generate ATP in the mitochondrion?',
    'What is the role of ATP synthase and how does proton-motive force power it?',
    'Why are mitochondrial inner membranes folded into cristae?',
    'What happens in the mitochondrial matrix during the citric acid cycle?',
  ],
  botany: [
    'How does photosynthesis work and what are its light-dependent and light-independent stages?',
    'What is a limiting factor in photosynthesis and how does it restrict the rate?',
    'Where in the plant cell does the Calvin cycle take place and what are its inputs?',
    'Where does the oxygen released during photosynthesis originate?',
  ],
}

/** Only exchanges answered by the model go back to the model; offline quotes stay local. */
export function toTurns(messages: ChatMessage[], next: string): Turn[] {
  const turns: Turn[] = []
  for (let i = 0; i < messages.length - 1; i++) {
    const u = messages[i]!
    const a = messages[i + 1]!
    if (u.role === 'user' && a.role === 'assistant' && a.source !== 'offline') {
      turns.push({ role: 'user', content: u.content }, { role: 'assistant', content: a.content })
      i++
    }
  }
  return [...turns.slice(-20), { role: 'user', content: next }]
}

export function Tutor() {
  usePageTitle('AI tutor')
  const [, navigate] = useLocation()
  const params = new URLSearchParams(useSearch())
  const lesson = lessonById(params.get('lesson') ?? '')
  const subjectParamId = params.get('subject') as SubjectId | null
  const subjectParam = subjectById(subjectParamId ?? '')
  const activeSubject = lesson ? subjectById(lesson.subject) : subjectParam
  const topicParam = params.get('topic')
  const prefs = usePrefs()
  const online = useOnline()
  const chats = useLiveQuery(() => db.chats.orderBy('updatedAt').reverse().toArray(), [], [] as Chat[])
  const [chatId, setChatId] = useState<number | null>(null)
  const chat = chats.find((c) => c.id === chatId) ?? null
  const [status, setStatus] = useState<TutorStatus | null | 'checking'>('checking')
  const [draft, setDraft] = useState(readDraft)
  const [streaming, setStreaming] = useState<string | null>(null)
  const [error, setError] = useState<{ message: string; retry: string | null } | null>(null)
  const [visual, setVisual] = useState<VisualSpec | null>(null)
  const [play, setPlay] = useState<{ lang: 'html' | 'javascript'; code: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const logRef = useRef<HTMLOListElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const c = new AbortController()
    getStatus(c.signal).then((s) => setStatus(s))
    return () => c.abort()
  }, [online])

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, draft)
    } catch {
      /* draft just won't persist */
    }
  }, [draft])

  // Keep the newest message in view.
  const msgCount = chat?.messages.length ?? 0
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgCount, streaming])

  const known = status === 'checking' ? null : status
  const live = !!known?.configured && online
  const mode: 'live' | 'test' | 'offline' | 'unconfigured' | 'checking' =
    status === 'checking' ? 'checking' : !online ? 'offline' : !status ? 'offline' : !status.configured ? 'unconfigured' : status.live ? 'live' : 'test'

  async function save(id: number | null, messages: ChatMessage[], title: string): Promise<number> {
    const record: Chat = { title, messages, updatedAt: Date.now(), lessonId: lesson?.id }
    if (id === null) return (await db.chats.add(record)) as number
    await db.chats.update(id, { messages, updatedAt: record.updatedAt })
    return id
  }

  async function send(text: string) {
    const q = text.trim()
    if (!q || streaming !== null) return
    setError(null)
    const prior = chat?.messages ?? []
    const userMsg: ChatMessage = { role: 'user', content: q, at: Date.now() }
    const id = await save(chatId, [...prior, userMsg], q.slice(0, 60))
    setChatId(id)
    setDraft('')

    if (!live) {
      // Offline or unconfigured: answer only from saved lessons, clearly marked as not AI.
      const hits = offlineAnswer(q)
      const body = hits.length
        ? hits.map((h) => `### ${h.title}\n${h.text}\n\nOpen: ${h.href}`).join('\n\n')
        : 'No saved lesson matches that question yet. Try naming a topic, such as "heart", "pointers" or "box model".'
      await save(id, [...prior, userMsg, { role: 'assistant', content: body, source: 'offline', at: Date.now() }], q.slice(0, 60))
      return
    }

    const controller = new AbortController()
    abort.current = controller
    setStreaming('')
    try {
      const result = await ask(
        {
          messages: toTurns(prior, q),
          level: prefs.level,
          context: buildContext(lesson, q, prior.filter((m) => m.role === 'user').map((m) => m.content), activeSubject?.id, topicParam),
        },
        (t) => setStreaming(t),
        controller.signal,
      )
      const answer = result.stopReason === 'refusal' ? 'The tutor could not answer this question. Try rephrasing it as a learning question about programming or biology.' : result.text
      const { visual: v } = extractVisual(answer)
      if (v) setVisual(v)
      await save(id, [...prior, userMsg, { role: 'assistant', content: answer, source: known?.live ? 'ai' : 'test', model: result.model, at: Date.now() }], q.slice(0, 60))
    } catch (e) {
      const err = e instanceof TutorError ? e : new TutorError('unknown', 'Something went wrong.', true)
      setError({ message: err.message, retry: err.retryable ? q : null })
      // Remove the unanswered question so a retry does not duplicate it.
      await db.chats.update(id, { messages: prior, updatedAt: Date.now() })
      if (err.code !== 'cancelled') setDraft(q)
    } finally {
      setStreaming(null)
      abort.current = null
      inputRef.current?.focus({ preventScroll: true })
    }
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send(draft)
    }
  }

  // Stop reading aloud when leaving the tutor.
  useEffect(() => stopSpeech, [])

  const newChat = () => {
    stopSpeech()
    abort.current?.abort()
    setChatId(null)
    setVisual(null)
    setPlay(null)
    setError(null)
    inputRef.current?.focus()
  }

  const quick = lesson
    ? [
        `Summarize the lesson "${lesson.title}" in five bullet points.`,
        `Make 6 flashcards from the lesson "${lesson.title}".`,
        `Quiz me with 3 multiple-choice questions on "${lesson.title}".`,
        `Explain "${lesson.title}" more simply, with an everyday analogy.`,
      ]
    : activeSubject
      ? SUBJECT_SUGGESTIONS[activeSubject.id] ?? SUGGESTIONS
      : SUGGESTIONS

  return (
    <div className="page tutor-page">
      <header className="page__head tutor-head">
        <div>
          <h1 className="display display--small">AI tutor</h1>
          <p className="lead">Ask anything about programming or biology. Follow up, ask for code, a diagram, flashcards or a quiz.</p>
        </div>
        <TutorStatusPill mode={mode} model={known?.model ?? null} />
      </header>

      {mode === 'unconfigured' && (
        <div className="notice" role="status">
          <strong>The AI tutor is not configured on this server.</strong> Answers below come only from Lumen's saved lessons. To enable live answers, set <code>ANTHROPIC_API_KEY</code> on the server (see <code>apps/web/.env.example</code>) and restart it.
        </div>
      )}
      {mode === 'offline' && (
        <div className="notice" role="status">
          <strong>You are offline{status === null && online ? ', or the tutor server is not running' : ''}.</strong> Live AI answers need a connection. Until then, answers come from lessons saved on this device and are marked "From saved lessons".
        </div>
      )}

      <div className="tutor">
        <aside className="tutor__side" aria-label="Conversations">
          <button type="button" className="btn btn--accent btn--small" onClick={newChat}>
            New conversation
          </button>
          {chats.length === 0 ? (
            <p className="muted">No conversations yet.</p>
          ) : (
            <ul className="tutor__chats">
              {chats.map((c) => (
                <li key={c.id}>
                  <button type="button" className="tutor__chat" aria-current={c.id === chatId ? 'true' : undefined} onClick={() => (setChatId(c.id!), setVisual(null), setPlay(null))}>
                    {c.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {chat && (
            <button type="button" className="btn btn--quiet btn--small" onClick={() => setDeleting(true)}>
              <Icon name="trash" size={16} />
              Delete this conversation
            </button>
          )}
        </aside>

        <section className="tutor__main" aria-label="Conversation">
          <div className="row tutor__controls">
            <div className="segmented" role="group" aria-label="Explanation level">
              {(['beginner', 'intermediate', 'advanced'] as const).map((l) => (
                <button key={l} type="button" aria-pressed={prefs.level === l} onClick={() => setPrefs({ level: l })}>
                  {l[0]!.toUpperCase() + l.slice(1)}
                </button>
              ))}
            </div>
            {lesson ? (
              <span className="context-chip">
                About: <strong>{lesson.title}</strong>
                <button type="button" className="icon-btn" aria-label="Stop asking about this lesson" onClick={() => navigate('/tutor')}>
                  <Icon name="close" size={16} />
                </button>
              </span>
            ) : activeSubject ? (
              <span className="context-chip">
                Subject: <strong>{activeSubject.name}</strong>
                <button type="button" className="icon-btn" aria-label="Stop asking about this subject" onClick={() => navigate('/tutor')}>
                  <Icon name="close" size={16} />
                </button>
              </span>
            ) : null}
            {topicParam && (
              <span className="context-chip">
                Topic: <strong>{topicParam}</strong>
                <button type="button" className="icon-btn" aria-label="Clear topic filter" onClick={() => navigate(activeSubject ? `/tutor?subject=${activeSubject.id}` : '/tutor')}>
                  <Icon name="close" size={16} />
                </button>
              </span>
            )}
          </div>

          <ol className="tutor__log" ref={logRef} aria-live="off">
            {!chat && streaming === null && (
              <li className="tutor__empty">
                <p className="eyebrow">Try asking</p>
                <ul className="suggestions">
                  {(quick.length ? quick : SUGGESTIONS).map((s) => (
                    <li key={s}>
                      <button type="button" className="suggestion" onClick={() => send(s)}>
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            )}
            {chat?.messages.map((m, i) => (
              <Message key={i} id={`${chat.id}-${i}`} m={m} onVisual={setVisual} onRun={(lang, code) => setPlay({ lang: lang === 'javascript' || lang === 'js' ? 'javascript' : 'html', code: lang === 'css' ? HTML_STARTER.replace('</style>', `${code}\n    </style>`) : code })} />
            ))}
            {streaming !== null && (
              <li className="msg msg--assistant is-streaming" aria-busy="true">
                <p className="msg__meta">Tutor is answering…</p>
                <Markdown text={extractVisual(streaming).text || ' '} />
                <span className="msg__cursor" aria-hidden="true" />
              </li>
            )}
          </ol>
          <p className="visually-hidden" role="status">
            {streaming !== null ? 'The tutor is answering.' : chat?.messages.at(-1)?.role === 'assistant' ? 'Answer complete.' : ''}
          </p>

          {error && (
            <div className="notice notice--error" role="alert">
              <p>{error.message}</p>
              {error.retry && (
                <button type="button" className="btn btn--small" onClick={() => send(error.retry!)}>
                  <Icon name="replay" size={16} />
                  Retry
                </button>
              )}
            </div>
          )}

          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault()
              send(draft)
            }}
          >
            <label htmlFor="tutor-input" className="visually-hidden">
              Your question
            </label>
            <textarea
              id="tutor-input"
              ref={inputRef}
              rows={2}
              value={draft}
              maxLength={6000}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              placeholder={live ? 'Ask a question. Enter to send, Shift+Enter for a new line.' : 'Ask about a topic in the saved lessons'}
            />
            {streaming !== null ? (
              <button type="button" className="btn" onClick={() => abort.current?.abort()}>
                Stop
              </button>
            ) : (
              <button type="submit" className="btn btn--accent" disabled={!draft.trim()}>
                Send
                <Icon name="next" size={18} />
              </button>
            )}
          </form>
          <p className="muted tutor__privacy">
            Your question and this conversation are sent to Lumen's server and from there to {known?.live ? "Anthropic's Claude API" : 'the configured AI provider'} only when you send it. Conversations are saved in this browser. AI answers can be wrong: check them against the lessons.
          </p>
        </section>

        <aside className="tutor__visual" aria-label="Visual">
          {play ? (
            <>
              <div className="row">
                <p className="eyebrow">Playground</p>
                <button type="button" className="btn btn--quiet btn--small" onClick={() => setPlay(null)}>
                  Close
                </button>
              </div>
              <Playground lang={play.lang} initial={play.code} />
            </>
          ) : visual ? (
            <>
              <p className="eyebrow">Visualize it</p>
              <VisualRenderer spec={visual} />
            </>
          ) : (
            <div className="tutor__visual-empty">
              <p className="eyebrow">Visualize it</p>
              <p className="muted">When a picture helps, the tutor picks a model or diagram and it appears here. You can also open code from an answer in the playground.</p>
              <p>
                <Link href="/explore" className="arrow-link">
                  Browse lessons
                </Link>
              </p>
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={deleting}
        title="Delete this conversation?"
        confirmLabel="Delete conversation"
        onClose={() => setDeleting(false)}
        onConfirm={async () => {
          if (chatId !== null) await db.chats.delete(chatId)
          newChat()
        }}
      >
        <p>It will be removed from this browser. There is no undo.</p>
      </ConfirmDialog>
    </div>
  )
}

function Message({ id, m, onVisual, onRun }: { id: string; m: ChatMessage; onVisual: (v: VisualSpec) => void; onRun: (lang: string, code: string) => void }) {
  if (m.role === 'user') {
    return (
      <li className="msg msg--user">
        <p className="msg__meta">You</p>
        <p className="msg__text">{m.content}</p>
      </li>
    )
  }
  const { text, visual, invalid } = extractVisual(m.content)
  const offline = m.source === 'offline'
  return (
    <li className={`msg msg--assistant ${offline ? 'msg--offline' : ''}`}>
      <p className="msg__meta">{offline ? 'From saved lessons, not AI' : m.source === 'test' ? 'Test provider, not AI' : `Tutor · ${m.model ?? 'AI'}`}</p>
      {offline ? <OfflineBody text={m.content} /> : <Markdown text={text} onRunCode={onRun} />}
      <ListenControls id={id} markdown={offline ? m.content.replace(/\nOpen: \S+/g, '') : text} />
      {visual && (
        <button type="button" className="btn btn--small" onClick={() => onVisual(visual)}>
          Show the visual: {visual.kind === 'builtin' ? visual.visual.replace(/-/g, ' ') : visual.title}
        </button>
      )}
      {invalid && <p className="muted">A suggested visual could not be shown because it was not in a supported format.</p>}
    </li>
  )
}

/** Offline answers are quoted lesson text plus a link; rendered without Markdown parsing. */
function OfflineBody({ text }: { text: string }) {
  const parts = text.split('\n\n### ').map((p, i) => (i === 0 ? p.replace(/^### /, '') : p))
  return (
    <div className="md">
      {parts.map((p, i) => {
        const [title, ...rest] = p.split('\n')
        const body = rest.join('\n')
        const href = /\nOpen: (\S+)$/.exec('\n' + body)?.[1] ?? /Open: (\S+)/.exec(body)?.[1]
        const clean = body.replace(/\n*Open: \S+$/, '')
        return (
          <div key={i}>
            <h3 className="md-h">{title}</h3>
            <p>{clean}</p>
            {href?.startsWith('/') && (
              <Link href={href} className="arrow-link">
                Open the lesson
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TutorStatusPill({ mode, model }: { mode: string; model: string | null }) {
  const text =
    mode === 'live'
      ? `Live AI · ${model}`
      : mode === 'test'
        ? 'Test provider, not AI'
        : mode === 'unconfigured'
          ? 'AI not configured'
          : mode === 'offline'
            ? 'Offline: saved lessons only'
            : 'Checking tutor…'
  return (
    <p className="tutor-status" data-mode={mode} role="status">
      <span className="tutor-status__dot" aria-hidden="true" />
      {text}
    </p>
  )
}
