import { lessons, questions, subjectById, type Block } from '../content/catalog'
import { search, type SearchDoc } from '../lib/search'

/**
 * Offline / unconfigured fallback: answers come only from lessons already in the app,
 * quoted as written. The UI labels these "From saved lessons, not AI".
 */
function sectionDocs(): SearchDoc[] {
  const out: SearchDoc[] = []
  for (const l of lessons) {
    let current: { id: string; title: string; text: string[] } | null = null
    const flush = () => {
      if (current && current.text.length)
        out.push({ id: `${l.id}#${current.id}`, kind: 'Lesson step', title: `${l.title}: ${current.title}`, text: current.text.join(' '), href: `/learn/${l.id}#${current.id}` })
    }
    for (const b of l.sections as Block[]) {
      if (b.type === 'h') {
        flush()
        current = { id: b.id, title: b.text, text: [] }
      } else if (current && b.type === 'p') current.text.push(b.text)
      else if (current && b.type === 'list') current.text.push(...b.items)
      else if (current && b.type === 'callout') current.text.push(`${b.title}: ${b.text}`)
    }
    flush()
    out.push({ id: `${l.id}#takeaways`, kind: 'Lesson step', title: `${l.title}: key takeaways`, text: [l.objective, ...l.takeaways].join(' '), href: `/learn/${l.id}` })
  }
  // Question explanations are useful offline answers too (prompt + explanation, never shown as a quiz).
  for (const q of questions) out.push({ id: `q:${q.id}`, kind: 'Question', title: q.prompt, text: q.explanation, href: `/learn/${q.lessonId}#quiz` })
  return out
}

const DOCS = sectionDocs()
const STOP = new Set(['what', 'is', 'are', 'the', 'a', 'an', 'how', 'does', 'do', 'why', 'of', 'in', 'to', 'and', 'explain', 'me', 'can', 'you', 'please', 'tell', 'about', 'with', 'for', 'my', 'i'])

export function offlineAnswer(question: string) {
  const terms = question.toLowerCase().replace(/[^a-z0-9#+\s]/g, ' ').split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t))
  // Try all terms, then fall back to the strongest single term.
  let hits = search(DOCS, terms.join(' '), 3)
  if (!hits.length) for (const t of [...terms].sort((a, b) => b.length - a.length)) if ((hits = search(DOCS, t, 3)).length) break
  return hits.map((h) => {
    const lessonId = h.href.split('/learn/')[1]?.split(/[#?]/)[0] ?? ''
    const l = lessons.find((x) => x.id === lessonId)
    return { title: h.title, text: h.text, href: h.href, subject: l ? subjectById(l.subject)?.name ?? '' : '' }
  })
}
