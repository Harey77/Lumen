import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { Icon } from '../components/Icon'
import { BackToTop, ScrollProgress } from '../components/ScrollAids'
import { lessonById, questionsFor, subjectById, type Block, type Question } from '../content/catalog'
import { LessonActions } from '../learn/LessonActions'
import { QuizRunner } from '../learn/QuizRunner'
import { BinarySearchViz, CodeBlock, CounterDemo, GrowthViz } from '../learn/widgets'
import { BoxModelViz, CMemoryViz, DomTreeViz, HTML_STARTER, PhotosynthesisViz, PlantCellViz, Playground, PythonTraceViz, ReferencesViz } from '../learn/widgets2'
import { HeartViz } from '../learn/HeartViz'
import type { WidgetName } from '../content/catalog'

const LOOP_DEMO = `const fns = []
for (var i = 0; i < 3; i++) fns.push(() => i)
console.log(fns.map(f => f()))`

const WIDGETS: Record<WidgetName, () => React.ReactNode> = {
  'binary-search': () => <BinarySearchViz />,
  growth: () => <GrowthViz />,
  counter: () => <CounterDemo />,
  'box-model': () => <BoxModelViz />,
  'html-dom': () => <DomTreeViz />,
  'html-playground': () => <Playground lang="html" initial={HTML_STARTER} />,
  'python-trace': () => <PythonTraceViz />,
  'c-memory': () => <CMemoryViz />,
  'references-csharp': () => <ReferencesViz lang="csharp" />,
  'references-java': () => <ReferencesViz lang="java" />,
  heart: () => <HeartViz />,
  photosynthesis: () => <PhotosynthesisViz />,
  'plant-cell': () => <PlantCellViz />,
  'js-playground': () => <Playground lang="javascript" initial={LOOP_DEMO} />,
}
import { usePageTitle } from './usePageTitle'

function Render({ b }: { b: Block }) {
  switch (b.type) {
    case 'h':
      return (
        <h2 id={b.id} className="article__h">
          {b.text}
        </h2>
      )
    case 'p':
      return <p>{b.text}</p>
    case 'list':
      return (
        <ul className="article__list">
          {b.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )
    case 'code':
      return <CodeBlock code={b.code} caption={b.caption} lang={b.lang} />
    case 'callout':
      return (
        <aside className="callout">
          <p className="callout__title">{b.title}</p>
          <p>{b.text}</p>
        </aside>
      )
    case 'widget':
      return <>{WIDGETS[b.name]()}</>
  }
}

function KnowledgeCheck({ q }: { q: Question }) {
  const [chosen, setChosen] = useState<string | null>(null)
  const pick = q.choices.find((c) => c.id === chosen)
  const right = chosen === q.answer
  return (
    <section className="kcheck" aria-labelledby="check-title">
      <p className="eyebrow">Knowledge check</p>
      <h2 id="check-title" className="kcheck__q">
        {q.prompt}
      </h2>
      <div className="row" role="group" aria-label="Answers">
        {q.choices.map((c) => (
          <button key={c.id} type="button" className="chip" aria-pressed={chosen === c.id} onClick={() => setChosen(c.id)}>
            {c.text}
          </button>
        ))}
      </div>
      <p className="kcheck__feedback" role="status" data-correct={chosen ? right : undefined}>
        {chosen && (right ? `Right. ${q.explanation}` : `Not quite. ${pick?.why ?? ''} Try another answer.`)}
      </p>
    </section>
  )
}

export function LessonPage({ id }: { id: string }) {
  const lesson = lessonById(id)
  usePageTitle(lesson?.title ?? 'Lesson not found')

  // Anchor links from quiz feedback (#section) should land on their section after render.
  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView()
  }, [id])

  if (!lesson || lesson.kind !== 'article') {
    return (
      <div className="page">
        <h1 className="display display--small">Lesson not found</h1>
        <p>
          <Link href="/learn">See all lessons</Link>
        </p>
      </div>
    )
  }
  const subject = subjectById(lesson.subject)!
  const qs = questionsFor(lesson.id)
  const main = qs.filter((q) => !q.remedial).sort((a, b) => a.difficulty - b.difficulty)
  const check = qs.find((q) => q.remedial)
  const next = lesson.next ? lessonById(lesson.next) : undefined
  const toc = lesson.sections.filter((b): b is Extract<Block, { type: 'h' }> => b.type === 'h')

  return (
    <>
      <ScrollProgress />
      <article className="article">
        <header className="article__head">
          <p className="eyebrow">
            <Link href={`/explore?subject=${subject.id}`}>{subject.name}</Link> · {lesson.level} · {lesson.minutes} min
          </p>
          <h1 className="display display--lesson">{lesson.title}</h1>
          <p className="lead">
            <strong>You will learn to </strong>
            {lesson.objective.charAt(0).toLowerCase() + lesson.objective.slice(1)}
          </p>
          <div className="row">
            <LessonActions lessonId={lesson.id} />
            <Link href={`/tutor?lesson=${lesson.id}`} className="btn btn--small">
              Ask the tutor about this lesson
            </Link>
          </div>
        </header>

        <div className="article__layout">
          <nav className="article__toc" aria-label="In this lesson">
            <p className="eyebrow">In this lesson</p>
            <ol>
              {toc.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`}>{h.text}</a>
                </li>
              ))}
              <li>
                <a href="#takeaways">Key takeaways</a>
              </li>
              <li>
                <a href="#quiz">Quiz</a>
              </li>
            </ol>
          </nav>

          <div className="article__body">
            {lesson.sections.map((b, i) => (
              <Render key={i} b={b} />
            ))}

            <section className="takeaways" aria-labelledby="takeaways">
              <h2 id="takeaways" className="article__h">
                Key takeaways
              </h2>
              <ol>
                {lesson.takeaways.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
            </section>

            {check && <KnowledgeCheck q={check} />}

            <section className="quiz-section" aria-labelledby="quiz">
              <h2 id="quiz" className="article__h">
                Quiz
              </h2>
              <QuizRunner ids={main.map((q) => q.id)} source={lesson.id} lessonId={lesson.id} title={`Test yourself on ${lesson.title.toLowerCase()}`} />
            </section>

            {next && (
              <Link href={`/learn/${next.id}`} className="next-lesson">
                <span className="eyebrow">Next lesson</span>
                <span className="next-lesson__title">{next.title}</span>
                <Icon name="next" size={28} />
              </Link>
            )}
          </div>
        </div>
      </article>
      <BackToTop />
    </>
  )
}
