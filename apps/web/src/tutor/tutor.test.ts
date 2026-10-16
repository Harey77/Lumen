import { describe, expect, it } from 'vitest'
import { rateLimited, validateRequest } from '../../server/index'
import { photosynthesisRate } from '../learn/widgets2'
import { toTurns } from '../routes/Tutor'
import { offlineAnswer } from './offline'

describe('server request validation', () => {
  it('accepts a well-formed conversation and defaults the level', () => {
    const r = validateRequest({ messages: [{ role: 'user', content: 'What is a pointer?' }] })
    expect(typeof r).toBe('object')
    if (typeof r === 'object') expect(r.level).toBe('beginner')
  })
  it('rejects bad shapes, roles, order and sizes', () => {
    expect(validateRequest(null)).toMatch(/JSON object/)
    expect(validateRequest({ messages: [] })).toMatch(/1 to 30/)
    expect(validateRequest({ messages: [{ role: 'system', content: 'x' }] })).toMatch(/role/)
    expect(validateRequest({ messages: [{ role: 'assistant', content: 'x' }] })).toMatch(/first message/)
    expect(validateRequest({ messages: [{ role: 'user', content: 'a' }, { role: 'user', content: 'b' }] })).toMatch(/alternate/)
    expect(validateRequest({ messages: [{ role: 'user', content: 'x'.repeat(6001) }] })).toMatch(/6000/)
    expect(validateRequest({ messages: [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }] })).toMatch(/last message/)
  })
  it('sanitises lesson context', () => {
    const r = validateRequest({ messages: [{ role: 'user', content: 'hi' }], context: { lessonTitle: '<b>Heart</b>\u0000', subject: 7 } })
    if (typeof r !== 'object') throw new Error(r)
    expect(r.context).toEqual({ lessonTitle: 'bHeart/b', subject: undefined })
  })
  it('rate-limits a client after 20 requests in five minutes', () => {
    const t = 1_000_000
    for (let i = 0; i < 20; i++) expect(rateLimited('ip-test', t + i)).toBe(false)
    expect(rateLimited('ip-test', t + 21)).toBe(true)
    expect(rateLimited('ip-test', t + 6 * 60_000)).toBe(false)
  })
})

describe('conversation context', () => {
  it('sends prior AI exchanges for follow-ups but never offline quotes', () => {
    const turns = toTurns(
      [
        { role: 'user', content: 'What is the aorta?', at: 1 },
        { role: 'assistant', content: 'The largest artery.', source: 'ai', at: 2 },
        { role: 'user', content: 'offline question', at: 3 },
        { role: 'assistant', content: 'quoted lesson', source: 'offline', at: 4 },
      ],
      'And the pulmonary artery?',
    )
    expect(turns).toEqual([
      { role: 'user', content: 'What is the aorta?' },
      { role: 'assistant', content: 'The largest artery.' },
      { role: 'user', content: 'And the pulmonary artery?' },
    ])
  })
})

describe('offline answers and models', () => {
  it('answers from saved lessons by topic', () => {
    expect(offlineAnswer('what does the left ventricle do?')[0]?.href).toMatch(/\/learn\/heart/)
    expect(offlineAnswer('explain pointers in C')[0]?.href).toMatch(/c-pointers/)
    expect(offlineAnswer('qwertyuiop')).toEqual([])
  })
  it('photosynthesis rate is set by the scarcest input', () => {
    expect(photosynthesisRate(90, 20, 80)).toEqual({ rate: 20, limiting: 'carbon dioxide' })
    expect(photosynthesisRate(10, 90, 80).limiting).toBe('light')
  })
})
