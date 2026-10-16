import type { PartId } from '../content/types'
import type { StageProps } from './stage'

// Cross-section in pen-and-ink style: stipple for the matrix, hatching for the ion reservoir.
const TOP = [110, 175, 240, 305, 370]
const BOTTOM = [142, 207, 272, 337]

const ANCHORS: Record<PartId, { x: number; y: number; lx: number; ly: number; anchor: 'start' | 'end' }> = {
  'outer-membrane': { x: 90, y: 52, lx: 40, ly: 24, anchor: 'start' },
  'intermembrane-space': { x: 450, y: 150, lx: 470, ly: 120, anchor: 'end' },
  cristae: { x: 240, y: 118, lx: 250, ly: 24, anchor: 'start' },
  etc: { x: 168, y: 112, lx: 150, ly: 284, anchor: 'start' },
  'atp-synthase': { x: 318, y: 130, lx: 470, ly: 284, anchor: 'end' },
  matrix: { x: 225, y: 175, lx: 40, ly: 284, anchor: 'start' },
}

function cls(part: PartId, p: StageProps) {
  if (!p.highlight) return 'd2-part'
  return part === p.highlight ? 'd2-part is-hl' : 'd2-part is-dim'
}

export default function Diagram2D(p: StageProps) {
  const pick = (part: PartId) => () => p.onPick(part)
  const showFlow = p.flow === 'pump' || p.flow === 'recap' ? 'pump' : null
  const showSynth = p.flow === 'synthase' || p.flow === 'recap'

  if (p.stepIndex === 0) {
    return (
      <svg className="d2" viewBox="0 0 480 300" role="img" aria-label="Diagram: a cell with several mitochondria in its cytoplasm. One is highlighted.">
        <ellipse className="d2-line d2-paper" cx="240" cy="150" rx="215" ry="130" />
        <circle className="d2-line d2-stipple" cx="170" cy="130" r="48" />
        <text className="d2-label" x="170" y="198" textAnchor="middle">nucleus</text>
        {[
          [320, 90, -20],
          [350, 200, 15],
          [110, 215, 30],
          [250, 235, -5],
          [380, 140, 70],
        ].map(([x, y, r], i) => (
          <rect key={i} className="d2-line d2-paper" x={x! - 26} y={y! - 11} width="52" height="22" rx="11" transform={`rotate(${r} ${x} ${y})`} />
        ))}
        <g className="d2-part is-hl" onClick={pick('outer-membrane')}>
          <rect className="d2-line" x="244" y="128" width="70" height="30" rx="15" transform="rotate(-8 279 143)" />
        </g>
        <text className="d2-label" x="279" y="122" textAnchor="middle">this mitochondrion</text>
      </svg>
    )
  }

  return (
    <svg className="d2" viewBox="0 0 480 300" role="img" aria-label="Cross-section diagram of a mitochondrion, simplified and not to scale.">
      <defs>
        <pattern id="d2-stipple" width="9" height="9" patternUnits="userSpaceOnUse">
          <rect className="d2-pat-bg" width="9" height="9" />
          <circle className="d2-pat-ink" cx="2" cy="2" r="0.9" />
          <circle className="d2-pat-ink" cx="6.5" cy="6" r="0.7" />
        </pattern>
        <pattern id="d2-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect className="d2-pat-bg" width="6" height="6" />
          <line className="d2-pat-line" x1="0" y1="0" x2="0" y2="6" />
        </pattern>
        <marker id="d2-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path className="d2-arrowhead" d="M0 0L10 5L0 10z" />
        </marker>
      </defs>

      {p.outerVisible && (
        <g className={cls('outer-membrane', p)} onClick={pick('outer-membrane')}>
          <rect className="d2-line d2-thick" x="30" y="50" width="420" height="200" rx="100" fill="url(#d2-hatch)" />
        </g>
      )}
      <g className={cls('intermembrane-space', p)} onClick={pick('intermembrane-space')}>
        <path
          className="d2-hit"
          fillRule="evenodd"
          d="M130 50h220a100 100 0 010 200H130a100 100 0 010-200zM130 68h220a82 82 0 010 164H130a82 82 0 010-164z"
          fill="url(#d2-hatch)"
        />
      </g>
      <g className={cls('matrix', p)} onClick={pick('matrix')}>
        <rect className="d2-line" x="48" y="68" width="384" height="164" rx="82" fill="url(#d2-stipple)" />
        <ellipse className="d2-line d2-thin" cx="225" cy="178" rx="16" ry="9" fill="none" />
        <ellipse className="d2-line d2-thin" cx="290" cy="196" rx="12" ry="7" fill="none" />
        {[[200, 160], [258, 202], [330, 170], [120, 170], [395, 190]].map(([x, y], i) => (
          <circle key={i} className="d2-ink" cx={x} cy={y} r="2.4" />
        ))}
      </g>
      <g className={cls('cristae', p)} onClick={pick('cristae')}>
        {TOP.map((x) => (
          <path key={`t${x}`} className="d2-line" fill="url(#d2-hatch)" d={`M${x - 8} 66V146a8 8 0 0016 0V66`} />
        ))}
        {BOTTOM.map((x) => (
          <path key={`b${x}`} className="d2-line" fill="url(#d2-hatch)" d={`M${x - 8} 234V158a8 8 0 0116 0V234`} />
        ))}
      </g>
      <g className={cls('etc', p)} onClick={pick('etc')}>
        {TOP.map((x) => [92, 118].map((y) => <rect key={`${x}-${y}`} className="d2-line d2-paper" x={x + 6} y={y} width="9" height="12" rx="2" />))}
      </g>
      <g className={cls('atp-synthase', p)} onClick={pick('atp-synthase')}>
        {BOTTOM.map((x) => (
          <g key={x}>
            <line className="d2-line" x1={x + 8} y1="190" x2={x + 18} y2="190" />
            <circle className="d2-line d2-paper" cx={x + 22} cy="190" r="6" />
          </g>
        ))}
      </g>

      {showFlow && (
        <g className={`d2-flow ${p.animate ? 'is-moving' : ''}`} aria-hidden="true">
          {TOP.slice(0, 4).map((x) => (
            <path key={x} d={`M${x + 34} 112H${x + 12}`} markerEnd="url(#d2-arrow)" />
          ))}
        </g>
      )}
      {showSynth && (
        <g className={`d2-flow ${p.animate ? 'is-moving' : ''}`} aria-hidden="true">
          {BOTTOM.map((x) => (
            <path key={x} d={`M${x + 2} 190H${x + 34}`} markerEnd="url(#d2-arrow)" />
          ))}
        </g>
      )}

      {p.labels.map((id) => {
        const a = ANCHORS[id]
        if (id === 'outer-membrane' && !p.outerVisible) return null
        return (
          <g key={id} className={`d2-callout ${id === p.highlight ? 'is-hl' : ''}`} aria-hidden="true">
            <line x1={a.x} y1={a.y} x2={a.lx} y2={a.ly + (a.ly < 150 ? 4 : -12)} />
            <text x={a.lx} y={a.ly} textAnchor={a.anchor}>
              {p.partNames[id]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
