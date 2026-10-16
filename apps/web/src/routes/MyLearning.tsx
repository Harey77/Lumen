import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'wouter'
import { formatDateTime } from '../components/Small'
import { lessonById, lessons } from '../content/catalog'
import { revisionTopics, useLearning } from '../learn/progress'
import { db } from '../lib/db'
import { useAuth } from '../auth/auth'
import { usePageTitle } from './usePageTitle'

const SOURCE_TITLE: Record<string, string> = {
  'practice:revision': 'Quick revision',
  'practice:interview': 'Interview questions',
  'practice:missed': 'Missed questions',
  'practice:easy': 'Easier questions',
}

export function MyLearning() {
  usePageTitle('My Learning')
  const { user } = useAuth()
  const { summaries, attempts } = useLearning()
  const notes = useLiveQuery(() => db.notes.count(), [], 0)
  const recent = summaries.filter((s) => s.state?.lastOpenedAt).sort((a, b) => b.state!.lastOpenedAt! - a.state!.lastOpenedAt!)
  const bookmarks = summaries.filter((s) => s.state?.bookmarked)
  const done = summaries.filter((s) => s.state?.completedAt)
  const topics = revisionTopics(attempts)

  // Milestones are facts about stored activity, nothing more.
  const milestones = [
    { done: recent.length > 0, text: 'Opened your first lesson' },
    { done: attempts.length > 0, text: 'Finished your first quiz' },
    { done: done.length > 0, text: 'Completed a lesson' },
    { done: attempts.some((a) => a.correct === a.total), text: 'Scored every question right in a quiz' },
    { done: done.length === lessons.length, text: `Completed all ${lessons.length} lessons` },
  ]

  return (
    <div className="page">
      <header className="page__head">
        <h1 className="display display--small">My Learning</h1>
        <p className="lead">
          {user ? (
            <>
              Signed in as <strong>{user.email}</strong>. Everything here is calculated from your learning record.
            </>
          ) : (
            'Everything here is calculated from what you have done in this browser.'
          )}
        </p>
      </header>

      <div className="ml-grid">
        <section className="ml-section" aria-labelledby="ml-recent">
          <h2 id="ml-recent" className="section-title">
            Continue
          </h2>
          {recent.length === 0 ? (
            <p className="empty">
              Nothing opened yet. <Link href="/learn/big-o">Start with Big O</Link>.
            </p>
          ) : (
            <ul className="list">
              {recent.map((s) => (
                <li key={s.id} className="list__row">
                  <div>
                    <Link href={s.href} className="list__title">
                      {s.title}
                    </Link>
                    <p className="muted">
                      Opened {formatDateTime(s.state!.lastOpenedAt!)}
                      {s.state?.completedAt ? ' · completed' : ''}
                      {s.best ? ` · best quiz ${s.best.correct}/${s.best.total}` : ' · quiz not taken'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ml-section" aria-labelledby="ml-revise">
          <h2 id="ml-revise" className="section-title">
            Needs revision
          </h2>
          {topics.length === 0 ? (
            <p className="empty">{attempts.length ? 'Nothing right now: your latest answers on every topic were correct.' : 'Topics you miss in quizzes will appear here.'}</p>
          ) : (
            <>
              <ul className="list">
                {topics.map((t) => (
                  <li key={t.key} className="list__row">
                    <div>
                      <Link href={t.href} className="list__title">
                        {t.label}
                      </Link>
                      <p className="muted">{t.lesson}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link href="/practice?set=missed" className="btn btn--accent btn--small">
                Retry the missed questions
              </Link>
            </>
          )}
        </section>

        <section className="ml-section" aria-labelledby="ml-bookmarks">
          <h2 id="ml-bookmarks" className="section-title">
            Bookmarks
          </h2>
          {bookmarks.length === 0 ? (
            <p className="empty">No bookmarks yet. Use Bookmark at the top of any lesson.</p>
          ) : (
            <ul className="list">
              {bookmarks.map((s) => (
                <li key={s.id} className="list__row">
                  <Link href={s.href} className="list__title">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ml-section" aria-labelledby="ml-done">
          <h2 id="ml-done" className="section-title">
            Completed
          </h2>
          <p className="ml-big">
            {done.length}
            <span> of {lessons.length} lessons</span>
          </p>
          <div className="quiz__meter" aria-hidden="true">
            <span style={{ transform: `scaleX(${done.length / lessons.length})` }} />
          </div>
          <ul className="list">
            {done.map((s) => (
              <li key={s.id} className="list__row">
                <Link href={s.href}>{s.title}</Link>
                <span className="muted">{formatDateTime(s.state!.completedAt!)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="section" aria-labelledby="ml-attempts">
        <h2 id="ml-attempts" className="section-title">
          Quiz history
        </h2>
        {attempts.length === 0 ? (
          <p className="empty">
            No quizzes finished yet. <Link href="/practice">Go to Practice</Link>.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Quiz</th>
                  <th scope="col">Score</th>
                  <th scope="col" className="col-optional">
                    Outcome
                  </th>
                  <th scope="col" className="col-optional">
                    When
                  </th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id}>
                    <th scope="row">{a.lessonId ? lessonById(a.lessonId)?.title : (SOURCE_TITLE[a.source] ?? 'Practice')}</th>
                    <td>
                      {a.correct} / {a.total}
                    </td>
                    <td className="col-optional">{a.outcome === 'mastered' ? 'All correct' : a.outcome === 'partial' ? 'Revise missed topics' : 'Back to foundations'}</td>
                    <td className="col-optional">{formatDateTime(a.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="section" aria-labelledby="ml-milestones">
        <h2 id="ml-milestones" className="section-title">
          Milestones
        </h2>
        <ul className="milestones">
          {milestones.map((m) => (
            <li key={m.text} data-done={m.done}>
              <span className="visually-hidden">{m.done ? 'Reached: ' : 'Not yet: '}</span>
              {m.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="ml-more">
        <h2 id="ml-more" className="section-title">
          Also yours
        </h2>
        <ul className="tools">
          <li>
            <Link href="/library">Notes and review list</Link>
            <span>
              {notes} {notes === 1 ? 'note' : 'notes'} saved
            </span>
          </li>
          <li>
            <Link href="/skills">Skill map</Link>
            <span>Skills from the cell energy lesson and debate.</span>
          </li>
          <li>
            <Link href="/settings">Settings and your data</Link>
            <span>Theme, motion, export or delete your learning record.</span>
          </li>
        </ul>
      </section>
    </div>
  )
}
