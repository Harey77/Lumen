import { describe, expect, it } from 'vitest'
import { contextNote, SYSTEM_PROMPT } from '../../server/prompt'
import { validateRequest } from '../../server/index'
import { isServiceRoleKey, validateEmail, validatePassword } from '../auth/auth'
import { lessonById } from '../content/catalog'
import { buildContext, detectSubject } from './context'
import { chunks, speakable } from './speech'

describe('subject detection', () => {
  it.each([
    ['How do I use LINQ in C#?', 'csharp'],
    ['Why does my JavaScript closure keep the old value?', 'javascript'],
    ['What does .equals() do in Java?', 'java'],
    ['Why does list.append change both lists in python', 'python'],
    ['What is a pointer and why does my code segfault?', 'c'],
    ['How does flexbox centre things?', 'css'],
    ['What is a semantic HTML element?', 'html'],
    ['Why is the left ventricle thicker?', 'anatomy'],
    ['Where does the Calvin cycle happen in photosynthesis?', 'botany'],
    ['What do mitochondria do?', 'biology'],
  ])('%s -> %s', (q, id) => expect(detectSubject(q)).toBe(id))

  it('keeps the subject for follow-ups without subject words', () => {
    expect(buildContext(undefined, 'why?', ['How do pointers work in C?'])).toEqual({ domain: 'programming', subject: 'C' })
  })
  it('sends the open lesson with its objective, concepts and takeaways', () => {
    const ctx = buildContext(lessonById('heart'), 'what does the mitral valve do?', [])
    expect(ctx).toMatchObject({ domain: 'biology', subject: 'Human anatomy and physiology', lessonTitle: 'The human heart' })
    expect(ctx?.concepts).toContain('Valves')
    expect(ctx?.takeaways?.length).toBeGreaterThan(0)
  })
  it('supports explicit activeSubjectId and topic', () => {
    expect(buildContext(undefined, 'explain syntax', [], 'python', 'lists')).toEqual({ domain: 'programming', subject: 'Python', topic: 'lists' })
  })
})

describe('tutor prompt and context', () => {
  it('requires specific, structured answers and real visuals', () => {
    expect(SYSTEM_PROMPT).toMatch(/Expected output/)
    expect(SYSTEM_PROMPT).toMatch(/never say you ran or tested it/)
    expect(SYSTEM_PROMPT).toMatch(/you MUST include one/)
    expect(SYSTEM_PROMPT).toMatch(/step by step, in order, as cause and effect/)
    expect(SYSTEM_PROMPT).toMatch(/go deeper/)
  })
  it('puts validated lesson context into the system prompt as data', () => {
    const r = validateRequest({
      messages: [{ role: 'user', content: 'q' }],
      context: { domain: 'biology', course: 'Life Sciences', subject: 'Anatomy', lessonTitle: 'The human heart', topic: 'Valves', objective: 'Name the chambers', concepts: ['Valves', 42], takeaways: ['Atria receive'], evil: 'x' },
    })
    if (typeof r !== 'object') throw new Error(r)
    expect(r.context).toEqual({ domain: 'biology', course: 'Life Sciences', subject: 'Anatomy', lessonTitle: 'The human heart', topic: 'Valves', objective: 'Name the chambers', concepts: ['Valves'], takeaways: ['Atria receive'] })
    const note = contextNote(r.context)
    expect(note).toMatch(/<learner_context>[\s\S]*current lesson: The human heart[\s\S]*topic: Valves[\s\S]*lesson concepts: Valves/)
    expect(contextNote(null)).toMatch(/Infer the subject/)
  })
})

describe('speech text', () => {
  const md = '## How it works\nThe **left ventricle** pumps.\n\n```python\nprint(1)\n```\n\n- Valves stop `backflow`.\n\n```lumen-visual\n{"visual":"heart-3d"}\n```'
  it('reads headings and explanations, skips code and visual specs by default', () => {
    const t = speakable(md)
    expect(t).toContain('How it works.')
    expect(t).toContain('The left ventricle pumps.')
    expect(t).toContain('A code example is shown on screen.')
    expect(t).not.toMatch(/print\(1\)|lumen-visual|\*\*|`|##/)
  })
  it('can include code on request, and splits into short chunks', () => {
    expect(speakable(md, true)).toContain('Code in python: print(1).')
    expect(chunks('One. Two? Three!').length).toBe(3)
    expect(chunks('x'.repeat(500)).every((c) => c.length <= 221)).toBe(true)
  })
})

describe('auth safety and validation', () => {
  const jwt = (role: string) => `h.${btoa(JSON.stringify({ role })).replace(/=+$/, '')}.s`
  it('refuses a service-role key in the browser', () => {
    expect(isServiceRoleKey(jwt('service_role'))).toBe(true)
    expect(isServiceRoleKey('sb_secret_abc')).toBe(true)
    expect(isServiceRoleKey(jwt('anon'))).toBe(false)
    expect(isServiceRoleKey('sb_publishable_abc')).toBe(false)
  })
  it('validates email and password', () => {
    expect(validateEmail('a@b.co')).toBeNull()
    expect(validateEmail('nope')).toMatch(/valid email/)
    expect(validatePassword('short1')).toMatch(/8 characters/)
    expect(validatePassword('longenough')).toMatch(/letter and one number/)
    expect(validatePassword('longenough1')).toBeNull()
  })
})
