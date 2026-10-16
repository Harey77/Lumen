import { describe, expect, it } from 'vitest'
import { lessons, questionById, questions, questionsFor } from '../content/catalog'
import { nextQueue, recommend, tally, toAnswer } from './quiz'

const q = (id: string) => questionById(id)!

describe('catalogue integrity', () => {
  it('every question has its answer among its choices, a known lesson and concept', () => {
    for (const x of questions) {
      expect(x.choices.map((c) => c.id), x.id).toContain(x.answer)
      const lesson = lessons.find((l) => l.id === x.lessonId)
      expect(lesson, x.id).toBeDefined()
      expect(lesson!.concepts[x.concept], x.id).toBeDefined()
      if (x.followUp) expect(questionById(x.followUp)?.remedial, x.id).toBe(true)
    }
  })
  it('every wrong choice explains why it is wrong', () => {
    for (const x of questions) for (const c of x.choices) if (c.id !== x.answer) expect(c.why, `${x.id}/${c.id}`).toBeTruthy()
  })
  it('every lesson has a quiz', () => {
    for (const l of lessons) expect(questionsFor(l.id).filter((x) => !x.remedial).length, l.id).toBeGreaterThanOrEqual(3)
  })
})

describe('adaptive queue', () => {
  it('a miss queues the easier follow-up next, once', () => {
    const queue = ['bs-2', 'bs-3', 'bs-4']
    const after = nextQueue(queue, q('bs-2'), false, new Set(['bs-2']))
    expect(after).toEqual(['bs-2e', 'bs-3', 'bs-4'])
    expect(nextQueue(['bs-3'], q('bs-2'), false, new Set(['bs-2', 'bs-2e']))).toEqual(['bs-3'])
  })
  it('a correct answer just moves on', () => {
    expect(nextQueue(['bs-2', 'bs-3'], q('bs-2'), true, new Set(['bs-2']))).toEqual(['bs-3'])
  })
})

describe('scoring and recommendations', () => {
  it('scores only evaluated answers', () => {
    const a = [toAnswer(q('bs-1'), 'a'), toAnswer(q('bs-2'), 'a'), toAnswer(q('bs-2e'), 'a')]
    expect(tally(a)).toEqual({ correct: 2, total: 3, mainCorrect: 1, mainTotal: 2 })
  })
  it('all correct recommends the next lesson and harder questions', () => {
    const r = recommend(['bs-1', 'bs-2', 'bs-3', 'bs-4', 'bs-5'].map((id) => toAnswer(q(id), q(id).answer)), 'binary-search')
    expect(r.outcome).toBe('mastered')
    expect(r.actions[0]).toEqual({ label: 'Next lesson: JavaScript closures', href: '/learn/js-closures' })
  })
  it('partial success targets the missed concept section', () => {
    const a = ['bs-1', 'bs-2', 'bs-4', 'bs-5'].map((id) => toAnswer(q(id), q(id).answer))
    a.push(toAnswer(q('bs-3'), 'a'))
    const r = recommend(a, 'binary-search')
    expect(r.outcome).toBe('partial')
    expect(r.actions[0]).toEqual({ label: 'Revise: Why it is O(log n)', href: '/learn/binary-search#how-fast' })
  })
  it('a wrong time-complexity answer when struggling sends the learner to the Big O lesson', () => {
    const a = [toAnswer(q('bs-1'), 'b'), toAnswer(q('bs-3'), 'a'), toAnswer(q('bs-4'), 'a')]
    const r = recommend(a, 'binary-search')
    expect(r.outcome).toBe('struggling')
    expect(r.actions[0]).toEqual({ label: 'First learn: Time complexity and Big O', href: '/learn/big-o' })
  })
})
