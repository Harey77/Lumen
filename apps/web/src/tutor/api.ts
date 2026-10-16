/**
 * The only module in the app allowed to make network requests (see eslint.config.js).
 * It talks to Lumen's own server, which holds the AI credential; nothing here knows the provider.
 */

import type { ContextPayload } from './context'

export type Level = 'beginner' | 'intermediate' | 'advanced'
export interface Turn {
  role: 'user' | 'assistant'
  content: string
}
export interface TutorStatus {
  configured: boolean
  provider: string
  model: string | null
  live: boolean
}
export class TutorError extends Error {
  code: string
  retryable: boolean
  constructor(code: string, message: string, retryable: boolean) {
    super(message)
    this.code = code
    this.retryable = retryable
  }
}

export async function getStatus(signal?: AbortSignal): Promise<TutorStatus | null> {
  try {
    const r = await fetch('/api/tutor/status', { signal, cache: 'no-store' })
    if (!r.ok || !r.headers.get('content-type')?.includes('json')) return null
    return (await r.json()) as TutorStatus
  } catch {
    return null
  }
}

/** Streams an answer; resolves with the full text. Throws TutorError with a user-facing message. */
export async function ask(
  body: { messages: Turn[]; level: Level; context: ContextPayload | null },
  onDelta: (text: string) => void,
  signal: AbortSignal,
): Promise<{ text: string; model: string; stopReason: string }> {
  let res: Response
  try {
    res = await fetch('/api/tutor', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal })
  } catch {
    if (signal.aborted) throw new TutorError('cancelled', 'Stopped.', true)
    throw new TutorError('network', navigator.onLine ? 'Could not reach the Lumen server.' : 'You are offline.', true)
  }
  if (!res.ok || !res.body) {
    let msg = `The server answered ${res.status}.`
    let code = 'http'
    try {
      const j = (await res.json()) as { error?: string; message?: string }
      msg = j.message ?? msg
      code = j.error ?? code
    } catch {
      /* non-JSON error page */
    }
    throw new TutorError(code, msg, res.status === 429 || res.status >= 500)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let text = ''
  let done: { model: string; stopReason: string } | null = null
  for (;;) {
    let chunk: ReadableStreamReadResult<Uint8Array>
    try {
      chunk = await reader.read()
    } catch {
      if (signal.aborted) throw new TutorError('cancelled', 'Stopped.', true)
      throw new TutorError('network', 'The connection dropped mid-answer.', true)
    }
    if (chunk.done) break
    buffer += decoder.decode(chunk.value, { stream: true })
    let i: number
    while ((i = buffer.indexOf('\n\n')) >= 0) {
      const raw = buffer.slice(0, i)
      buffer = buffer.slice(i + 2)
      const event = /^event: (.+)$/m.exec(raw)?.[1]
      const data = /^data: (.+)$/m.exec(raw)?.[1]
      if (!event || !data) continue
      let payload: Record<string, unknown>
      try {
        payload = JSON.parse(data) as Record<string, unknown>
      } catch {
        continue
      }
      if (event === 'delta' && typeof payload.text === 'string') {
        text += payload.text
        onDelta(text)
      } else if (event === 'done') {
        done = { model: String(payload.model ?? ''), stopReason: String(payload.stopReason ?? '') }
      } else if (event === 'error') {
        throw new TutorError(String(payload.error ?? 'error'), String(payload.message ?? 'Something went wrong.'), payload.retryable !== false)
      }
    }
  }
  if (!done) throw new TutorError('incomplete', 'The answer was cut off before it finished.', true)
  return { text, ...done }
}
