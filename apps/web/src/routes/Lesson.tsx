import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useSearch } from 'wouter'
import { mitochondrion as m } from '../content/mitochondrion'
import { InkLoader } from '../components/Small'
import { Explainer } from '../explainer/Explainer'
import { db, type Progress } from '../lib/db'
import type { Mode } from '../lib/prefs'
import { usePageTitle } from './usePageTitle'
import { questionsFor } from '../content/catalog'
import { LessonActions } from '../learn/LessonActions'
import { QuizRunner } from '../learn/QuizRunner'

export function Lesson() {
  usePageTitle(m.title)
  // null = no saved progress; undefined = still reading IndexedDB.
  const progress = useLiveQuery(() => db.progress.get(m.id).then((p) => p ?? null), [])
  return (
    <article className="lesson">
      <header className="lesson__head">
        <p className="eyebrow">Cell biology · Beginner · 10 min</p>
        <h1 className="display display--lesson">{m.question}</h1>
        <p className="lead">
          <strong>You will learn to </strong>name the parts of a mitochondrion and explain how the electron transport chain and ATP synthase turn food energy into ATP.
        </p>
        <div className="row">
          <LessonActions lessonId="mitochondrion" />
          <Link href="/tutor?lesson=mitochondrion" className="btn btn--small">
            Ask the tutor about this lesson
          </Link>
        </div>
      </header>
      {progress === undefined ? <InkLoader label="Opening your saved progress" /> : <LessonBody saved={progress} />}
      <section className="quiz-section quiz-section--wide" aria-labelledby="quiz">
        <h2 id="quiz" className="article__h">
          Quiz
        </h2>
        <QuizRunner
          ids={questionsFor('mitochondrion').filter((q) => !q.remedial).map((q) => q.id)}
          source="mitochondrion"
          lessonId="mitochondrion"
          title="Test yourself on the mitochondrion"
        />
      </section>
    </article>
  )
}

/** Mounted once the saved record is known; it reads it once, then the explainer owns and saves the position. */
function LessonBody({ saved }: { saved: Progress | null }) {
  const urlStep = Number(new URLSearchParams(useSearch()).get('step'))
  const [step] = useState(() => (Number.isInteger(urlStep) && urlStep >= 1 && urlStep <= m.steps.length ? urlStep - 1 : (saved?.step ?? 0)))
  const [viewed] = useState(() => saved?.viewed ?? [])
  const [mode, setMode] = useState<Mode | null>(saved?.mode ?? null)

  if (!mode) return <ModeChooser onChoose={setMode} />
  return <Explainer module={m} initialStep={step} initialMode={mode} initialViewed={viewed} />
}

function ModeChooser({ onChoose }: { onChoose: (m: Mode) => void }) {
  return (
    <section className="chooser" aria-labelledby="chooser-title">
      <h2 id="chooser-title" className="chooser__title">
        How would you like to explore it?
      </h2>
      <p className="muted">You can switch at any time without losing your place.</p>
      <div className="chooser__options">
        <button type="button" className="chooser__option" onClick={() => onChoose('guided')}>
          <svg viewBox="0 0 64 40" aria-hidden="true" focusable="false" className="chooser__glyph">
            <path d="M6 14v12h8l10 8V6L14 14z" />
            <path d="M32 12c4 4 4 12 0 16M38 7c7 7 7 19 0 26" />
          </svg>
          <span className="chooser__name">Listen and watch</span>
          <span className="chooser__desc">A narrator explains while the model moves part by part. Captions on.</span>
        </button>
        <button type="button" className="chooser__option" onClick={() => onChoose('reader')}>
          <svg viewBox="0 0 64 40" aria-hidden="true" focusable="false" className="chooser__glyph">
            <path d="M6 8h22v26H6zM36 8h22v26H36z" />
            <path d="M11 15h12M11 21h12M11 27h8M41 15h12M41 21h12M41 27h8" />
          </svg>
          <span className="chooser__name">Read and watch</span>
          <span className="chooser__desc">Short step cards beside the same model. Go at your own pace.</span>
        </button>
      </div>
    </section>
  )
}
