import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const css = readFileSync(join(__dirname, 'tokens.css'), 'utf8')

function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector)
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1]!, m[2]!]))
}

const shared = block(":root {\n  /* Deep navy")
const themes = { light: { ...shared, ...block(":root[data-theme='light'] {") }, dark: { ...shared, ...block(":root,\n:root[data-theme='dark']") } }

function lum(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}
export function ratio(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x! + 0.05) / (y! + 0.05)
}

// [foreground, background, minimum]
const pairs: [string, string, number][] = [
  ['text', 'bg', 7],
  ['muted', 'bg', 4.5],
  ['muted', 'surface-2', 4.5],
  ['text', 'surface-2', 7],
  ['accent-text', 'bg', 4.5],
  ['accent', 'bg', 4.5],
  ['on-lime', 'lime', 7],
  ['success', 'bg', 4.5],
  ['text', 'surface', 7],
  ['code', 'bg', 4.5],
  ['bio', 'bg', 4.5],
  ['text', 'surface-2', 7],
  ['muted', 'surface', 4.5],
  ['on-accent', 'accent', 4.5],
  ['danger', 'bg', 4.5],
  ['field-line', 'bg', 3],
  ['on-night', 'night', 7],
  ['on-night-muted', 'night', 4.5],
  ['night-accent', 'night', 4.5],
  ['on-night', 'night-2', 7],
  ['night-danger', 'night', 4.5],
  ['night-field', 'night', 3],
]

describe('token contrast', () => {
  for (const [name, t] of Object.entries(themes)) {
    for (const [fg, bg, min] of pairs) {
      it(`${name}: ${fg} on ${bg} >= ${min}`, () => {
        expect(t[fg], fg).toBeDefined()
        expect(t[bg], bg).toBeDefined()
        expect(ratio(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(min)
      })
    }
  }
  it('dark accent is usable as a focus ring (3:1)', () => {
    expect(ratio(themes.dark.accent!, themes.dark.bg!)).toBeGreaterThanOrEqual(3)
  })
})

describe('design system', () => {
  it('keeps raw hex colours inside tokens.css only', () => {
    const walk = (d: string): string[] =>
      readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))
    const offenders = walk(join(__dirname, '..'))
      .filter((f) => /\.(tsx|css)$/.test(f) && !f.endsWith('tokens.css'))
      .filter((f) => /#[0-9a-f]{6}\b/i.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })
})
