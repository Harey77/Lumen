import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { Link } from 'wouter'
import { formatDateTime } from '../components/Small'
import { db } from '../lib/db'
import { deriveSkills, type SkillNode, type SkillStatus } from '../lib/skills'
import { usePageTitle } from './usePageTitle'

const LAYOUT: Record<string, [number, number]> = {
  'outer-membrane': [120, 90],
  'intermembrane-space': [210, 170],
  cristae: [95, 240],
  matrix: [230, 300],
  etc: [470, 120],
  'atp-synthase': [560, 220],
  'whole-flow': [440, 290],
  'chemiosmosis-reasoning': [780, 190],
}
const CLUSTERS = [
  { name: 'Structure', x: 165, y: 195, r: 150 },
  { name: 'Energy conversion', x: 495, y: 210, r: 140 },
  { name: 'Scientific reasoning', x: 780, y: 190, r: 95 },
]
const LABEL: Record<SkillStatus, string> = { unseen: 'Not yet explored', explored: 'Explored', checked: 'Checked in app' }

export function Skills() {
  usePageTitle('Skills')
  const progress = useLiveQuery(() => db.progress.get('mitochondrion'))
  const events = useLiveQuery(() => db.events.orderBy('at').toArray(), [], [])
  const perspective = useLiveQuery(() => db.perspectives.get('chemiosmosis'))
  const nodes = useMemo(() => deriveSkills(progress, events, perspective), [progress, events, perspective])
  const [open, setOpen] = useState<string | null>(null)
  const current = nodes.find((n) => n.id === open) ?? null
  const counts = { checked: nodes.filter((n) => n.status === 'checked').length, explored: nodes.filter((n) => n.status === 'explored').length }

  return (
    <div className="page">
      <header className="page__head">
        <h1 className="display display--small">Skills</h1>
        <p className="lead">
          Your skill galaxy, built only from what you did here. Checked stars glow, explored stars are outlined.
        </p>
        <p className="muted">
          {counts.checked} checked, {counts.explored} explored, {nodes.length - counts.checked - counts.explored} not yet explored. This is a record of in-app activity, not a signed credential.
        </p>
      </header>

      <div className="galaxy">
        <svg viewBox="0 0 900 380" className="galaxy__svg" role="group" aria-label="Skill galaxy. Each star is a button that shows its evidence.">
          <rect className="galaxy__sky" width="900" height="380" rx="4" />
          {CLUSTERS.map((c) => (
            <g key={c.name} className="galaxy__cluster">
              <circle cx={c.x} cy={c.y} r={c.r} />
              <text x={c.x} y={c.y - c.r + 22} textAnchor="middle">
                {c.name}
              </text>
            </g>
          ))}
          {nodes.map((n) => {
            const [x, y] = LAYOUT[n.id]!
            return (
              <g
                key={n.id}
                className="star"
                data-status={n.status}
                data-open={open === n.id}
                role="button"
                tabIndex={0}
                aria-pressed={open === n.id}
                aria-label={`${n.name}: ${LABEL[n.status]}`}
                onClick={() => setOpen(open === n.id ? null : n.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setOpen(open === n.id ? null : n.id)
                  }
                }}
              >
                <circle className="star__hit" cx={x} cy={y} r="26" />
                {n.status === 'checked' && <circle className="star__glow" cx={x} cy={y} r="17" />}
                <path className="star__shape" d={starPath(x, y, n.status === 'unseen' ? 7 : 11)} />
                <text className="star__label" x={x} y={y + 34} textAnchor="middle">
                  {n.name.length > 24 ? n.name.slice(0, 22) + '…' : n.name}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {current && <Evidence node={current} />}

      <section aria-labelledby="skill-list-title">
        <h2 id="skill-list-title" className="section-title">
          All skills
        </h2>
        <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Skill</th>
              <th scope="col" className="col-optional">Area</th>
              <th scope="col">Status</th>
              <th scope="col" className="col-optional">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((n) => (
              <tr key={n.id}>
                <th scope="row">
                  <Link href={n.href}>{n.name}</Link>
                </th>
                <td className="col-optional">{n.cluster}</td>
                <td>
                  <span className={`status status--${n.status}`}>{LABEL[n.status]}</span>
                </td>
                <td className="col-optional">{n.evidence.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
    </div>
  )
}

function Evidence({ node }: { node: SkillNode }) {
  return (
    <section className="evidence" aria-labelledby="evidence-title" aria-live="polite">
      <p className="eyebrow">{node.cluster}</p>
      <h2 id="evidence-title" className="section-title">
        {node.name}
      </h2>
      <p>
        Status: <span className={`status status--${node.status}`}>{LABEL[node.status]}</span>
      </p>
      {node.evidence.length === 0 ? (
        <p className="muted">
          No evidence yet. <Link href={node.href}>Start this part</Link>.
        </p>
      ) : (
        <ol className="evidence__list">
          {node.evidence.map((e, i) => (
            <li key={i}>
              <time dateTime={new Date(e.at).toISOString()}>{formatDateTime(e.at)}</time> {e.text}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function starPath(cx: number, cy: number, r: number) {
  const pts = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2
    const k = i % 2 === 0 ? r : r * 0.45
    return `${(cx + Math.cos(a) * k).toFixed(1)},${(cy + Math.sin(a) * k).toFixed(1)}`
  })
  return `M${pts.join('L')}Z`
}
