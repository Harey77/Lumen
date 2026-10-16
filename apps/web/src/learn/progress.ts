import { useLiveQuery } from 'dexie-react-hooks'
import { lessonById, lessons, questions, type Question } from '../content/catalog'
import { db, type LessonState, type QuizAttempt } from '../lib/db'

export interface LessonSummary {
  id: string
  title: string
  href: string
  state?: LessonState
  best?: { correct: number; total: number }
  attempts: number
}

export function useLearning() {
  const states = useLiveQuery(() => db.lessons.toArray(), [], [] as LessonState[])
  const loadedAttempts = useLiveQuery(() => db.attempts.orderBy('at').reverse().toArray(), [])
  const attempts = loadedAttempts ?? []
  const byLesson = new Map(states.map((s) => [s.lessonId, s]))
  const summaries: LessonSummary[] = lessons.map((l) => {
    const mine = attempts.filter((a) => a.lessonId === l.id && a.source === l.id)
    const best = mine.reduce<{ correct: number; total: number } | undefined>(
      (b, a) => (!b || a.correct / a.total > b.correct / b.total ? { correct: a.correct, total: a.total } : b),
      undefined,
    )
    return { id: l.id, title: l.title, href: `/learn/${l.id}`, state: byLesson.get(l.id), best, attempts: mine.length }
  })
  return { states, attempts, loaded: loadedAttempts !== undefined, summaries, missed: missedQuestions(attempts) }
}

/** Questions whose most recent answer was wrong. */
export function missedQuestions(attempts: QuizAttempt[]): Question[] {
  const latest = new Map<string, boolean>()
  for (const a of [...attempts].sort((x, y) => x.at - y.at)) for (const ans of a.answers) latest.set(ans.questionId, ans.correct)
  return questions.filter((q) => latest.get(q.id) === false)
}

/** Concepts missed in recent attempts, newest first, de-duplicated. */
export function revisionTopics(attempts: QuizAttempt[]) {
  const seen = new Set<string>()
  const out: { key: string; label: string; href: string; lesson: string }[] = []
  const missed = new Set(missedQuestions(attempts).map((q) => q.id))
  for (const a of attempts) {
    for (const ans of a.answers) {
      const key = `${ans.lessonId}:${ans.concept}`
      if (!missed.has(ans.questionId) || seen.has(key)) continue
      const l = lessonById(ans.lessonId)
      const c = l?.concepts[ans.concept]
      if (!l || !c) continue
      seen.add(key)
      out.push({ key, label: c.label, href: c.href.startsWith('#') ? `/learn/${l.id}${c.href}` : c.href, lesson: l.title })
    }
  }
  return out
}
