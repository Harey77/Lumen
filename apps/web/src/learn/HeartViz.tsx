import { lazy, Suspense, useState } from 'react'
import { Icon } from '../components/Icon'
import { InkLoader } from '../components/Small'
import { webglAvailable } from '../explainer/stage'
import type { HeartPart } from './heartScene'

const Heart3D = lazy(() => import('./Heart3D'))

const INFO: Record<HeartPart, { name: string; text: string }> = {
  'right-atrium': { name: 'Right atrium', text: 'Receives deoxygenated blood returning from the body through the venae cavae, then passes it through the tricuspid valve.' },
  'right-ventricle': { name: 'Right ventricle', text: 'Pumps deoxygenated blood through the pulmonary valve into the pulmonary artery, toward the lungs.' },
  'left-atrium': { name: 'Left atrium', text: 'Receives oxygenated blood from the lungs through the pulmonary veins, then passes it through the mitral valve.' },
  'left-ventricle': { name: 'Left ventricle', text: 'The strongest chamber. Pumps oxygenated blood through the aortic valve into the aorta and the whole body.' },
  aorta: { name: 'Aorta', text: 'The largest artery. Carries oxygenated blood from the left ventricle to the body.' },
  'pulmonary-artery': { name: 'Pulmonary artery', text: 'Carries deoxygenated blood from the right ventricle to the lungs. An artery because it carries blood away from the heart.' },
  'venae-cavae': { name: 'Venae cavae', text: 'The superior and inferior venae cavae return deoxygenated blood from the body to the right atrium.' },
  'pulmonary-veins': { name: 'Pulmonary veins', text: 'Return oxygenated blood from the lungs to the left atrium.' },
}

const TOUR: { part: HeartPart; text: string }[] = [
  { part: 'venae-cavae', text: 'Deoxygenated blood from the body arrives through the venae cavae.' },
  { part: 'right-atrium', text: 'It collects in the right atrium.' },
  { part: 'right-ventricle', text: 'The right ventricle pumps it out.' },
  { part: 'pulmonary-artery', text: 'The pulmonary artery carries it to the lungs, where it gains oxygen and loses carbon dioxide.' },
  { part: 'pulmonary-veins', text: 'Oxygenated blood returns through the pulmonary veins.' },
  { part: 'left-atrium', text: 'It collects in the left atrium.' },
  { part: 'left-ventricle', text: 'The left ventricle, the strongest chamber, pumps it out.' },
  { part: 'aorta', text: 'The aorta carries it to the rest of the body. Then the circuit repeats.' },
]

