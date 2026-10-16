import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { Link, useLocation } from 'wouter'
import { db } from '../lib/db'
import { deriveSkills, type SkillStatus } from '../lib/skills'
import { usePageTitle } from './usePageTitle'

interface MapNode {
  id: string
  label: string[]
  x: number
  y: number
  href: string
  /** Skill node whose status this concept reflects. */
  skill?: string
  desc: string
  /** Top-row nodes put their label above, so edges from below never cross it. */
  above?: boolean
}

const NODES: MapNode[] = [
  { id: 'food', label: ['Fuel from', 'food'], x: 60, y: 300, href: '/learn/mitochondrion?step=1', desc: 'Where the energy starts', skill: 'whole-flow' },
  { id: 'matrix', label: ['Matrix', 'citric acid cycle'], x: 250, y: 300, href: '/learn/mitochondrion?step=7', skill: 'matrix', desc: 'Breaks fuel down and loads NADH' },
  { id: 'etc', label: ['Electron', 'transport chain'], x: 420, y: 140, above: true, href: '/learn/mitochondrion?step=5', skill: 'etc', desc: 'Pumps ions using electrons from NADH' },
  { id: 'gradient', label: ['Ion gradient', 'intermembrane space'], x: 620, y: 140, above: true, href: '/learn/mitochondrion?step=3', skill: 'intermembrane-space', desc: 'Stored as a difference in ions' },
  { id: 'synthase', label: ['ATP synthase'], x: 790, y: 300, href: '/learn/mitochondrion?step=6', skill: 'atp-synthase', desc: 'Ions flow back and ATP is made' },
  { id: 'atp', label: ['ATP'], x: 950, y: 300, href: '/learn/mitochondrion?step=8', skill: 'whole-flow', desc: 'Energy the cell can spend' },
  { id: 'cristae', label: ['Cristae', 'more surface'], x: 420, y: 480, href: '/learn/mitochondrion?step=4', skill: 'cristae', desc: 'Folds that hold the pumps and synthases' },
  { id: 'outer', label: ['Outer', 'membrane'], x: 620, y: 480, href: '/learn/mitochondrion?step=2', skill: 'outer-membrane', desc: 'The boundary around it all' },
  { id: 'debate', label: ['How was this', 'proven?'], x: 860, y: 480, href: '/perspectives', skill: 'chemiosmosis-reasoning', desc: 'A real debate, argued from the losing side' },
]

const EDGES: [string, string, string][] = [
  ['food', 'matrix', 'broken down in'],
  ['matrix', 'etc', 'NADH feeds'],
  ['etc', 'gradient', 'pumps ions into'],
  ['gradient', 'synthase', 'flows back through'],
  ['synthase', 'atp', 'makes'],
  ['cristae', 'etc', 'holds'],
  ['cristae', 'synthase', 'holds'],
  ['outer', 'gradient', 'encloses'],
  ['synthase', 'debate', 'doubted until the 1970s'],
]

const STATUS_TEXT: Record<SkillStatus, string> = { unseen: 'not explored yet', explored: 'explored', checked: 'checked in a recall quiz' }

export function ConceptMap() {
  usePageTitle('Concept map')
  const [, navigate] = useLocation()
  const progress = useLiveQuery(() => db.progress.get('mitochondrion'))
  const events = useLiveQuery(() => db.events.toArray(), [], [])
  const perspective = useLiveQuery(() => db.perspectives.get('chemiosmosis'))
  const status = useMemo(() => {
    const map = new Map(deriveSkills(progress, events, perspective).map((n) => [n.id, n.status]))
    return (n: MapNode): SkillStatus => (n.skill ? (map.get(n.skill) ?? 'unseen') : 'unseen')
  }, [progress, events, perspective])
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]))

  return (
    <div className="page">
      <header className="page__head">
        <h1 className="display display--small">Concept map</h1>
        <p className="lead">How energy moves through the mitochondrion. Every concept opens the step that explains it. Rings fill in as you learn.</p>
      </header>

      <div className="concept-map" aria-hidden="false">
        <svg viewBox="0 0 1010 600" className="concept-map__svg" role="group" aria-label="Concept map. Each concept is a link to its lesson step.">
          <defs>
            <marker id="map-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" className="map-arrowhead" />
            </marker>
          </defs>
          {EDGES.map(([a, b, label]) => {
            const p = byId[a]!
            const q = byId[b]!
            const dx = q.x - p.x
            const dy = q.y - p.y
            const d = Math.hypot(dx, dy)
            const k = 46 / d
            return (
              <g key={`${a}-${b}`} className="map-edge">
                <line x1={p.x + dx * k} y1={p.y + dy * k} x2={q.x - dx * k} y2={q.y - dy * k} markerEnd="url(#map-arrow)" />
                <text x={(p.x + q.x) / 2} y={(p.y + q.y) / 2 + 5} textAnchor="middle">
                  {label}
                </text>
              </g>
            )
          })}
          {NODES.map((n, i) => {
            const st = status(n)
            return (
              <a
                key={n.id}
                href={n.href}
                className="map-node"
                data-status={st}
                aria-label={`${n.label.join(' ')}: ${n.desc}. ${STATUS_TEXT[st]}.`}
                onClick={(e) => {
                  e.preventDefault()
                  navigate(n.href)
                }}
              >
                <path className="map-node__ring" d={blob(n.x, n.y, 40, i)} />
                <path className="map-node__window" d={blob(n.x, n.y, 32, i + 3)} />
                <circle className="map-node__star" cx={n.x + 9} cy={n.y - 10} r="2.2" />
                <text className="map-node__label" x={n.x} y={n.above ? n.y - 56 - 20 * (n.label.length - 1) : n.y + 64} textAnchor="middle">
                  {n.label.map((l, j) => (
                    <tspan key={j} x={n.x} dy={j === 0 ? 0 : 20}>
                      {l}
                    </tspan>
                  ))}
                </text>
              </a>
            )
          })}
        </svg>
        <p className="map-legend">
          <span className="legend legend--unseen">Not explored</span>
          <span className="legend legend--explored">Explored</span>
          <span className="legend legend--checked">Checked in a quiz</span>
        </p>
      </div>

      {/* Narrow screens get the same map as an ordered path instead of a miniature diagram. */}
      <ol className="concept-path">
        {['food', 'matrix', 'etc', 'gradient', 'synthase', 'atp', 'cristae', 'outer', 'debate'].map((id, i) => {
          const n = byId[id]!
          const st = status(n)
          const edge = EDGES.find(([a]) => a === id)
          return (
            <li key={id} data-status={st} data-structure={i >= 6}>
              <Link href={n.href} className="concept-path__link">
                <span className="concept-path__name">{n.label.join(' ')}</span>
                <span className="concept-path__desc">{n.desc}</span>
                <span className="concept-path__status">{STATUS_TEXT[st]}</span>
              </Link>
              {edge && i < 5 && <span className="concept-path__edge">{edge[2]}</span>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** A slightly irregular round window for a concept node. */
function blob(cx: number, cy: number, r: number, seed: number) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2
    const k = 1 + Math.sin(seed * 1.7 + i * 2.3) * 0.07
    return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k] as const
  })
  let d = `M${pts[0]![0]},${pts[0]![1]}`
  for (let i = 0; i < 6; i++) {
    const p1 = pts[i]!
    const p2 = pts[(i + 1) % 6]!
    const p0 = pts[(i + 5) % 6]!
    const p3 = pts[(i + 2) % 6]!
    d += `C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`
  }
  return d + 'Z'
}
