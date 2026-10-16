import type { LearningEvent, PerspectiveRecord, Progress } from './db'
import type { PartId } from '../content/types'
import { mitochondrion } from '../content/mitochondrion'
import { chemiosmosis } from '../content/chemiosmosis'

/** explored = seen in a lesson; checked = answered correctly in an in-app check. Not a credential (D-006). */
export type SkillStatus = 'unseen' | 'explored' | 'checked'

export interface Evidence {
  text: string
  at: number
}

export interface SkillNode {
  id: string
  name: string
  cluster: 'Structure' | 'Energy conversion' | 'Scientific reasoning'
  status: SkillStatus
  evidence: Evidence[]
  href: string
}

const CLUSTER: Record<PartId, SkillNode['cluster']> = {
  'outer-membrane': 'Structure',
  'intermembrane-space': 'Structure',
  cristae: 'Structure',
  matrix: 'Structure',
  etc: 'Energy conversion',
  'atp-synthase': 'Energy conversion',
}

export function deriveSkills(
  progress: Progress | undefined,
  events: LearningEvent[],
  perspective: PerspectiveRecord | undefined,
): SkillNode[] {
  const m = mitochondrion
  const viewed = new Set(progress?.viewed ?? [])
  const nodes: SkillNode[] = Object.values(m.parts).map((p) => {
    const stepIndex = m.steps.findIndex((s) => s.partId === p.id)
    const mine = events.filter((e) => e.target === p.id)
    const evidence: Evidence[] = mine.map((e) => ({
      text: `${e.type === 'quiz' ? 'Recap quiz' : 'Recall check'}: ${e.correct ? 'placed correctly' : `tapped ${m.parts[e.chosen].name} instead`}`,
      at: e.at,
    }))
    const seen = viewed.has(m.steps[stepIndex]!.id)
    if (seen && progress) evidence.unshift({ text: `Explored step ${stepIndex + 1}, ${m.steps[stepIndex]!.title}`, at: progress.updatedAt })
    const status: SkillStatus = mine.some((e) => e.correct) ? 'checked' : seen || mine.length ? 'explored' : 'unseen'
    return { id: p.id, name: p.name, cluster: CLUSTER[p.id], status, evidence, href: `/learn/mitochondrion?step=${stepIndex + 1}` }
  })

  const quiz = events.filter((e) => e.type === 'quiz')
  const quizRight = new Set(quiz.filter((e) => e.correct).map((e) => e.target))
  nodes.push({
    id: 'whole-flow',
    name: 'Food to ATP, the whole flow',
    cluster: 'Energy conversion',
    status: quizRight.size === m.recapQuiz.length ? 'checked' : viewed.has('recap') || quiz.length ? 'explored' : 'unseen',
    evidence: quiz.length ? [{ text: `Recap quiz: ${quizRight.size} of ${m.recapQuiz.length} parts placed`, at: Math.max(...quiz.map((e) => e.at)) }] : [],
    href: `/learn/mitochondrion?step=${m.steps.length}`,
  })

  const p = perspective
  const ev: Evidence[] = []
  if (p?.argument && p.savedAt) ev.push({ text: 'Argued the chemical-intermediate side in writing', at: p.savedAt })
  if (p?.revealedAt) ev.push({ text: 'Compared that argument with the evidence that settled it', at: p.revealedAt })
  if (p?.postBelief && p.revealedAt) {
    const changed = p.preBelief !== p.postBelief
    ev.push({ text: changed ? 'Revised a prior belief after the reveal' : 'Kept the same belief after the reveal', at: p.revealedAt })
  }
  nodes.push({
    id: 'chemiosmosis-reasoning',
    name: 'Arguing from the losing side',
    cluster: 'Scientific reasoning',
    status: p?.postBelief === chemiosmosis.belief.consensus && p.revealedAt ? 'checked' : p?.argument ? 'explored' : 'unseen',
    evidence: ev,
    href: '/perspectives',
  })
  return nodes
}
