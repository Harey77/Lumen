import { useMemo, useState } from 'react'
import { Link, useLocation, useSearch } from 'wouter'
import { Icon } from '../components/Icon'
import { domains, lessons, subjects, type Domain } from '../content/catalog'
import { useLearning } from '../learn/progress'
import { usePageTitle } from './usePageTitle'

const norm = (s: string) => s.toLowerCase()

/** Explore: the two learning domains, their subjects and lessons, filtered locally. */
export function Explore() {
  usePageTitle('Explore')
  const [, navigate] = useLocation()
  const params = new URLSearchParams(useSearch())
  const subject = params.get('subject')
  const [q, setQ] = useState('')
  const [dom, setDom] = useState<'all' | Domain>(() => (params.get('domain') as Domain | null) ?? 'all')
  const { summaries } = useLearning()

  const groups = useMemo(
    () =>
      domains
        .filter((d) => dom === 'all' || d.id === dom)
        .map((d) => ({
          d,
          subs: subjects
            .filter((s) => s.domain === d.id && (!subject || s.id === subject))
            .map((s) => ({
              s,
              items: lessons.filter((l) => l.subject === s.id && (!q.trim() || norm(`${l.title} ${l.objective} ${s.name}`).includes(norm(q.trim())))),
            }))
            .filter((g) => g.items.length > 0),
        }))
        .filter((g) => g.subs.length > 0),
    [dom, subject, q],
  )

  return (
    <div className="page">
      <header className="page__head">
        <h1 className="display display--small">Explore</h1>
        <p className="lead">Two domains, ten subjects. Every lesson has an interactive model or code you can run, and a quiz.</p>
      </header>

      <div className="filters">
        <label className="filter-search">
          <Icon name="search" size={18} />
          <span className="visually-hidden">Filter lessons</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setQ('')} placeholder="Filter lessons" />
        </label>
        <div className="row" role="group" aria-label="Domain">
          {([['all', 'All'], ['programming', 'Programming'], ['biology', 'Biology']] as const).map(([id, label]) => (
            <button key={id} type="button" className="chip" aria-pressed={dom === id} onClick={() => setDom(id)}>
              {label}
            </button>
          ))}
        </div>
        {subject && (
          <button type="button" className="btn btn--quiet btn--small" onClick={() => navigate('/explore')}>
            Showing one subject. Show all
          </button>
        )}
      </div>

      {groups.length === 0 && <p className="empty">No lessons match "{q}". Try "heart", "pointer" or "box".</p>}

      {groups.map(({ d, subs }) => (
        <section key={d.id} className="domain-block" data-domain={d.id} aria-labelledby={`dom-${d.id}`}>
          <header className="domain-block__head">
            <p className="eyebrow">{d.id === 'programming' ? 'Domain A' : 'Domain B'}</p>
            <h2 id={`dom-${d.id}`} className="catalog-group__title">
              {d.name}
            </h2>
            <p className="muted">{d.blurb}</p>
          </header>
          {subs.map(({ s, items }) => (
            <section key={s.id} className="catalog-group" aria-labelledby={`sub-${s.id}`}>
              <div className="catalog-group__head">
                <h3 id={`sub-${s.id}`} className="subject-name">
                  {s.name}
                </h3>
                <p className="muted">{s.blurb}</p>
                <p>
                  <Link href={`/tutor?subject=${s.id}`} className="arrow-link">
                    Ask the tutor about {s.name}
                  </Link>
                </p>
              </div>
              <ol className="lesson-list">
                {items.map((l, i) => {
                  const sum = summaries.find((x) => x.id === l.id)
                  return (
                    <li key={l.id}>
                      <Link href={`/learn/${l.id}`} className="lesson-row">
                        <span className="lesson-row__title">
                          Module {i + 1}: {l.title}
                        </span>
                        <span className="lesson-row__obj">{l.objective}</span>
                        <span className="lesson-row__meta">
                          {l.level} · {l.minutes} min{l.kind === 'explainer' || l.id === 'heart' ? ' · 3D model' : ''}
                          {sum?.state?.completedAt ? ' · completed' : ''}
                          {sum?.best ? ` · best ${sum.best.correct}/${sum.best.total}` : ''}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </section>
          ))}
        </section>
      ))}
    </div>
  )
}

/** Learn: every lesson in order, with real status. */
export function LearnIndex() {
  usePageTitle('Learn')
  const { summaries } = useLearning()
  return (
    <div className="page">
      <header className="page__head">
        <h1 className="display display--small">Learn</h1>
        <p className="lead">Each lesson has a goal, worked examples, something to try, key takeaways and a quiz.</p>
      </header>
      <ol className="lesson-list lesson-list--numbered">
        {lessons.map((l, i) => {
          const s = summaries[i]!
          return (
            <li key={l.id}>
              <Link href={`/learn/${l.id}`} className="lesson-row">
                <span className="lesson-row__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="lesson-row__title">{l.title}</span>
                <span className="lesson-row__obj">{l.objective}</span>
                <span className="lesson-row__meta">
                  {subjects.find((x) => x.id === l.subject)!.name} · {l.minutes} min
                  {s.state?.completedAt ? ' · completed' : s.state?.lastOpenedAt ? ' · started' : ''}
                  {s.best ? ` · best quiz ${s.best.correct}/${s.best.total}` : ''}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
