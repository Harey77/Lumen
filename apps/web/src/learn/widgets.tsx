import { useEffect, useRef, useState } from 'react'
import { CopyButton } from '../components/CopyButton'
import { useReducedMotion } from '../lib/prefs'

const LANG_NAMES: Record<string, string> = { js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', html: 'HTML', css: 'CSS', c: 'C', csharp: 'C#', cs: 'C#', 'c#': 'C#', java: 'Java', python: 'Python', py: 'Python', bash: 'Shell' }

export function CodeBlock({ code, caption, lang = 'javascript' }: { code: string; caption?: string; lang?: string }) {
  return (
    <figure className="codeblock">
      <div className="codeblock__bar">
        <span>{LANG_NAMES[lang] ?? (lang || 'Code')}</span>
        <CopyButton text={code} label={caption ? `Copy code: ${caption}` : 'Copy code'} />
      </div>
      <pre className="code">
        <code>{code}</code>
      </pre>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

const ARR = [3, 8, 12, 15, 19, 23, 27, 31, 36, 42, 47, 53, 58, 64, 71]

interface SearchState {
  lo: number
  hi: number
  mid: number | null
  found: number | null
  done: boolean
  log: string[]
}
const fresh = (): SearchState => ({ lo: 0, hi: ARR.length - 1, mid: null, found: null, done: false, log: [] })

/** One real step of binary search over ARR; pure so it can be stepped or auto-run. */
export function step(s: SearchState, target: number): SearchState {
  if (s.done) return s
  if (s.lo > s.hi) return { ...s, mid: null, done: true, log: [...s.log, `lo (${s.lo}) is past hi (${s.hi}): ${target} is not in the array.`] }
  const mid = s.lo + Math.floor((s.hi - s.lo) / 2)
  const v = ARR[mid]!
  const n = s.log.length + 1
  if (v === target) return { ...s, mid, found: mid, done: true, log: [...s.log, `Step ${n}: mid = ${mid}, value ${v}. Found ${target} at index ${mid}.`] }
  if (v < target) return { ...s, mid, lo: mid + 1, log: [...s.log, `Step ${n}: mid = ${mid}, value ${v} < ${target}, so lo = ${mid + 1}.`] }
  return { ...s, mid, hi: mid - 1, log: [...s.log, `Step ${n}: mid = ${mid}, value ${v} > ${target}, so hi = ${mid - 1}.`] }
}

export function BinarySearchViz() {
  const [target, setTarget] = useState(42)
  const [s, setS] = useState<SearchState>(fresh)
  const [running, setRunning] = useState(false)
  const reduced = useReducedMotion()
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  // Auto-run stops by itself once the search is done.
  const active = running && !s.done
  useEffect(() => {
    if (!active) return
    timer.current = setInterval(() => setS((x) => step(x, target)), reduced ? 120 : 750)
    return () => clearInterval(timer.current)
  }, [active, target, reduced])

  const choose = (t: number) => {
    setTarget(t)
    setS(fresh())
    setRunning(false)
  }

  return (
    <figure className="widget bsviz" aria-labelledby="bsviz-title">
      <figcaption id="bsviz-title" className="widget__title">
        Binary search, live
      </figcaption>
      <div className="row bsviz__targets" role="group" aria-label="Choose a target">
        {[42, 8, 71, 40].map((t) => (
          <button key={t} type="button" className="chip" aria-pressed={target === t} onClick={() => choose(t)}>
            Find {t}
            {t === 40 ? ' (absent)' : ''}
          </button>
        ))}
      </div>
      <ol className="bsviz__cells" aria-label={`Sorted array of ${ARR.length} numbers`}>
        {ARR.map((v, i) => {
          const out = i < s.lo || i > s.hi
          const st = s.found === i ? 'found' : s.mid === i ? 'mid' : out ? 'out' : 'in'
          return (
            <li key={i} className="bsviz__cell" data-state={st}>
              <span className="bsviz__v">{v}</span>
              <span className="bsviz__i">{i}</span>
              <span className="bsviz__marks" aria-hidden="true">
                {i === s.lo && !s.done && 'lo'}
                {i === s.hi && !s.done && (i === s.lo ? ' hi' : 'hi')}
              </span>
            </li>
          )
        })}
      </ol>
      <div className="row">
        <button type="button" className="btn btn--accent" onClick={() => setS((x) => step(x, target))} disabled={s.done || active}>
          Step
        </button>
        <button type="button" className="btn" onClick={() => setRunning(true)} disabled={s.done || active}>
          Run to the end
        </button>
        <button type="button" className="btn btn--quiet" onClick={() => choose(target)} disabled={s.log.length === 0}>
          Reset
        </button>
        <span className="bsviz__count">
          {s.log.length} {s.log.length === 1 ? 'comparison' : 'comparisons'}
          {s.done && s.found !== null && ` · linear search would need ${s.found + 1}`}
        </span>
      </div>
      <ol className="bsviz__log" aria-live="polite">
        {s.log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ol>
    </figure>
  )
}

export function GrowthViz() {
  const [n, setN] = useState(16)
  const rows: [string, number][] = [
    ['O(1)', 1],
    ['O(log n)', Math.max(1, Math.ceil(Math.log2(n)))],
    ['O(n)', n],
    ['O(n²)', n * n],
  ]
  const max = n * n
  return (
    <figure className="widget growth" aria-labelledby="growth-title">
      <figcaption id="growth-title" className="widget__title">
        Steps needed as n grows
      </figcaption>
      <label className="growth__slider">
        <span>
          Input size n = <strong>{n}</strong>
        </span>
        <input type="range" min={1} max={64} value={n} onChange={(e) => setN(Number(e.target.value))} />
      </label>
      <table className="growth__table">
        <tbody>
          {rows.map(([label, steps]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td className="growth__bar-cell">
                <span className="growth__bar" style={{ transform: `scaleX(${Math.max(0.01, steps / max)})` }} />
              </td>
              <td className="growth__num">{steps.toLocaleString()} steps</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">Bars share one scale, so O(1) and O(log n) stay tiny next to O(n²).</p>
    </figure>
  )
}

function makeCounter() {
  let count = 0
  return function increment() {
    count += 1
    return count
  }
}

export function CounterDemo() {
  // Two genuine closures, created once; the displayed numbers are their return values.
  const [fns] = useState(() => ({ a: makeCounter(), b: makeCounter() }))
  const [vals, setVals] = useState({ a: 0, b: 0 })
  return (
    <figure className="widget counter" aria-labelledby="counter-title">
      <figcaption id="counter-title" className="widget__title">
        Two closures, two private counts
      </figcaption>
      <div className="row">
        <button type="button" className="btn" onClick={() => setVals((v) => ({ ...v, a: fns.a() }))}>
          Call a()
        </button>
        <output className="counter__out" aria-live="polite">
          a returned {vals.a}
        </output>
      </div>
      <div className="row">
        <button type="button" className="btn" onClick={() => setVals((v) => ({ ...v, b: fns.b() }))}>
          Call b()
        </button>
        <output className="counter__out" aria-live="polite">
          b returned {vals.b}
        </output>
      </div>
    </figure>
  )
}
