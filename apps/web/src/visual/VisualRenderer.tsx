import { useState } from 'react'
import { Link } from 'wouter'
import Diagram2D from '../explainer/Diagram2D'
import { mitochondrion } from '../content/mitochondrion'
import type { PartId } from '../content/types'
import { HeartViz } from '../learn/HeartViz'
import { BinarySearchViz, CounterDemo, GrowthViz } from '../learn/widgets'
import { BoxModelViz, CMemoryViz, DomTreeViz, PhotosynthesisViz, PlantCellViz, PythonTraceViz, ReferencesViz } from '../learn/widgets2'
import type { VisualId, VisualSpec } from './spec'

/** Trusted registry: the only components a tutor answer can show. */
const REGISTRY: Record<VisualId, { title: string; lesson: string; render: (focus?: string) => React.ReactNode }> = {
  'heart-3d': { title: 'The heart in 3D', lesson: '/learn/heart', render: (f) => <HeartViz focus={f} /> },
  mitochondrion: {
    title: 'Inside the mitochondrion',
    lesson: '/learn/mitochondrion',
    render: () => (
      <div className="stage stage--static">
        <Diagram2D
          stepIndex={4}
          highlight={null}
          labels={Object.keys(mitochondrion.parts) as PartId[]}
          outerVisible
          flow="pump"
          animate={false}
          replayKey={0}
          command={null}
          partNames={Object.fromEntries(Object.values(mitochondrion.parts).map((p) => [p.id, p.name])) as Record<PartId, string>}
          onPick={() => {}}
        />
      </div>
    ),
  },
  photosynthesis: { title: 'Photosynthesis model', lesson: '/learn/photosynthesis', render: () => <PhotosynthesisViz /> },
  'plant-cell': { title: 'A plant cell', lesson: '/learn/photosynthesis', render: () => <PlantCellViz /> },
  'css-box-model': { title: 'The CSS box model', lesson: '/learn/css-box-model', render: () => <BoxModelViz /> },
  'html-dom': { title: 'The DOM tree', lesson: '/learn/html-structure', render: () => <DomTreeViz /> },
  'python-trace': { title: 'Python names and objects', lesson: '/learn/python-variables', render: () => <PythonTraceViz /> },
  'c-memory': { title: 'C pointers and memory', lesson: '/learn/c-pointers', render: () => <CMemoryViz /> },
  references: { title: 'Objects and references', lesson: '/learn/java-objects', render: () => <ReferencesViz lang="java" /> },
  'binary-search': { title: 'Binary search', lesson: '/learn/binary-search', render: () => <BinarySearchViz /> },
  growth: { title: 'Growth rates', lesson: '/learn/big-o', render: () => <GrowthViz /> },
  closures: { title: 'Closures', lesson: '/learn/js-closures', render: () => <CounterDemo /> },
}

export function VisualRenderer({ spec }: { spec: VisualSpec }) {
  if (spec.kind === 'builtin') {
    const entry = REGISTRY[spec.visual]
    return (
      <div className="visual">
        {entry.render(spec.focus)}
        <p>
          <Link href={entry.lesson} className="arrow-link">
            Open the full lesson
          </Link>
        </p>
      </div>
    )
  }
  return <DiagramViz spec={spec} />
}

function DiagramViz({ spec }: { spec: Extract<VisualSpec, { kind: 'diagram' }> }) {
  const [step, setStep] = useState(0)
  const n = spec.nodes.length
  const cols = Math.min(n, n <= 4 ? n : Math.ceil(n / 2))
  const rows = Math.ceil(n / cols)
  const W = 640
  const H = 150 * rows + 20
  const pos = new Map(spec.nodes.map((node, i) => [node.id, { x: ((i % cols) + 0.5) * (W / cols), y: Math.floor(i / cols) * 150 + 85 }]))
  // Text equivalent comes first for screen readers; the SVG is decorative.
  return (
    <figure className="widget diagram" aria-labelledby="diag-t">
      <figcaption id="diag-t" className="widget__title">
        {spec.title}
      </figcaption>
      {spec.description && <p>{spec.description}</p>}
      <p className="visually-hidden">{spec.accessibilityDescription}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="diagram__svg" aria-hidden="true">
        <defs>
          <marker id="diag-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" className="diagram__head" />
          </marker>
        </defs>
        {spec.connections.map((c, i) => {
          const a = pos.get(c.from)!
          const b = pos.get(c.to)!
          const dx = b.x - a.x
          const dy = b.y - a.y
          const d = Math.hypot(dx, dy) || 1
          const k = 62 / d
          return (
            <g key={i} className="diagram__edge">
              <line x1={a.x + dx * k} y1={a.y + dy * k * 0.5} x2={b.x - dx * k} y2={b.y - dy * k * 0.5} markerEnd="url(#diag-arrow)" />
              {c.label && (
                <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 8} textAnchor="middle">
                  {c.label}
                </text>
              )}
            </g>
          )
        })}
        {spec.nodes.map((node, i) => {
          const p = pos.get(node.id)!
          return (
            <g key={node.id} className="diagram__node" style={{ ['--i' as string]: i }}>
              <rect x={p.x - 70} y={p.y - 26} width="140" height="52" rx="14" />
              <text x={p.x} y={p.y + 5} textAnchor="middle">
                {node.label.length > 20 ? node.label.slice(0, 19) + '…' : node.label}
              </text>
            </g>
          )
        })}
      </svg>
      {spec.steps.length > 0 && (
        <div className="diagram__steps">
          <ol>
            {spec.steps.map((s, i) => (
              <li key={i} aria-current={i === step ? 'step' : undefined}>
                {s}
              </li>
            ))}
          </ol>
          <div className="row">
            <button type="button" className="btn btn--small" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
              Previous
            </button>
            <button type="button" className="btn btn--accent btn--small" onClick={() => setStep(Math.min(spec.steps.length - 1, step + 1))} disabled={step === spec.steps.length - 1}>
              Next step
            </button>
          </div>
        </div>
      )}
    </figure>
  )
}
