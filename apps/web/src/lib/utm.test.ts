import { describe, expect, it } from 'vitest'
import { stripUtm } from './utm'

describe('stripUtm', () => {
  it('removes every utm parameter, including repeats and odd casing', () => {
    expect(stripUtm('https://x.test/learn?utm_source=a&step=3&UTM_Medium=b&utm_source=c#top')).toBe('/learn?step=3#top')
  })
  it('returns null when absent', () => {
    expect(stripUtm('https://x.test/?step=2')).toBeNull()
  })
  it('handles malformed values and URLs', () => {
    expect(stripUtm('https://x.test/?utm_source=%E0%A4%A')).toBe('/')
    expect(stripUtm('not a url')).toBeNull()
  })
})
