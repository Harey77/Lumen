import { chemiosmosis } from '../content/chemiosmosis'
import { faqs } from '../content/faq'
import { mitochondrion } from '../content/mitochondrion'

export type DocKind = 'Lesson step' | 'Part' | 'Perspective' | 'Question' | 'Your note'

export interface SearchDoc {
  id: string
  kind: DocKind
  title: string
  text: string
  href: string
}

export interface SearchHit extends SearchDoc {
  snippet: string
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

export function contentDocs(): SearchDoc[] {
  const m = mitochondrion
  const steps = m.steps.map((s, i) => ({
    id: `step:${s.id}`,
    kind: 'Lesson step' as const,
    title: `${i + 1}. ${s.title}`,
    text: [...s.reader, s.analogy.machines.text, s.analogy.cooking.text].join(' '),
    href: `/learn/mitochondrion?step=${i + 1}`,
  }))
  const parts = Object.values(m.parts).map((p) => ({
    id: `part:${p.id}`,
    kind: 'Part' as const,
    title: p.name,
    text: `${p.role}. ${p.line}`,
    href: `/learn/mitochondrion?step=${m.steps.findIndex((s) => s.partId === p.id) + 1}`,
  }))
  const c = chemiosmosis
  const scenario = {
    id: `scenario:${c.id}`,
    kind: 'Perspective' as const,
    title: c.title,
    text: [c.question, ...c.role.brief, ...c.consensus.summary, ...c.timeline.map((t) => t.text)].join(' '),
    href: '/perspectives',
  }
  const questions = faqs.map((f) => ({
    id: `faq:${f.id}`,
    kind: 'Question' as const,
    title: f.q,
    text: f.a.join(' '),
    href: `/settings#faq-${f.id}`,
  }))
  return [...steps, ...parts, scenario, ...questions]
}

function snippet(text: string, term: string): string {
  const i = normalize(text).indexOf(term)
  if (i < 0) return text.slice(0, 140)
  const start = Math.max(0, i - 50)
  return (start > 0 ? '…' : '') + text.slice(start, start + 150).trim() + (start + 150 < text.length ? '…' : '')
}

/** Every term must match. Title matches rank above body matches. */
export function search(docs: SearchDoc[], query: string, limit = 20): SearchHit[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []
  const scored: { doc: SearchDoc; score: number }[] = []
  for (const doc of docs) {
    const title = normalize(doc.title)
    const text = normalize(doc.text)
    let score = 0
    let all = true
    for (const t of terms) {
      const inTitle = title.includes(t)
      const inText = text.includes(t)
      if (!inTitle && !inText) {
        all = false
        break
      }
      score += (inTitle ? 3 : 0) + (inText ? 1 : 0)
    }
    if (all) scored.push({ doc, score })
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ doc }) => ({ ...doc, snippet: snippet(doc.text, terms[0]!) }))
}
