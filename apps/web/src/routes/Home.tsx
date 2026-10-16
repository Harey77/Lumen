import { useEffect, useRef, type PointerEvent as RPointerEvent } from 'react'
import { Link } from 'wouter'
import { Icon } from '../components/Icon'
import { domains, lessonById, lessons, questions, subjects } from '../content/catalog'
import { useLearning } from '../learn/progress'
import { useReducedMotion } from '../lib/prefs'
import { usePageTitle } from './usePageTitle'

const PATHS = [
  { title: 'Web foundations', steps: ['html-structure', 'css-box-model'], finish: { label: 'Interview questions', href: '/practice?set=interview' } },
  { title: 'How code uses memory', steps: ['python-variables', 'c-pointers', 'java-objects'], finish: { label: 'Interview questions', href: '/practice?set=interview' } },
  { title: 'The living body', steps: ['heart', 'mitochondrion'], finish: { label: 'Argue a real scientific debate', href: '/perspectives' } },
  { title: 'Life in plants', steps: ['photosynthesis'], finish: { label: 'Quick revision', href: '/practice?set=revision' } },
]

const ORBIT_CODE = ['<main>', 'margin', '*ptr', 'list.copy()', 'equals()', 'closure']
const ORBIT_BIO = ['atrium', 'chloroplast', 'ATP', 'xylem', 'valve', 'stroma']

/** Pointer-reactive orbit: two rings lean toward the pointer. Static under reduced motion. */
function Orbit() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    let raf = 0
    let tx = 0
    let ty = 0
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2))
      ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2))
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0
          el.style.setProperty('--px', tx.toFixed(3))
          el.style.setProperty('--py', ty.toFixed(3))
        })
    }
    addEventListener('pointermove', onMove, { passive: true })
    return () => {
      removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [reduced])
  return (
    <div className="orbit" ref={ref} aria-hidden="true">
      <div className="orbit__ring orbit__ring--outer">
        {ORBIT_BIO.map((t, i) => (
          <span key={t} className="orbit__node orbit__node--bio" style={{ ['--a' as string]: `${(i / ORBIT_BIO.length) * 360}deg` }}>
            <span>{t}</span>
          </span>
        ))}
      </div>
      <div className="orbit__ring orbit__ring--inner">
        {ORBIT_CODE.map((t, i) => (
          <span key={t} className="orbit__node orbit__node--code" style={{ ['--a' as string]: `${(i / ORBIT_CODE.length) * 360 + 30}deg` }}>
            <span>{t}</span>
          </span>
        ))}
      </div>
      <div className="orbit__core">?</div>
    </div>
  )
}

/** An illustration (not a live call) of how one question becomes an explanation and then a model. */
function AnswerDemo() {
  return (
    <figure className="answer-demo" aria-label="Illustration: a question becomes an explanation, then a visual model.">
      <p className="answer-demo__tag">Illustration · how the tutor answers</p>
      <div className="answer-demo__frames">
        <div className="answer-demo__frame" data-n="1">
          <p className="eyebrow">You ask</p>
          <p className="answer-demo__q">Why is the left ventricle wall thicker?</p>
        </div>
        <div className="answer-demo__frame" data-n="2">
          <p className="eyebrow">It explains</p>
          <p>It pumps blood around the whole body, so it pushes against far more resistance than the right ventricle, which only reaches the lungs.</p>
        </div>
        <div className="answer-demo__frame" data-n="3">
          <p className="eyebrow">It shows you</p>
          <svg viewBox="0 0 160 110" className="mini-heart" aria-hidden="true">
            <ellipse cx="50" cy="35" rx="26" ry="20" className="mh-deoxy" />
            <ellipse cx="110" cy="33" rx="25" ry="19" className="mh-oxy" />
            <path d="M28 52 C28 90 62 104 78 106 L78 52 Z" className="mh-deoxy" />
            <path d="M82 50 L82 106 C108 102 134 82 132 50 Z" className="mh-oxy mh-hl" />
            <text x="107" y="84" textAnchor="middle">LV</text>
          </svg>
        </div>
      </div>
    </figure>
  )
}

