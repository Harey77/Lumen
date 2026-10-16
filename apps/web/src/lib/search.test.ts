import { describe, expect, it } from 'vitest'
import { contentDocs, search } from './search'

const docs = contentDocs()

describe('search', () => {
  it('finds real content and ranks title matches first', () => {
    const hits = search(docs, 'atp synthase')
    expect(hits[0]?.title).toMatch(/ATP synthase/)
  })
  it('requires every term', () => {
    expect(search(docs, 'cristae zebra')).toEqual([])
  })
  it('returns nothing for an empty query', () => {
    expect(search(docs, '   ')).toEqual([])
  })
  it('indexes the perspective scenario and FAQ', () => {
    expect(search(docs, 'Jagendorf').some((h) => h.kind === 'Perspective')).toBe(true)
    expect(search(docs, 'cookies').some((h) => h.kind === 'Question')).toBe(true)
  })
  it('every part links to a real step', () => {
    for (const d of docs.filter((d) => d.kind === 'Part')) expect(d.href).not.toMatch(/step=0$/)
  })
})
