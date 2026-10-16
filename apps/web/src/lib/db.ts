import Dexie, { type Table } from 'dexie'
import type { Mode } from './prefs'
import type { PartId } from '../content/types'

export interface Progress {
  moduleId: string
  step: number
  mode: Mode
  viewed: string[]
  updatedAt: number
}

export interface LearningEvent {
  id?: number
  moduleId: string
  type: 'recall' | 'quiz'
  stepId: string
  target: PartId
  chosen: PartId
  correct: boolean
  at: number
}

export interface Note {
  id?: number
  title: string
  body: string
  createdAt: number
}

export interface ReviewItem {
  stepId: string
  reason: 'missed' | 'kept'
  addedAt: number
}

export interface PerspectiveRecord {
  scenarioId: string
  preBelief?: string
  argument?: string
  prediction?: string
  convincer?: string
  savedAt?: number
  revealedAt?: number
  postBelief?: string
}

export interface LessonState {
  lessonId: string
  bookmarked?: boolean
  completedAt?: number
  lastOpenedAt?: number
}

export interface QuizAttempt {
  id?: number
  /** Lesson id for a lesson quiz, or "practice:<set>" for a practice set. */
  source: string
  lessonId: string | null
  answers: import('./quiz').Answer[]
  correct: number
  total: number
  outcome: 'mastered' | 'partial' | 'struggling'
  at: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  /** ai: live model; test: test provider; offline: quoted from saved lessons (never sent to the model). */
  source?: 'ai' | 'test' | 'offline'
  model?: string
  at: number
}

export interface Chat {
  id?: number
  title: string
  lessonId?: string
  messages: ChatMessage[]
  updatedAt: number
}

class LumenDB extends Dexie {
  progress!: Table<Progress, string>
  events!: Table<LearningEvent, number>
  notes!: Table<Note, number>
  review!: Table<ReviewItem, string>
  perspectives!: Table<PerspectiveRecord, string>
  lessons!: Table<LessonState, string>
  attempts!: Table<QuizAttempt, number>
  chats!: Table<Chat, number>

  constructor() {
    super('lumen')
    this.version(1).stores({
      progress: 'moduleId',
      events: '++id, moduleId, target, at',
      notes: '++id, createdAt',
      review: 'stepId, addedAt',
      perspectives: 'scenarioId',
    })
    this.version(2).stores({ lessons: 'lessonId, lastOpenedAt', attempts: '++id, source, lessonId, at' })
    this.version(3).stores({ chats: '++id, updatedAt' })
  }
}

export const db = new LumenDB()

export async function resetLearning() {
  await db.transaction('rw', [db.progress, db.events, db.review, db.perspectives, db.lessons, db.attempts], async () => {
    await Promise.all([db.progress.clear(), db.events.clear(), db.review.clear(), db.perspectives.clear(), db.lessons.clear(), db.attempts.clear()])
  })
}

export async function clearEverything() {
  await db.transaction('rw', db.tables, () => Promise.all(db.tables.map((t) => t.clear())))
}

export async function exportRecord() {
  const [progress, events, notes, review, perspectives, lessons, attempts, chats] = await Promise.all([
    db.progress.toArray(),
    db.events.toArray(),
    db.notes.toArray(),
    db.review.toArray(),
    db.perspectives.toArray(),
    db.lessons.toArray(),
    db.attempts.toArray(),
    db.chats.toArray(),
  ])
  return { exportedAt: new Date().toISOString(), format: 'lumen-record/3', progress, events, notes, review, perspectives, lessons, attempts, chats }
}

export async function patchLesson(lessonId: string, patch: Partial<LessonState>) {
  await db.transaction('rw', db.lessons, async () => {
    const cur = (await db.lessons.get(lessonId)) ?? { lessonId }
    await db.lessons.put({ ...cur, ...patch })
  })
}
