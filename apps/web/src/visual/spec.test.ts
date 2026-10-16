import { describe, expect, it } from 'vitest'
import { VISUAL_IDS as SERVER_IDS } from '../../server/prompt'
import { extractVisual, parseSpec, VISUAL_IDS } from './spec'

describe('visual spec gate', () => {
  it('server prompt and client registry list the same visuals', () => {
    expect([...SERVER_IDS]).toEqual([...VISUAL_IDS])
  })
  it('accepts a whitelisted built-in visual and strips it from the text', () => {
    const r = extractVisual('The heart pumps.\n\n```lumen-visual\n{"visual":"heart-3d","focus":"left-ventricle"}\n```')
    expect(r.text).toBe('The heart pumps.')
    expect(r.visual).toEqual({ kind: 'builtin', visual: 'heart-3d', focus: 'left-ventricle' })
  })
  it('rejects unknown visuals, invalid JSON and component injection', () => {
    expect(parseSpec({ visual: 'evil-component' })).toBeNull()
    expect(parseSpec({ visualType: 'script', code: 'alert(1)' })).toBeNull()
    expect(extractVisual('x\n```lumen-visual\n{not json}\n```').invalid).toBe(true)
  })
  it('reduces a diagram to plain strings and drops dangling connections', () => {
    const spec = parseSpec({
      visualType: 'diagram',
      title: '<script>alert(1)</script>Flow',
      nodes: [{ id: 'a', label: '<img src=x onerror=alert(1)>Root' }, { id: 'b', label: 'Leaf' }, { id: 'BAD ID', label: 'x' }],
      connections: [{ from: 'a', to: 'b', label: 'water' }, { from: 'a', to: 'zzz', label: 'gone' }],
      steps: ['Water enters the root', 42],
      onClick: 'steal()',
    })
    expect(spec).not.toBeNull()
    if (spec?.kind !== 'diagram') throw new Error('expected diagram')
    expect(spec.title).toBe('scriptalert(1)/scriptFlow')
    expect(spec.nodes.map((n) => n.id)).toEqual(['a', 'b'])
    expect(spec.nodes[0]!.label).not.toMatch(/[<>]/)
    expect(spec.connections).toEqual([{ from: 'a', to: 'b', label: 'water' }])
    expect(spec.steps).toEqual(['Water enters the root'])
    expect(JSON.stringify(spec)).not.toContain('steal')
  })
  it('hides a half-streamed block until it closes', () => {
    expect(extractVisual('Answer.\n```lumen-visual\n{"vis').text).toBe('Answer.')
  })
})
