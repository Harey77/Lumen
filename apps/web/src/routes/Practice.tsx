import { useState } from 'react'
import { Link, useLocation, useSearch } from 'wouter'
import { InkLoader } from '../components/Small'
import { lessons, questions, subjects, type Question, type SubjectId } from '../content/catalog'
import { QuizRunner } from '../learn/QuizRunner'
import { missedQuestions, useLearning } from '../learn/progress'
import type { QuizAttempt } from '../lib/db'
import { usePageTitle } from './usePageTitle'

type SetId = 'revision' | 'interview' | 'missed' | 'easy'

const SETS: Record<SetId, { title: string; desc: string }> = {
  revision: { title: 'Quick revision', desc: 'Five questions, prioritising ones you have not answered correctly yet.' },
  interview: { title: 'Technical interview questions', desc: 'The questions that come up in coding interviews: complexity, boundaries, closures.' },
  missed: { title: 'Questions you missed', desc: 'Every question whose most recent answer was wrong.' },
  easy: { title: 'Easier questions', desc: 'Foundation questions on each concept, for a gentler start.' },
}

const subjectOf = (q: Question) => lessons.find((l) => l.id === q.lessonId)!.subject

/** Builds a practice set from the real catalogue and the learner's real history. */
export function buildSet(set: SetId, subject: SubjectId | null, attempts: QuizAttempt[]): Question[] {
  const inSubject = (q: Question) => !subject || subjectOf(q) === subject
  if (set === 'missed') return missedQuestions(attempts).filter(inSubject)
  if (set === 'interview') return questions.filter((q) => q.interview && inSubject(q))
  if (set === 'easy') return questions.filter((q) => q.difficulty === 1 && inSubject(q))
  const right = new Set(attempts.flatMap((a) => a.answers.filter((x) => x.correct).map((x) => x.questionId)))
  const pool = questions.filter((q) => !q.remedial && inSubject(q))
  return [...pool.filter((q) => !right.has(q.id)), ...pool.filter((q) => right.has(q.id))].slice(0, 5)
}

export function Practice() {
  usePageTitle('Practice')
  const [, navigate] = useLocation()
  const params = new URLSearchParams(useSearch())
  const set = params.get('set') as SetId | null
  const subjectParam = params.get('subject') as SubjectId | null
  const subject = subjects.some((s) => s.id === subjectParam) ? subjectParam : null
  const { attempts, loaded } = useLearning()

  const setHref = (s: SetId, sub = subject) => `/practice?set=${s}${sub ? `&subject=${sub}` : ''}`

  if (set && SETS[set]) {
    return (
      <div className="page page--reading">
        <header className="page__head">
          <p className="eyebrow">
            <Link href="/practice">Practice</Link>
            {subject && ` · ${subjects.find((s) => s.id === subject)!.name}`}
          </p>
          <h1 className="display display--small">{SETS[set].title}</h1>
          <p className="lead">{SETS[set].desc}</p>
        </header>
        {loaded ? <PracticeRun key={`${set}:${subject}`} set={set} subject={subject} attempts={attempts} /> : <InkLoader label="Loading your history" />}
      </div>
    )
  }

  const missedCount = missedQuestions(attempts).length
  return (
    <div className="page">
      <header className="page__head">
        <h1 className="display display--small">Practice</h1>
        <p className="lead">Short question sets drawn from the lessons. Every answer is explained, and every missed one is remembered.</p>
      </header>

      <div className="filters">
        <div className="row" role="group" aria-label="Subject">
          <button type="button" className="chip" aria-pressed={!subject} onClick={() => navigate('/practice')}>
            All subjects
          </button>
          {subjects.map((s) => (
            <button key={s.id} type="button" className="chip" aria-pressed={subject === s.id} onClick={() => navigate(`/practice?subject=${s.id}`)}>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <ul className="practice-sets">
        {(Object.keys(SETS) as SetId[]).map((id) => {
          const n = buildSet(id, subject, attempts).length
          const disabled = n === 0
          return (
            <li key={id} className="practice-set">
              <div>
                <h2 className="practice-set__title">{SETS[id].title}</h2>
                <p className="muted">{SETS[id].desc}</p>
              </div>
              <span className="practice-set__count">
                {n} {n === 1 ? 'question' : 'questions'}
              </span>
              {disabled ? (
                <span className="muted">{id === 'missed' ? (attempts.length ? 'Nothing missed right now' : 'Take a quiz first') : 'None for this subject'}</span>
              ) : (
                <Link href={setHref(id)} className="btn btn--accent btn--small">
                  Start
                </Link>
              )}
            </li>
          )
        })}
      </ul>

      <section className="section" aria-labelledby="lesson-quizzes">
        <h2 id="lesson-quizzes" className="section-title">
          Lesson quizzes
        </h2>
        <ul className="lesson-list">
          {lessons
            .filter((l) => !subject || l.subject === subject)
            .map((l) => (
              <li key={l.id}>
                <Link href={l.kind === 'explainer' ? '/learn/mitochondrion#quiz' : `/learn/${l.id}#quiz`} className="lesson-row">
                  <span className="lesson-row__title">{l.title}</span>
                  <span className="lesson-row__meta">{questions.filter((q) => q.lessonId === l.id && !q.remedial).length} questions</span>
                </Link>
              </li>
            ))}
        </ul>
      </section>
      {missedCount > 0 && <p className="muted">You have {missedCount} missed {missedCount === 1 ? 'question' : 'questions'} waiting in "Questions you missed".</p>}
    </div>
  )
}

/** Freezes the set when it starts, so recording this attempt does not reshuffle it mid-quiz. */
function PracticeRun({ set, subject, attempts }: { set: SetId; subject: SubjectId | null; attempts: QuizAttempt[] }) {
  const [qs] = useState(() => buildSet(set, subject, attempts))
  if (qs.length === 0) {
    return (
      <p className="empty">
        {set === 'missed' ? 'Nothing to retry: you have no missed questions right now. ' : 'No questions match this filter. '}
        <Link href="/practice">Back to practice</Link>
      </p>
    )
  }
  return <QuizRunner ids={qs.map((q) => q.id)} source={`practice:${set}`} lessonId={null} title={SETS[set].title} />
}
