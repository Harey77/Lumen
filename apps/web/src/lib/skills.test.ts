import { describe, expect, it } from 'vitest'
import { deriveSkills } from './skills'
import type { LearningEvent } from './db'

const ev = (target: LearningEvent['target'], correct: boolean, chosen = target): LearningEvent => ({
  moduleId: 'mitochondrion', type: 'recall', stepId: 'x', target, chosen, correct, at: 1,
})

describe('deriveSkills', () => {
  it('starts with everything unseen', () => {
    expect(deriveSkills(undefined, [], undefined).every((n) => n.status === 'unseen')).toBe(true)
  })
  it('marks viewed steps explored and correct recalls checked', () => {
    const nodes = deriveSkills(
      { moduleId: 'mitochondrion', step: 2, mode: 'reader', viewed: ['cristae'], updatedAt: 1 },
      [ev('atp-synthase', false, 'matrix'), ev('atp-synthase', true)],
      undefined,
    )
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
    expect(byId['cristae']?.status).toBe('explored')
    expect(byId['atp-synthase']?.status).toBe('checked')
    expect(byId['atp-synthase']?.evidence[0]?.text).toMatch(/tapped Matrix instead/)
    expect(byId['matrix']?.status).toBe('unseen')
  })
  it('only marks the reasoning skill checked after the reveal and a consensus answer', () => {
    const argued = deriveSkills(undefined, [], { scenarioId: 'chemiosmosis', argument: 'x'.repeat(50), savedAt: 1 })
    expect(argued.find((n) => n.id === 'chemiosmosis-reasoning')?.status).toBe('explored')
    const done = deriveSkills(undefined, [], {
      scenarioId: 'chemiosmosis', argument: 'x', savedAt: 1, revealedAt: 2, preBelief: 'intermediate', postBelief: 'gradient',
    })
    const node = done.find((n) => n.id === 'chemiosmosis-reasoning')
    expect(node?.status).toBe('checked')
    expect(node?.evidence.map((e) => e.text)).toContain('Revised a prior belief after the reveal')
  })
})
