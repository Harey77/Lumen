/**
 * Visualization specs come from the AI, so they are untrusted. This module is the only gate:
 * it extracts at most one ```lumen-visual block, parses it as JSON, and returns either a whitelisted
 * built-in visual id or a strictly shaped diagram of plain strings. Anything else is dropped.
 * Rendering is done by trusted React components only; no spec field is ever treated as markup or code.
 */

export const VISUAL_IDS = [
  'heart-3d',
  'mitochondrion',
  'photosynthesis',
  'plant-cell',
  'css-box-model',
  'html-dom',
  'python-trace',
  'c-memory',
  'references',
  'binary-search',
  'growth',
  'closures',
] as const
export type VisualId = (typeof VISUAL_IDS)[number]

export const HEART_PARTS = ['right-atrium', 'right-ventricle', 'left-atrium', 'left-ventricle', 'aorta', 'pulmonary-artery'] as const

export type VisualSpec =
  | { kind: 'builtin'; visual: VisualId; focus?: string }
  | {
      kind: 'diagram'
      title: string
      description: string
      nodes: { id: string; label: string }[]
      connections: { from: string; to: string; label: string }[]
      steps: string[]
      accessibilityDescription: string
    }

const BLOCK = /```lumen-visual\s*\n([\s\S]*?)```/

const text = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null
  // Plain text only: strip control characters and angle brackets so nothing can read as markup.
  // eslint-disable-next-line no-control-regex -- strip control characters on purpose
  const s = v.replace(/[\u0000-\u001f\u007f<>]/g, '').trim()
  return s ? s.slice(0, max) : null
}
const ID = /^[a-z0-9-]{1,32}$/

export function parseSpec(json: unknown): VisualSpec | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null
  const o = json as Record<string, unknown>
  if (typeof o.visual === 'string') {
    if (!(VISUAL_IDS as readonly string[]).includes(o.visual)) return null
    const focus = typeof o.focus === 'string' && ID.test(o.focus) ? o.focus : undefined
    return { kind: 'builtin', visual: o.visual as VisualId, focus }
  }
  if (o.visualType !== 'diagram' || !Array.isArray(o.nodes)) return null
  const nodes: { id: string; label: string }[] = []
  for (const n of o.nodes.slice(0, 10)) {
    const id = n && typeof n === 'object' ? (n as Record<string, unknown>).id : null
    const label = n && typeof n === 'object' ? text((n as Record<string, unknown>).label, 60) : null
    if (typeof id !== 'string' || !ID.test(id) || !label || nodes.some((x) => x.id === id)) continue
    nodes.push({ id, label })
  }
  if (nodes.length < 2) return null
  const ids = new Set(nodes.map((n) => n.id))
  const connections = (Array.isArray(o.connections) ? o.connections : [])
    .slice(0, 16)
    .map((c) => {
      const r = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>
      return { from: r.from, to: r.to, label: text(r.label, 40) ?? '' }
    })
    .filter((c): c is { from: string; to: string; label: string } => typeof c.from === 'string' && typeof c.to === 'string' && ids.has(c.from) && ids.has(c.to) && c.from !== c.to)
  const steps = (Array.isArray(o.steps) ? o.steps : []).slice(0, 10).map((s) => text(s, 200)).filter((s): s is string => !!s)
  const title = text(o.title, 80) ?? 'Diagram'
  const description = text(o.description, 300) ?? ''
  const accessibilityDescription =
    text(o.accessibilityDescription, 600) ??
    `${title}. ${nodes.map((n) => n.label).join(', ')}.${connections.length ? ' ' + connections.map((c) => `${nodes.find((n) => n.id === c.from)!.label} to ${nodes.find((n) => n.id === c.to)!.label}`).join('; ') + '.' : ''}`
  return { kind: 'diagram', title, description, nodes, connections, steps, accessibilityDescription }
}

/** Splits a tutor answer into display text and a validated visual (or none). */
export function extractVisual(answer: string): { text: string; visual: VisualSpec | null; invalid: boolean } {
  const m = BLOCK.exec(answer)
  // While streaming, hide a block that has started but not closed yet.
  const open = answer.lastIndexOf('```lumen-visual')
  const visibleEnd = m ? answer.length : open >= 0 ? open : answer.length
  if (!m) return { text: answer.slice(0, visibleEnd).trimEnd(), visual: null, invalid: false }
  const textOut = (answer.slice(0, m.index) + answer.slice(m.index + m[0].length)).replace(/```lumen-visual[\s\S]*?```/g, '').trimEnd()
  let parsed: unknown
  try {
    parsed = JSON.parse(m[1]!)
  } catch {
    return { text: textOut, visual: null, invalid: true }
  }
  const visual = parseSpec(parsed)
  return { text: textOut, visual, invalid: !visual }
}
