import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from '../lib/prefs'

/* ---------------- CSS box model: a real element styled with the chosen numbers ---------------- */
export function BoxModelViz() {
  const [v, setV] = useState({ width: 160, padding: 20, border: 6, margin: 24 })
  const [sizing, setSizing] = useState<'content-box' | 'border-box'>('content-box')
  const total = sizing === 'content-box' ? v.width + 2 * v.padding + 2 * v.border : v.width
  const content = sizing === 'content-box' ? v.width : Math.max(0, v.width - 2 * v.padding - 2 * v.border)
  const slider = (key: keyof typeof v, max: number) => (
    <label className="slider">
      <span>
        {key} <strong>{v[key]}px</strong>
      </span>
      <input type="range" min={0} max={max} value={v[key]} onChange={(e) => setV({ ...v, [key]: Number(e.target.value) })} />
    </label>
  )
  return (
    <figure className="widget boxviz" aria-labelledby="boxviz-t">
      <figcaption id="boxviz-t" className="widget__title">
        Box model, live
      </figcaption>
      <div className="boxviz__controls">
        {slider('width', 240)}
        {slider('padding', 48)}
        {slider('border', 20)}
        {slider('margin', 48)}
        <div className="row" role="group" aria-label="box-sizing">
          {(['content-box', 'border-box'] as const).map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={sizing === s} onClick={() => setSizing(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="boxviz__stage" aria-hidden="true">
        <div className="boxviz__margin" style={{ padding: v.margin }}>
          <div className="boxviz__el" style={{ boxSizing: sizing, width: v.width, padding: v.padding, borderWidth: v.border }}>
            <div className="boxviz__content">content</div>
          </div>
        </div>
      </div>
      <p className="boxviz__sum" aria-live="polite">
        Rendered width: <strong>{total}px</strong>
        {sizing === 'content-box' ? ` = ${v.width} + 2 × ${v.padding} padding + 2 × ${v.border} border.` : ` (border-box: padding and border fit inside; content is ${content}px).`} The margin adds {v.margin}px of space on each side outside the border.
      </p>
    </figure>
  )
}

/* ---------------- HTML DOM tree ---------------- */
const DOM: { id: string; tag: string; depth: number; note: string }[] = [
  { id: 'html', tag: 'html', depth: 0, note: 'The root element. Everything else is inside it. lang="en" tells screen readers which language to use.' },
  { id: 'head', tag: 'head', depth: 1, note: 'Information about the page: title, character set, links to stylesheets. Not shown in the window.' },
  { id: 'title', tag: 'title', depth: 2, note: 'The text in the browser tab and in search results.' },
  { id: 'body', tag: 'body', depth: 1, note: 'Everything the visitor sees.' },
  { id: 'header', tag: 'header', depth: 2, note: 'Introductory content, often a logo and the site navigation.' },
  { id: 'main', tag: 'main', depth: 2, note: 'The main content of the page. There should be one.' },
  { id: 'h1', tag: 'h1', depth: 3, note: 'The top-level heading. Headings form an outline that screen-reader users navigate by.' },
  { id: 'p', tag: 'p', depth: 3, note: 'A paragraph of text.' },
  { id: 'footer', tag: 'footer', depth: 2, note: 'Closing information such as copyright and contact links.' },
]
export function DomTreeViz() {
  const [sel, setSel] = useState('body')
  const node = DOM.find((d) => d.id === sel)!
  return (
    <figure className="widget domviz" aria-labelledby="domviz-t">
      <figcaption id="domviz-t" className="widget__title">
        The DOM tree
      </figcaption>
      <ul className="domviz__tree">
        {DOM.map((d) => (
          <li key={d.id} style={{ ['--depth' as string]: d.depth }}>
            <button type="button" className="domviz__node" aria-pressed={sel === d.id} onClick={() => setSel(d.id)}>
              &lt;{d.tag}&gt;
            </button>
          </li>
        ))}
      </ul>
      <p className="domviz__note" aria-live="polite">
        <strong>&lt;{node.tag}&gt;</strong> {node.note}
      </p>
    </figure>
  )
}

/* ---------------- Sandboxed playground (HTML/CSS preview, or JavaScript with console capture) ---------------- */
// The sandboxed frame (opaque origin) runs the code in a Worker it can terminate, so an infinite loop
// is stopped after 5 seconds and can never freeze the page.
const RUNNER = `<script>
const fwd = (type, text) => parent.postMessage({ lumen: true, type, text }, '*');
const WORKER = \`
  const fmt = (a) => a.map((x) => { try { return typeof x === 'string' ? x : JSON.stringify(x) } catch (e) { return String(x) } }).join(' ');
  console.log = (...a) => postMessage({ type: 'log', text: fmt(a) });
  console.warn = console.log;
  console.error = (...a) => postMessage({ type: 'error', text: fmt(a) });
  onmessage = (e) => { try { (0, eval)(e.data) } catch (err) { postMessage({ type: 'error', text: String(err) }) } postMessage({ type: 'done', text: '' }) };\`;
window.addEventListener('message', (e) => {
  if (!e.data || !e.data.lumenRun) return;
  let w;
  try { w = new Worker(URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' }))) }
  catch (err) { fwd('error', 'Could not start the sandbox: ' + err); fwd('done', ''); return }
  const kill = setTimeout(() => { w.terminate(); fwd('error', 'Stopped after 5 seconds. Is there an infinite loop?'); fwd('done', '') }, 5000);
  w.onmessage = (m) => { if (m.data.type === 'done') { clearTimeout(kill); setTimeout(() => w.terminate(), 2000) } fwd(m.data.type, m.data.text) };
  w.postMessage(e.data.code);
});
fwd('ready', '');
</script>`

export function Playground({ lang, initial }: { lang: 'html' | 'javascript'; initial: string }) {
  const id = useId()
  const [code, setCode] = useState(initial)
  const [out, setOut] = useState<{ type: string; text: string }[]>([])
  const [running, setRunning] = useState(false)
  const [frameKey, setFrameKey] = useState(0)
  const frame = useRef<HTMLIFrameElement>(null)
  const pending = useRef<string | null>(null)

  useEffect(() => setCode(initial), [initial]) // eslint-disable-line react-hooks/set-state-in-effect -- load new code sent from the tutor

  useEffect(() => {
    if (lang !== 'javascript') return
    const onMsg = (e: MessageEvent) => {
      // Only trust messages from our own sandboxed frame.
      if (e.source !== frame.current?.contentWindow || !e.data?.lumen) return
      const { type, text } = e.data as { type: string; text: string }
      if (type === 'ready') {
        if (pending.current !== null) frame.current?.contentWindow?.postMessage({ lumenRun: true, code: pending.current }, '*')
        pending.current = null
      } else if (type === 'done') setRunning(false)
      else setOut((o) => [...o, { type, text }].slice(-200))
    }
    addEventListener('message', onMsg)
    return () => removeEventListener('message', onMsg)
  }, [lang])

  const run = () => {
    setOut([])
    setRunning(true)
    pending.current = code
    setFrameKey((k) => k + 1) // a fresh frame each run, so nothing leaks between runs
  }
  const stop = () => {
    pending.current = null
    setRunning(false)
    setFrameKey((k) => k + 1)
    setOut((o) => [...o, { type: 'error', text: 'Stopped.' }])
  }

  return (
    <figure className="widget playground" aria-labelledby={`${id}-t`}>
      <figcaption id={`${id}-t`} className="widget__title">
        {lang === 'html' ? 'HTML and CSS playground' : 'JavaScript playground'}
      </figcaption>
      <label htmlFor={`${id}-code`} className="visually-hidden">
        Code
      </label>
      <textarea id={`${id}-code`} className="playground__code" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} rows={Math.min(16, code.split('\n').length + 2)} />
      {lang === 'html' ? (
        <>
          <p className="muted">Preview (sandboxed, scripts disabled)</p>
          {/* sandbox="" : no scripts, no same-origin access, no forms, no navigation. */}
          <iframe className="playground__frame" title="HTML preview" sandbox="" srcDoc={code} />
        </>
      ) : (
        <>
          <div className="row">
            <button type="button" className="btn btn--accent btn--small" onClick={run} disabled={running}>
              {running ? 'Running…' : 'Run'}
            </button>
            {running && (
              <button type="button" className="btn btn--small" onClick={stop}>
                Stop
              </button>
            )}
            <button type="button" className="btn btn--quiet btn--small" onClick={() => (setCode(initial), setOut([]))}>
              Reset
            </button>
            <span className="muted">Runs in an isolated sandbox frame with no access to this page.</span>
          </div>
          {/* allow-scripts without allow-same-origin: an opaque origin that cannot touch Lumen's storage or DOM. */}
          {running && <iframe key={frameKey} ref={frame} className="visually-hidden" title="JavaScript sandbox" sandbox="allow-scripts" srcDoc={RUNNER} />}
          <ol className="playground__out" aria-live="polite" aria-label="Output">
            {out.length === 0 && <li className="muted">Output appears here.</li>}
            {out.map((o, i) => (
              <li key={i} data-type={o.type}>
                {o.text}
              </li>
            ))}
          </ol>
        </>
      )}
    </figure>
  )
}

export const HTML_STARTER = `<!DOCTYPE html>
<html lang="en">
  <head><title>Try it</title>
    <style>
      body { font-family: system-ui; padding: 16px; }
      nav a { margin-right: 12px; }
    </style>
  </head>
  <body>
    <header><nav><a href="#">Home</a><a href="#">Lessons</a></nav></header>
    <main>
      <h1>Hello, HTML</h1>
      <p>Change this text, or add a <strong>new element</strong>.</p>
    </main>
  </body>
</html>`

/* ---------------- Step traces (pre-computed, and labelled as such) ---------------- */
interface TraceStep {
  line: number
  note: string
  rows: { name: string; value: string; extra?: string }[]
}

function Trace({ title, lang, lines, steps, cols }: { title: string; lang: string; lines: string[]; steps: TraceStep[]; cols: [string, string, string?] }) {
  const id = useId()
  const [i, setI] = useState(0)
  const s = steps[i]!
  return (
    <figure className="widget trace" aria-labelledby={`${id}-t`}>
      <figcaption id={`${id}-t`} className="widget__title">
        {title}
      </figcaption>
      <p className="muted">A pre-computed trace of this {lang} program, step by step. It is not executed in your browser.</p>
      <div className="trace__grid">
        <ol className="trace__code" aria-label="Program">
          {lines.map((l, n) => (
            <li key={n} aria-current={n + 1 === s.line ? 'step' : undefined}>
              <code>{l}</code>
            </li>
          ))}
        </ol>
        <table className="trace__vars">
          <caption className="visually-hidden">State after step {i + 1}</caption>
          <thead>
            <tr>
              {cols.filter(Boolean).map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.rows.map((r) => (
              <tr key={r.name}>
                <th scope="row">{r.name}</th>
                <td>{r.value}</td>
                {cols[2] && <td>{r.extra ?? ''}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="trace__note" aria-live="polite">
        Step {i + 1} of {steps.length}, line {s.line}: {s.note}
      </p>
      <div className="row">
        <button type="button" className="btn btn--small" onClick={() => setI(i - 1)} disabled={i === 0}>
          Previous
        </button>
        <button type="button" className="btn btn--accent btn--small" onClick={() => setI(i + 1)} disabled={i === steps.length - 1}>
          Next step
        </button>
      </div>
    </figure>
  )
}

export function PythonTraceViz() {
  return (
    <Trace
      title="Names and objects, traced"
      lang="Python"
      cols={['Name', 'Refers to object', 'Object']}
      lines={['x = 5', 'y = x', 'x = x + 1', 'a = [1, 2]', 'b = a', 'b.append(3)', 'c = a.copy()']}
      steps={[
        { line: 1, note: 'x is bound to an int object holding 5.', rows: [{ name: 'x', value: '#1', extra: 'int 5' }] },
        { line: 2, note: 'y is bound to the same object as x. Nothing is copied.', rows: [{ name: 'x', value: '#1', extra: 'int 5' }, { name: 'y', value: '#1', extra: 'int 5' }] },
        { line: 3, note: 'x + 1 creates a new int 6 and x is rebound to it. y still refers to 5.', rows: [{ name: 'x', value: '#2', extra: 'int 6' }, { name: 'y', value: '#1', extra: 'int 5' }] },
        { line: 4, note: 'a is bound to a new list.', rows: [{ name: 'x', value: '#2', extra: 'int 6' }, { name: 'y', value: '#1', extra: 'int 5' }, { name: 'a', value: '#3', extra: 'list [1, 2]' }] },
        { line: 5, note: 'b refers to the same list as a.', rows: [{ name: 'a', value: '#3', extra: 'list [1, 2]' }, { name: 'b', value: '#3', extra: 'list [1, 2]' }] },
        { line: 6, note: 'append changes the list in place, so a sees it too.', rows: [{ name: 'a', value: '#3', extra: 'list [1, 2, 3]' }, { name: 'b', value: '#3', extra: 'list [1, 2, 3]' }] },
        { line: 7, note: 'copy() makes a new list #4. Changing c will not affect a or b.', rows: [{ name: 'a', value: '#3', extra: 'list [1, 2, 3]' }, { name: 'b', value: '#3', extra: 'list [1, 2, 3]' }, { name: 'c', value: '#4', extra: 'list [1, 2, 3]' }] },
      ]}
    />
  )
}

export function CMemoryViz() {
  return (
    <Trace
      title="Memory, step by step"
      lang="C"
      cols={['Variable', 'Address', 'Value']}
      lines={['int x = 42;', 'int *p = &x;', 'printf("%d", *p);', '*p = 7;', 'printf("%d", x);']}
      steps={[
        { line: 1, note: 'x gets a slot in memory (shown here at 0x1000) holding 42.', rows: [{ name: 'x', value: '0x1000', extra: '42' }] },
        { line: 2, note: 'p gets its own slot; its value is the address of x.', rows: [{ name: 'x', value: '0x1000', extra: '42' }, { name: 'p', value: '0x1008', extra: '0x1000 (points to x)' }] },
        { line: 3, note: '*p follows the address in p and reads 42. Output: 42', rows: [{ name: 'x', value: '0x1000', extra: '42' }, { name: 'p', value: '0x1008', extra: '0x1000 (points to x)' }] },
        { line: 4, note: '*p = 7 writes 7 into the slot at 0x1000, which is x.', rows: [{ name: 'x', value: '0x1000', extra: '7' }, { name: 'p', value: '0x1008', extra: '0x1000 (points to x)' }] },
        { line: 5, note: 'Reading x directly now gives 7. Output: 7', rows: [{ name: 'x', value: '0x1000', extra: '7' }, { name: 'p', value: '0x1008', extra: '0x1000 (points to x)' }] },
      ]}
    />
  )
}

/* ---------------- References: value vs reference semantics ---------------- */
export function ReferencesViz({ lang }: { lang: 'csharp' | 'java' }) {
  const [mode, setMode] = useState<'value' | 'reference'>('reference')
  const [changed, setChanged] = useState(false)
  const isRef = lang === 'java' || mode === 'reference'
  const a = lang === 'java' ? 'a' : isRef ? 'c1' : 's1'
  const b = lang === 'java' ? 'b' : isRef ? 'c2' : 's2'
  const field = lang === 'java' ? 'name' : 'X'
  const before = lang === 'java' ? '"Rex"' : '1'
  const after = lang === 'java' ? '"Max"' : '5'
  const aVal = isRef ? (changed ? after : before) : before
  const bVal = changed ? after : before
  return (
    <figure className="widget refviz" aria-labelledby={`refviz-${lang}`}>
      <figcaption id={`refviz-${lang}`} className="widget__title">
        {lang === 'java' ? 'Two references, one object' : 'Struct versus class assignment'}
      </figcaption>
      {lang === 'csharp' && (
        <div className="row" role="group" aria-label="Type">
          <button type="button" className="chip" aria-pressed={mode === 'value'} onClick={() => (setMode('value'), setChanged(false))}>
            struct (value type)
          </button>
          <button type="button" className="chip" aria-pressed={mode === 'reference'} onClick={() => (setMode('reference'), setChanged(false))}>
            class (reference type)
          </button>
        </div>
      )}
      <svg viewBox="0 0 520 190" className="refviz__svg" role="img" aria-label={`${a} and ${b} ${isRef ? 'both refer to one object' : 'each hold their own copy'}. ${a}.${field} is ${aVal}; ${b}.${field} is ${bVal}.`}>
        <defs>
          <marker id={`ra-${lang}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" className="refviz__head" />
          </marker>
        </defs>
        {[a, b].map((n, i) => (
          <g key={n}>
            <rect x="20" y={30 + i * 90} width="110" height="56" rx="10" className="refviz__var" />
            <text x="75" y={63 + i * 90} textAnchor="middle" className="refviz__label">
              {n}
            </text>
          </g>
        ))}
        {isRef ? (
          <>
            <rect x="320" y="65" width="180" height="70" rx="12" className="refviz__obj" data-changed={changed} />
            <text x="410" y="96" textAnchor="middle" className="refviz__label">
              object
            </text>
            <text x="410" y="120" textAnchor="middle" className="refviz__value">
              {field} = {aVal}
            </text>
            <path d="M130 58 C220 58 240 90 318 92" className="refviz__arrow" markerEnd={`url(#ra-${lang})`} />
            <path d="M130 148 C220 148 240 112 318 110" className="refviz__arrow" markerEnd={`url(#ra-${lang})`} />
          </>
        ) : (
          [aVal, bVal].map((val, i) => (
            <g key={i}>
              <rect x="160" y={30 + i * 90} width="150" height="56" rx="10" className="refviz__obj" data-changed={i === 1 && changed} />
              <text x="235" y={63 + i * 90} textAnchor="middle" className="refviz__value">
                {field} = {val}
              </text>
            </g>
          ))
        )}
      </svg>
      <div className="row">
        <button type="button" className="btn btn--accent btn--small" onClick={() => setChanged(true)} disabled={changed}>
          Run {b}.{field} = {after}
        </button>
        <button type="button" className="btn btn--quiet btn--small" onClick={() => setChanged(false)} disabled={!changed}>
          Reset
        </button>
      </div>
      <p aria-live="polite">
        {changed
          ? isRef
            ? `${a}.${field} is now ${after} too: both variables refer to the same object.`
            : `${a}.${field} is still ${before}: ${b} was a separate copy.`
          : `${b} = ${a} has run. ${isRef ? 'Only the reference was copied.' : 'The whole struct was copied.'}`}
      </p>
    </figure>
  )
}

/* ---------------- Plant cell, with an animal-cell comparison ---------------- */
const PLANT_PARTS = [
  { id: 'wall', name: 'Cell wall', plantOnly: true, note: 'A rigid layer of cellulose outside the membrane that gives the plant cell its shape.' },
  { id: 'membrane', name: 'Cell membrane', plantOnly: false, note: 'Controls what enters and leaves the cell.' },
  { id: 'vacuole', name: 'Large central vacuole', plantOnly: true, note: 'Stores water and keeps the cell firm by pressing outward.' },
  { id: 'chloroplast', name: 'Chloroplasts', plantOnly: true, note: 'Where photosynthesis happens. They contain chlorophyll.' },
  { id: 'nucleus', name: 'Nucleus', plantOnly: false, note: 'Holds the cell’s DNA and controls its activities.' },
  { id: 'mitochondria', name: 'Mitochondria', plantOnly: false, note: 'Release energy from glucose by respiration, in plants as well as animals.' },
]
export function PlantCellViz() {
  const [sel, setSel] = useState('chloroplast')
  const [compare, setCompare] = useState(false)
  const part = PLANT_PARTS.find((p) => p.id === sel)!
  const cls = (id: string) => `pc-part ${sel === id ? 'is-hl' : ''} ${compare && PLANT_PARTS.find((p) => p.id === id)!.plantOnly ? 'is-unique' : ''}`
  return (
    <figure className="widget pcviz" aria-labelledby="pcviz-t">
      <figcaption id="pcviz-t" className="widget__title">
        A plant cell
      </figcaption>
      <svg viewBox="0 0 400 260" className="pcviz__svg" role="img" aria-label="Diagram of a plant cell: cell wall, membrane, large central vacuole, chloroplasts, nucleus and mitochondria.">
        <rect x="20" y="20" width="360" height="220" rx="18" className={cls('wall')} onClick={() => setSel('wall')} />
        <rect x="32" y="32" width="336" height="196" rx="12" className={cls('membrane')} onClick={() => setSel('membrane')} />
        <rect x="150" y="60" width="150" height="140" rx="40" className={cls('vacuole')} onClick={() => setSel('vacuole')} />
        <g onClick={() => setSel('chloroplast')} className={cls('chloroplast')}>
          {[[70, 70], [95, 190], [330, 80], [325, 190], [60, 140]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="22" ry="11" transform={`rotate(${i * 35} ${x} ${y})`} />
          ))}
        </g>
        <circle cx="110" cy="125" r="26" className={cls('nucleus')} onClick={() => setSel('nucleus')} />
        <g onClick={() => setSel('mitochondria')} className={cls('mitochondria')}>
          <rect x="250" y="210" width="34" height="14" rx="7" />
          <rect x="320" y="130" width="14" height="34" rx="7" />
        </g>
      </svg>
      <div className="row" role="group" aria-label="Parts of the cell">
        {PLANT_PARTS.map((p) => (
          <button key={p.id} type="button" className="chip" aria-pressed={sel === p.id} onClick={() => setSel(p.id)}>
            {p.name}
          </button>
        ))}
      </div>
      <label className="check">
        <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
        <span>Highlight parts animal cells do not have</span>
      </label>
      <p aria-live="polite">
        <strong>{part.name}.</strong> {part.note} {part.plantOnly ? 'Animal cells do not have this.' : 'Animal cells have this too.'}
      </p>
    </figure>
  )
}

/* ---------------- Photosynthesis: a conceptual limiting-factor model ---------------- */
export function photosynthesisRate(light: number, co2: number, water: number) {
  // Simplified teaching model: the scarcest input sets the rate (Blackman's principle of limiting factors).
  const factors = { light, 'carbon dioxide': co2, water }
  const [limiting, value] = Object.entries(factors).sort((x, y) => x[1] - y[1])[0]!
  return { rate: Math.round(value), limiting }
}

export function PhotosynthesisViz() {
  const [f, setF] = useState({ light: 70, co2: 25, water: 80 })
  const reduced = useReducedMotion()
  const { rate, limiting } = useMemo(() => photosynthesisRate(f.light, f.co2, f.water), [f])
  const slider = (key: keyof typeof f, label: string) => (
    <label className="slider">
      <span>
        {label} <strong>{f[key]}%</strong>
      </span>
      <input type="range" min={0} max={100} value={f[key]} onChange={(e) => setF({ ...f, [key]: Number(e.target.value) })} />
    </label>
  )
  const speed = rate === 0 ? 0 : 3.2 - (rate / 100) * 2.4
  return (
    <figure className="widget psviz" aria-labelledby="psviz-t">
      <figcaption id="psviz-t" className="widget__title">
        Photosynthesis, a limiting-factor model
      </figcaption>
      <div className="psviz__controls">
        {slider('light', 'Light')}
        {slider('co2', 'Carbon dioxide')}
        {slider('water', 'Water')}
      </div>
      <svg viewBox="0 0 420 220" className="psviz__svg" aria-hidden="true" data-moving={!reduced && rate > 0} style={{ ['--ps-speed' as string]: `${speed}s` }}>
        <circle cx="60" cy="40" r={10 + f.light / 8} className="ps-sun" />
        <path d="M70 200 C140 60 300 40 380 110 C300 170 160 190 70 200 Z" className="ps-leaf" />
        <path d="M70 200 C170 150 270 120 380 110" className="ps-vein" />
        <g className="ps-flow ps-flow--co2" style={{ opacity: f.co2 / 100 }}>
          <circle r="5" cx="300" cy="200" />
          <circle r="5" cx="320" cy="210" />
        </g>
        <g className="ps-flow ps-flow--o2" style={{ opacity: rate / 100 }}>
          <circle r="5" cx="230" cy="80" />
          <circle r="5" cx="250" cy="70" />
        </g>
        <g className="ps-flow ps-flow--h2o" style={{ opacity: f.water / 100 }}>
          <circle r="4" cx="80" cy="200" />
          <circle r="4" cx="110" cy="185" />
        </g>
        <text x="320" y="214" className="ps-tag">CO₂ in</text>
        <text x="250" y="58" className="ps-tag">O₂ out</text>
        <text x="20" y="214" className="ps-tag">H₂O from roots</text>
        <text x="190" y="135" className="ps-tag ps-tag--sugar">glucose</text>
      </svg>
      <div className="psviz__meter" aria-hidden="true">
        <span style={{ transform: `scaleX(${rate / 100})` }} />
      </div>
      <p aria-live="polite">
        Relative rate: <strong>{rate}%</strong>. Limiting factor: <strong>{limiting}</strong>
        {rate === 0 ? '. With none of it, photosynthesis stops.' : '. Raising anything else will not help until this rises.'}
      </p>
      <p className="muted">Teaching model only: real plants also depend on temperature, species and time, and the curves are not straight lines.</p>
    </figure>
  )
}
