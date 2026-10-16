import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { mitochondrion as m } from './mitochondrion'
import { chemiosmosis as c } from './chemiosmosis'

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? files(p) : [p]
  })
}

describe('mitochondrion module', () => {
  it('has the eight PRD steps in order', () => {
    expect(m.steps.map((s) => s.id)).toEqual([
      'cell', 'outer-membrane', 'intermembrane-space', 'cristae', 'etc', 'atp-synthase', 'matrix', 'recap',
    ])
  })
  it('keeps reader cards to 1 to 3 lines and gives every analogy a breaking point', () => {
    for (const s of m.steps) {
      expect(s.reader.length).toBeGreaterThan(0)
      expect(s.reader.length).toBeLessThanOrEqual(3)
      expect(s.scaffold.length).toBeGreaterThan(1)
      for (const a of Object.values(s.analogy)) expect(a.breaks.length).toBeGreaterThan(20)
    }
  })
  it('recall targets and focus parts exist', () => {
    for (const s of m.steps) {
      if (s.recall) expect(m.parts[s.recall.target]).toBeDefined()
      for (const f of s.focus) expect(m.parts[f]).toBeDefined()
    }
  })
})

describe('scenario', () => {
  it('every timeline entry and paraphrase cites a listed source', () => {
    for (const t of c.timeline) expect(c.sources[t.source]).toBeDefined()
    expect(c.sources[c.role.paraphrase.source]).toBeDefined()
    expect(c.sources[c.consensus.paraphrase.source]).toBeDefined()
  })
})

describe('authored copy', () => {
  it('contains no em dashes (master prompt 5.A)', () => {
    const offenders = files(join(__dirname, '..')).filter(
      (f) => /\.(tsx?|css)$/.test(f) && !f.endsWith('.test.ts') && readFileSync(f, 'utf8').includes(String.fromCharCode(0x2014)),
    )
    expect(offenders).toEqual([])
  })
})
