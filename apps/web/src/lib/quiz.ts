import { lessonById, questionById, type Question } from '../content/catalog'

/**
 * Deterministic quiz logic. No AI: every adaptation is a rule you can read here.
 * - A missed question with a followUp queues an easier question on the same concept next.
 * - The outcome is decided by the main (non-remedial) questions; recommendations target missed concepts.
 */

export interface Answer {
  questionId: string
  lessonId: string
  concept: string
  chosen: string
  correct: boolean
  remedial: boolean
}

export function isCorrect(q: Question, chosen: string) {
  return q.answer === chosen
}

/** Queue after answering: a miss puts the follow-up (if unasked) at the front. */
export function nextQueue(queue: string[], q: Question, correct: boolean, asked: ReadonlySet<string>): string[] {
  const rest = queue.filter((id) => id !== q.id)
  if (!correct && q.followUp && !asked.has(q.followUp) && !rest.includes(q.followUp)) return [q.followUp, ...rest]
  return rest
}

export function tally(answers: Answer[]) {
  const main = answers.filter((a) => !a.remedial)
  return {
    correct: answers.filter((a) => a.correct).length,
    total: answers.length,
    mainCorrect: main.filter((a) => a.correct).length,
    mainTotal: main.length,
  }
}

export interface Action {
  label: string
  href: string
}
export interface Recommendation {
  outcome: 'mastered' | 'partial' | 'struggling'
  title: string
  text: string
  actions: Action[]
}

function conceptHref(lessonId: string, href: string) {
  return href.startsWith('#') ? `/learn/${lessonId}${href}` : href
}

export function missedConcepts(answers: Answer[]) {
  const seen = new Set<string>()
  const out: { lessonId: string; concept: string; label: string; href: string; prereq?: string }[] = []
  for (const a of answers) {
    const key = `${a.lessonId}:${a.concept}`
    if (a.correct || seen.has(key)) continue
    seen.add(key)
    const c = lessonById(a.lessonId)?.concepts[a.concept]
    if (c) out.push({ lessonId: a.lessonId, concept: a.concept, label: c.label, href: conceptHref(a.lessonId, c.href), prereq: c.prereq })
  }
  return out
}

/** lessonId is set for a lesson quiz; null for a mixed practice set. */
export function recommend(answers: Answer[], lessonId: string | null): Recommendation {
  const t = tally(answers)
  const missed = missedConcepts(answers)
  const lesson = lessonId ? lessonById(lessonId) : undefined
  const ratio = t.mainTotal ? t.mainCorrect / t.mainTotal : 0

  if (missed.length === 0 && ratio === 1) {
    const next = lesson?.next ? lessonById(lesson.next) : undefined
    const actions: Action[] = []
    if (next) actions.push({ label: `Next lesson: ${next.title}`, href: `/learn/${next.id}` })
    if (lesson) actions.push({ label: 'Harder: interview questions', href: `/practice?set=interview&subject=${lesson.subject}` })
    else actions.push({ label: 'Practise another topic', href: '/practice' })
    return { outcome: 'mastered', title: 'Every answer right. Move on.', text: 'You answered every question correctly, so the next step is new material or harder questions.', actions }
  }

  if (ratio >= 0.5) {
    return {
      outcome: 'partial',
      title: 'Nearly there. Revise what you missed.',
      text: `You missed questions on ${missed.map((m) => m.label.toLowerCase()).join(' and ')}. Re-read those sections, then retry just the questions you got wrong.`,
      actions: [
        ...missed.map((m) => ({ label: `Revise: ${m.label}`, href: m.href })),
        { label: 'Retry the questions you missed', href: '/practice?set=missed' },
      ],
    }
  }

  const prereqs = [...new Set(missed.map((m) => m.prereq).filter((p): p is string => !!p))]
  return {
    outcome: 'struggling',
    title: 'Start from the foundations.',
    text: 'More than half of the main questions were missed. Begin with the ideas underneath, then take the quiz again.',
    actions: [
      ...prereqs.map((p) => ({ label: `First learn: ${lessonById(p)?.title ?? p}`, href: `/learn/${p}` })),
      ...missed.map((m) => ({ label: `Re-read: ${m.label}`, href: m.href })),
      { label: 'Practise with easier questions', href: `/practice?set=easy${lesson ? `&subject=${lesson.subject}` : ''}` },
    ],
  }
}

export function toAnswer(q: Question, chosen: string): Answer {
  return { questionId: q.id, lessonId: q.lessonId, concept: q.concept, chosen, correct: isCorrect(q, chosen), remedial: !!q.remedial }
}

export const resolve = (ids: string[]) => ids.map((id) => questionById(id)).filter((q): q is Question => !!q)