function tilt(e: RPointerEvent<HTMLElement>) {
  if (e.pointerType !== 'mouse') return
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width - 0.5
  const y = (e.clientY - r.top) / r.height - 0.5
  el.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`)
  el.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`)
  el.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`)
}
function untilt(e: RPointerEvent<HTMLElement>) {
  e.currentTarget.style.setProperty('--rx', '0deg')
  e.currentTarget.style.setProperty('--ry', '0deg')
}

const shortName = (n: string) => n.replace('Human anatomy and physiology', 'Anatomy').replace('Basic and cellular biology', 'Cell biology').replace('Botany and plant biology', 'Botany')

export function Home() {
  usePageTitle('')
  const { summaries, missed, attempts } = useLearning()
  const recent = summaries.filter((s) => s.state?.lastOpenedAt).sort((a, b) => b.state!.lastOpenedAt! - a.state!.lastOpenedAt!)
  const cont = recent.find((s) => !s.state?.completedAt) ?? recent[0]
  const interview = questions.filter((q) => q.interview).length

  return (
    <div className="home">
      <section className="hero3" aria-labelledby="hero-title">
        <div className="hero3__copy">
          <p className="eyebrow hero3__kicker">Programming · Biology · AI tutor</p>
          <h1 id="hero-title" className="hero3__title">
            <span className="hero3__line">Ask it.</span>
            <span className="hero3__line">See it.</span>
            <span className="hero3__line hero3__line--accent">Prove it.</span>
          </h1>
          <p className="lead hero3__lead">
            A learning lab for programming and biology. Ask the AI tutor, turn a 3D heart or trace code line by line, then prove you understand with quizzes that adapt to your answers.
          </p>
          <div className="row hero3__ctas">
            <Link href={cont ? cont.href : '/tutor'} className="btn btn--accent btn--lg">
              {cont ? `Continue: ${cont.title}` : 'Ask the tutor'}
              <Icon name="next" size={20} />
            </Link>
            <Link href="/explore" className="btn btn--lg">
              Explore the two domains
            </Link>
          </div>
        </div>
        <div className="hero3__visual">
          <Orbit />
          <AnswerDemo />
        </div>
      </section>

      <section className="domains" aria-labelledby="domains-title">
        <h2 id="domains-title" className="visually-hidden">
          Learning domains
        </h2>
        {domains.map((d) => {
          const subs = subjects.filter((s) => s.domain === d.id)
          return (
            <Link key={d.id} href={`/explore?domain=${d.id}`} className="domain-card" data-domain={d.id} onPointerMove={tilt} onPointerLeave={untilt}>
              <span className="domain-card__shine" aria-hidden="true" />
              <span className="eyebrow">{d.id === 'programming' ? 'Domain A' : 'Domain B'}</span>
              <span className="domain-card__name">{d.name}</span>
              <span className="domain-card__blurb">{d.blurb}</span>
              <span className="domain-card__preview" aria-hidden="true">
                {d.id === 'programming' ? (
                  <code className="type-demo">
                    <span>a = [1, 2]</span>
                    <span>b = a</span>
                    <span>b.append(3)</span>
                    <span className="type-demo__out">a is now [1, 2, 3]</span>
                  </code>
                ) : (
                  <svg viewBox="0 0 160 110" className="mini-heart mini-heart--beat">
                    <ellipse cx="50" cy="35" rx="26" ry="20" className="mh-deoxy" />
                    <ellipse cx="110" cy="33" rx="25" ry="19" className="mh-oxy" />
                    <path d="M28 52 C28 90 62 104 78 106 L78 52 Z" className="mh-deoxy" />
                    <path d="M82 50 L82 106 C108 102 134 82 132 50 Z" className="mh-oxy" />
                  </svg>
                )}
              </span>
              <span className="domain-card__subjects">
                {subs.map((s) => (
                  <span key={s.id} className="tag">
                    {shortName(s.name)}
                  </span>
                ))}
              </span>
              <span className="domain-card__go">
                {lessons.filter((l) => subs.some((s) => s.id === l.subject)).length} lessons <Icon name="next" size={18} />
              </span>
            </Link>
          )
        })}
      </section>

      <section className="band" aria-labelledby="continue-title">
        <div className="band__head">
          <h2 id="continue-title" className="section-title">
            {recent.length ? 'Continue learning' : 'Where to begin'}
          </h2>
          <Link href="/my-learning" className="arrow-link">
            My Learning
          </Link>
        </div>
        <ul className="rail">
          {(recent.length ? recent.slice(0, 3).map((s) => s.id) : ['heart', 'python-variables', 'css-box-model']).map((id) => {
            const l = lessonById(id)!
            const s = summaries.find((x) => x.id === id)
            return (
              <li key={id}>
                <Link href={`/learn/${id}`} className="rail__item">
                  <span className="rail__title">{l.title}</span>
                  <span className="rail__meta">
                    {s?.state?.completedAt ? 'Completed' : s?.state?.lastOpenedAt ? 'In progress' : `${l.level} · ${l.minutes} min`}
                    {s?.best && ` · best quiz ${s.best.correct}/${s.best.total}`}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="band" aria-labelledby="paths-title">
        <h2 id="paths-title" className="section-title">
          Learning paths
        </h2>
        <ol className="paths">
          {PATHS.map((p, i) => (
            <li key={p.title} className="path reveal">
              <span className="path__num">0{i + 1}</span>
              <div>
                <h3 className="path__title">{p.title}</h3>
                <ol className="path__steps">
                  {p.steps.map((id) => (
                    <li key={id} data-done={!!summaries.find((x) => x.id === id)?.state?.completedAt}>
                      <Link href={`/learn/${id}`}>{lessonById(id)!.title}</Link>
                    </li>
                  ))}
                  <li>
                    <Link href={p.finish.href}>{p.finish.label}</Link>
                  </li>
                </ol>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="band band--night" aria-labelledby="practice-title">
        <div className="practice-band">
          <div>
            <p className="eyebrow">Practice</p>
            <h2 id="practice-title" className="practice-band__title">
              {questions.filter((q) => !q.remedial).length} questions. Each one explains itself.
            </h2>
            <p>A wrong answer tells you why, links to the section to re-read, and queues a simpler question on the same idea.</p>
          </div>
          <ul className="practice-band__list">
            <li>
              <Link href="/practice?set=revision" className="arrow-link">
                Quick revision, 5 questions
              </Link>
            </li>
            <li>
              <Link href="/practice?set=interview" className="arrow-link">
                Interview questions ({interview})
              </Link>
            </li>
            <li>
              {missed.length ? (
                <Link href="/practice?set=missed" className="arrow-link">
                  Retry {missed.length} {missed.length === 1 ? 'question' : 'questions'} you missed
                </Link>
              ) : (
                <span className="muted-night">Missed questions appear here {attempts.length ? '(none right now)' : 'after your first quiz'}</span>
              )}
            </li>
          </ul>
        </div>
      </section>

      <section className="band" aria-labelledby="resources-title">
        <h2 id="resources-title" className="section-title">
          Study tools
        </h2>
        <ul className="tools">
          <li>
            <Link href="/tutor">AI tutor</Link>
            <span>Step-by-step explanations, code, diagrams, flashcards and quizzes on demand.</span>
          </li>
          <li>
            <Link href="/library">Revision notes</Link>
            <span>Write your own notes, or save definitions straight from a lesson.</span>
          </li>
          <li>
            <Link href="/map">Concept map</Link>
            <span>How the ideas of cell energy connect, coloured by what you have learned.</span>
          </li>
          <li>
            <Link href="/perspectives">Debate a real controversy</Link>
            <span>Argue the losing side, then see the cited evidence that settled it.</span>
          </li>
        </ul>
      </section>
    </div>
  )
}