export function HeartViz({ focus }: { focus?: string }) {
  const initial = focus && focus in INFO ? (focus as HeartPart) : null
  const [sel, setSel] = useState<HeartPart | null>(initial)
  const [step, setStep] = useState<number | null>(null)
  const [labels, setLabels] = useState(true)
  const [flow, setFlow] = useState(true)
  const [cmd, setCmd] = useState<{ c: 'left' | 'right' | 'in' | 'out' | 'reset'; n: number } | null>(null)
  const gl = webglAvailable()
  const highlight = step !== null ? TOUR[step]!.part : sel

  return (
    <figure className="widget heartviz" aria-labelledby="heartviz-t">
      <figcaption id="heartviz-t" className="widget__title">
        The heart, schematic 3D model
      </figcaption>
      <div className="heartviz__stage">
        {gl ? (
          <Suspense fallback={<InkLoader label="Loading the 3D heart" />}>
            <Heart3D highlight={highlight} labels={labels} flow={flow} command={cmd} onPick={(p) => (setStep(null), setSel(p))} />
          </Suspense>
        ) : (
          <HeartDiagram highlight={highlight} onPick={(p) => (setStep(null), setSel(p))} />
        )}
      </div>
      <p className="muted">
        {gl ? 'Drag to turn it. Tap a chamber or vessel. ' : '3D is not available here, so this is the 2D diagram. '}
        Schematic, not to scale. Blue marks deoxygenated blood and red oxygenated; real deoxygenated blood is dark red.
      </p>
      {gl && (
        <div className="view-tray" role="group" aria-label="View controls">
          <button type="button" className="tool" onClick={() => setCmd({ c: 'left', n: Date.now() })}>
            <Icon name="rotateLeft" size={18} />
            <span>Turn left</span>
          </button>
          <button type="button" className="tool" onClick={() => setCmd({ c: 'right', n: Date.now() })}>
            <Icon name="rotateRight" size={18} />
            <span>Turn right</span>
          </button>
          <button type="button" className="tool" onClick={() => setCmd({ c: 'in', n: Date.now() })}>
            <Icon name="zoomIn" size={18} />
            <span>Closer</span>
          </button>
          <button type="button" className="tool" onClick={() => setCmd({ c: 'out', n: Date.now() })}>
            <Icon name="zoomOut" size={18} />
            <span>Farther</span>
          </button>
          <button type="button" className="tool" onClick={() => setCmd({ c: 'reset', n: Date.now() })}>
            <Icon name="reset" size={18} />
            <span>Reset</span>
          </button>
          <button type="button" className="tool" aria-pressed={labels} onClick={() => setLabels(!labels)}>
            <span>Labels</span>
          </button>
          <button type="button" className="tool" aria-pressed={flow} onClick={() => setFlow(!flow)}>
            <span>Blood flow</span>
          </button>
        </div>
      )}
      <div className="row" role="group" aria-label="Parts of the heart">
        {(Object.keys(INFO) as HeartPart[]).map((p) => (
          <button key={p} type="button" className="chip" aria-pressed={highlight === p} onClick={() => (setStep(null), setSel(p))}>
            {INFO[p].name}
          </button>
        ))}
      </div>
      <div className="heartviz__info" aria-live="polite">
        {step !== null ? (
          <p>
            <strong>
              Step {step + 1} of {TOUR.length}.
            </strong>{' '}
            {TOUR[step]!.text}
          </p>
        ) : highlight ? (
          <p>
            <strong>{INFO[highlight].name}.</strong> {INFO[highlight].text}
          </p>
        ) : (
          <p>Choose a part, or follow one drop of blood with the guided tour.</p>
        )}
      </div>
      <div className="row">
        <button type="button" className="btn btn--accent btn--small" onClick={() => setStep(step === null ? 0 : Math.min(step + 1, TOUR.length - 1))} disabled={step === TOUR.length - 1}>
          {step === null ? 'Start the guided tour' : 'Next step'}
        </button>
        {step !== null && (
          <button type="button" className="btn btn--small" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            Previous
          </button>
        )}
        {step !== null && (
          <button type="button" className="btn btn--quiet btn--small" onClick={() => setStep(null)}>
            End tour
          </button>
        )}
      </div>
    </figure>
  )
}

/** 2D fallback with the same parts and interactions. */
function HeartDiagram({ highlight, onPick }: { highlight: HeartPart | null; onPick: (p: HeartPart) => void }) {
  const cls = (p: HeartPart, oxy: boolean) => `hd-part ${oxy ? 'is-oxy' : 'is-deoxy'} ${highlight === p ? 'is-hl' : highlight ? 'is-dim' : ''}`
  return (
    <svg viewBox="0 0 400 320" className="heart2d" role="img" aria-label="Diagram of the heart: right atrium and right ventricle on the viewer's left, left atrium and left ventricle on the right, with the aorta, pulmonary artery, venae cavae and pulmonary veins.">
      <rect x="60" y="20" width="26" height="110" rx="10" className={cls('venae-cavae', false)} onClick={() => onPick('venae-cavae')} />
      <path d="M150 140 C150 60 200 40 250 30 L300 30" className={`hd-vessel ${cls('pulmonary-artery', false)}`} onClick={() => onPick('pulmonary-artery')} />
      <path d="M230 150 C230 60 180 20 120 22" className={`hd-vessel ${cls('aorta', true)}`} onClick={() => onPick('aorta')} />
      <rect x="320" y="110" width="70" height="20" rx="10" className={cls('pulmonary-veins', true)} onClick={() => onPick('pulmonary-veins')} />
      <ellipse cx="110" cy="130" rx="55" ry="45" className={cls('right-atrium', false)} onClick={() => onPick('right-atrium')} />
      <ellipse cx="290" cy="125" rx="52" ry="42" className={cls('left-atrium', true)} onClick={() => onPick('left-atrium')} />
      <path d="M70 175 C70 260 150 300 195 305 L195 170 Z" className={cls('right-ventricle', false)} onClick={() => onPick('right-ventricle')} />
      <path d="M205 165 L205 305 C260 300 335 250 330 170 Z" className={cls('left-ventricle', true)} onClick={() => onPick('left-ventricle')} />
      <text x="110" y="134" textAnchor="middle" className="hd-label">RA</text>
      <text x="290" y="129" textAnchor="middle" className="hd-label">LA</text>
      <text x="140" y="245" textAnchor="middle" className="hd-label">RV</text>
      <text x="265" y="245" textAnchor="middle" className="hd-label">LV</text>
    </svg>
  )
}
