/**
 * Provider adapter. The UI never sees which SDK is used; swapping models means changing this file only.
 */
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT, contextNote, levelNote } from './prompt.ts'

export type Level = 'beginner' | 'intermediate' | 'advanced'
export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}
export interface TutorContext {
  domain?: 'programming' | 'biology'
  course?: string
  subject?: string
  lessonTitle?: string
  topic?: string
  objective?: string
  concepts?: string[]
  takeaways?: string[]
}
export interface StreamInput {
  messages: ChatTurn[]
  level: Level
  context: TutorContext | null
}
export interface StreamResult {
  stopReason: string
  model: string
}
export interface Provider {
  configured: boolean
  reason: string
  status(): { configured: boolean; provider: string; model: string | null; live: boolean }
  stream(input: StreamInput, onText: (t: string) => void, signal: AbortSignal): Promise<StreamResult>
  describeError(e: unknown, aborted: boolean): { error: string; message: string; retryable: boolean }
}

const MODEL = process.env.LUMEN_MODEL || 'claude-opus-5-5'

function systemFor(input: StreamInput): string {
  // The stable rules come first so they can be cached; per-request level and context follow.
  return `${SYSTEM_PROMPT}\n\n${levelNote(input.level)}\n\n${contextNote(input.context)}`
}

function anthropicProvider(): Provider {
  // The SDK resolves ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN or an `ant auth login` profile.
  const hasCredential = !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_PROFILE || process.env.LUMEN_ASSUME_CREDENTIALS)
  const client = hasCredential ? new Anthropic({ maxRetries: 2, timeout: 120_000 }) : null
  return {
    configured: !!client,
    reason: client ? '' : 'No Anthropic credential found. Set ANTHROPIC_API_KEY on the server (see .env.example) and restart it.',
    status: () => ({ configured: !!client, provider: 'anthropic', model: client ? MODEL : null, live: true }),
    async stream(input, onText, signal) {
      if (!client) throw new Error('not configured')
      const stream = client.beta.messages.stream(
        {
          model: MODEL,
          max_tokens: 16000,
          system: systemFor(input),
          messages: input.messages,
          // Tutoring quality matters more than latency here.
          output_config: { effort: 'high' },
          // Server-side fallback: if the model declines for policy reasons, the API retries on a default substitute.
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
        },
        { signal },
      )
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') onText(event.delta.text)
      }
      const final = await stream.finalMessage()
      return { stopReason: final.stop_reason ?? 'end_turn', model: final.model }
    },
    describeError(e, aborted) {
      if (aborted) return { error: 'timeout', message: 'The answer took too long or was cancelled.', retryable: true }
      if (e instanceof Anthropic.AuthenticationError) return { error: 'auth', message: 'The server’s AI credential was rejected. Check ANTHROPIC_API_KEY.', retryable: false }
      if (e instanceof Anthropic.RateLimitError) return { error: 'provider_rate_limited', message: 'The AI service is busy. Try again in a minute.', retryable: true }
      if (e instanceof Anthropic.BadRequestError) return { error: 'provider_bad_request', message: 'The AI service rejected this request.', retryable: false }
      if (e instanceof Anthropic.APIConnectionError) return { error: 'provider_unreachable', message: 'The server could not reach the AI service.', retryable: true }
      if (e instanceof Anthropic.APIError) return { error: 'provider_error', message: `The AI service returned an error (${e.status ?? 'unknown'}).`, retryable: true }
      return { error: 'unknown', message: 'Something went wrong while answering.', retryable: true }
    },
  }
}

/**
 * Test-only provider for automated tests of the streaming pipeline. It is never selected by default,
 * reports itself as live: false, and the UI labels its output "test provider, not AI".
 */
function testProvider(): Provider {
  return {
    configured: true,
    reason: '',
    status: () => ({ configured: true, provider: 'test', model: 'test-echo', live: false }),
    async stream(input, onText) {
      const last = input.messages[input.messages.length - 1]!.content
      const turns = input.messages.filter((m) => m.role === 'user').length
      const parts = [
        `## Understand the question\nYou asked: "${last.slice(0, 80)}". This is turn ${turns} of the conversation.`,
        '\n\n## Simple explanation\nThe heart has four chambers.',
        '\n\n```lumen-visual\n{"visual":"heart-3d","focus":"left-ventricle"}\n```',
      ]
      if (/script/i.test(last)) parts.push('\n\n```lumen-visual\n{"visualType":"diagram","title":"<script>alert(1)</script>","nodes":[{"id":"a","label":"<img onerror=x>"}]}\n```')
      for (const p of parts) onText(p)
      return { stopReason: 'end_turn', model: 'test-echo' }
    },
    describeError: () => ({ error: 'unknown', message: 'Test provider error.', retryable: true }),
  }
}

export function createProvider(): Provider {
  return process.env.LUMEN_AI_PROVIDER === 'test' ? testProvider() : anthropicProvider()
}
