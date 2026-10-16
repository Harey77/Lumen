import { useEffect, useId, useMemo, useRef, type ReactNode } from 'react'
import { useReducedMotion } from '../lib/prefs'

/** Seeded RNG so a given blob always draws the same stars and shapes. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

const POINTS = 9

export function shapes(seed: number, wobble: number): number[][] {
  const r = rng(seed)
  return Array.from({ length: 4 }, () => Array.from({ length: POINTS }, () => 1 - wobble + r() * wobble * 2))
}

/** Closed Catmull-Rom curve through radial points, as cubic Beziers. */
export function blobPath(radii: number[], w: number, h: number): string {
  const cx = w / 2
  const cy = h / 2
  const pts = radii.map((k, i) => {
    const a = (i / radii.length) * Math.PI * 2 - Math.PI / 2
    return [cx + Math.cos(a) * (w / 2) * 0.92 * k, cy + Math.sin(a) * (h / 2) * 0.92 * k] as const
  })
  const n = pts.length
  let d = `M${pts[0]![0].toFixed(1)},${pts[0]![1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]!
    const p1 = pts[i]!
    const p2 = pts[(i + 1) % n]!
    const p3 = pts[(i + 2) % n]!
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${c1[0]!.toFixed(1)},${c1[1]!.toFixed(1)} ${c2[0]!.toFixed(1)},${c2[1]!.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d + 'Z'
}

interface Props {
  seed: number
  width?: number
  height?: number
  /** Idle morph (design doc: 6 to 10 s cycle). Off under reduced motion. */
  morph?: boolean
  stars?: number
  wobble?: number
  className?: string
  children?: ReactNode
}

/** A CSS mask in the shape of a blob window, so content can sit inside it (design doc 6A). */
export function blobMask(seed: number, wobble: number, w = 800, h = 500) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${blobPath(shapes(seed, wobble)[0]!, w, h)}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/** The ink-and-cosmos window: an organic night shape holding a sparse starfield. Decorative. */
export function BlobWindow({ seed, width = 400, height = 400, morph = false, stars = 18, wobble = 0.12, className, children }: Props) {
  const id = "b" + useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const pathRef = useRef<SVGPathElement>(null)
  const reduced = useReducedMotion()
  const presets = useMemo(() => shapes(seed, wobble), [seed, wobble])
  const starList = useMemo(() => {
    const r = rng(seed * 7 + 3)
    return Array.from({ length: stars }, () => {
      // Keep stars toward the rim so they never sit under centred text.
      const a = r() * Math.PI * 2
      const d = 0.55 + r() * 0.38
      return { x: width / 2 + Math.cos(a) * d * width * 0.42, y: height / 2 + Math.sin(a) * d * height * 0.42, s: 0.6 + r() * 1.4 }
    })
  }, [seed, stars, width, height])

  useEffect(() => {
    const el = pathRef.current
    if (!el || !morph || reduced) return
    let raf = 0
    const start = performance.now()
    let paused = document.hidden
    const CYCLE = 8000
    const tick = (t: number) => {
      if (!paused) {
        // rAF timestamps can precede performance.now() at start; never let the phase go negative.
        const phase = (Math.max(0, t - start) / CYCLE) % presets.length
        const i = Math.floor(phase)
        const f = phase - i
        const e = f * f * (3 - 2 * f)
        const a = presets[i]!
        const b = presets[(i + 1) % presets.length]!
        el.setAttribute('d', blobPath(a.map((v, k) => v + (b[k]! - v) * e), width, height))
      }
      raf = requestAnimationFrame(tick)
    }
    const onVis = () => {
      paused = document.hidden
    }
    document.addEventListener('visibilitychange', onVis)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [morph, reduced, presets, width, height])

  return (
    <div className={`blob ${className ?? ''}`}>
      <svg className="blob__svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs>
          <path id={`${id}p`} ref={pathRef} d={blobPath(presets[0]!, width, height)} />
          <clipPath id={`${id}c`}>
            <use href={`#${id}p`} />
          </clipPath>
        </defs>
        <use className="blob__shape" href={`#${id}p`} />
        <g clipPath={`url(#${id}c)`}>
          {starList.map((s, i) => (
            <circle key={i} className="blob__star" cx={s.x} cy={s.y} r={s.s} />
          ))}
        </g>
      </svg>
      {children && <div className="blob__content">{children}</div>}
    </div>
  )
}
