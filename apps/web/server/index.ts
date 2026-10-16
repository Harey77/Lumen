/**
 * Lumen server: serves the built app and a small tutor API.
 * The AI provider key lives only here, in environment variables. Run with Node 23.6+ (native type stripping).
 *
 *   ANTHROPIC_API_KEY=... node server/index.ts      (or any credential the Anthropic SDK resolves)
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProvider, type ChatTurn, type Level, type TutorContext } from './providers.ts'

const here = fileURLToPath(new URL('.', import.meta.url))
const envPath = resolve(here, '..', '.env')
if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath)
  } catch {
    /* ignore if already loaded or invalid format */
  }
}
const DIST = resolve(here, '..', 'dist')
const portArg = process.argv.find((a) => a.startsWith('--port='))?.split('=')[1]
const PORT = Number(portArg ?? process.env.PORT ?? 4173)
const provider = createProvider()

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
  '.png': 'image/png',
}

// ---- request validation (the browser is untrusted)
const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']
const MAX_TURNS = 30
const MAX_CHARS = 6000

export interface TutorRequest {
  messages: ChatTurn[]
  level: Level
  context: TutorContext | null
}

export function validateRequest(body: unknown): TutorRequest | string {
  if (!body || typeof body !== 'object') return 'Body must be a JSON object.'
  const b = body as Record<string, unknown>
  if (!Array.isArray(b.messages) || b.messages.length === 0 || b.messages.length > MAX_TURNS) return `messages must be an array of 1 to ${MAX_TURNS} turns.`
  const messages: ChatTurn[] = []
  for (const [i, m] of b.messages.entries()) {
    if (!m || typeof m !== 'object') return `messages[${i}] is invalid.`
    const { role, content } = m as Record<string, unknown>
    if (role !== 'user' && role !== 'assistant') return `messages[${i}].role must be user or assistant.`
    if (typeof content !== 'string' || !content.trim() || content.length > MAX_CHARS) return `messages[${i}].content must be 1 to ${MAX_CHARS} characters.`
    if (i === 0 && role !== 'user') return 'The first message must come from the user.'
    if (i > 0 && messages[i - 1]!.role === role) return 'Roles must alternate.'
    messages.push({ role, content })
  }
  if (messages[messages.length - 1]!.role !== 'user') return 'The last message must come from the user.'
  const level = LEVELS.includes(b.level as Level) ? (b.level as Level) : 'beginner'
  let context: TutorRequest['context'] = null
  if (b.context && typeof b.context === 'object') {
    const c = b.context as Record<string, unknown>
    // eslint-disable-next-line no-control-regex -- strip control characters on purpose
    const clean = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, '').slice(0, n) : undefined)
    const list = (v: unknown, n: number, len: number) =>
      Array.isArray(v) ? v.slice(0, n).map((x) => clean(x, len)).filter((x): x is string => !!x) : undefined
    context = {
      domain: c.domain === 'programming' || c.domain === 'biology' ? c.domain : undefined,
      course: clean(c.course, 80),
      subject: clean(c.subject, 60),
      lessonTitle: clean(c.lessonTitle, 120),
      topic: clean(c.topic, 100),
      objective: clean(c.objective, 300),
      concepts: list(c.concepts, 8, 80),
      takeaways: list(c.takeaways, 5, 200),
    }
  }
  return { messages, level, context }
}

// ---- tiny per-client rate limit: 20 requests per 5 minutes
const WINDOW = 5 * 60_000
const LIMIT = 20
const hits = new Map<string, number[]>()
export function rateLimited(key: string, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW)
  recent.push(now)
  hits.set(key, recent)
  return recent.length > LIMIT
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

async function readBody(req: IncomingMessage, limit = 64 * 1024): Promise<string> {
  let size = 0
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    size += (chunk as Buffer).length
    if (size > limit) throw new Error('too large')
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks).toString('utf8')
}

async function tutor(req: IncomingMessage, res: ServerResponse) {
  if (!provider.configured) return json(res, 503, { error: 'not_configured', message: provider.reason })
  const ip = req.socket.remoteAddress ?? 'local'
  if (rateLimited(ip)) return json(res, 429, { error: 'rate_limited', message: 'Too many questions in a short time. Wait a few minutes and try again.' })
  let parsed: unknown
  try {
    parsed = JSON.parse(await readBody(req))
  } catch {
    return json(res, 400, { error: 'bad_request', message: 'Request body must be JSON under 64 KB.' })
  }
  const valid = validateRequest(parsed)
  if (typeof valid === 'string') return json(res, 400, { error: 'bad_request', message: valid })

  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' })
  const send = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  const abort = new AbortController()
  const timeout = setTimeout(() => abort.abort(), 120_000)
  // Stop generating (and paying) if the learner closes the page or presses Stop.
  res.on('close', () => abort.abort())
  try {
    const result = await provider.stream(valid, (text) => send('delta', { text }), abort.signal)
    send('done', result)
  } catch (e) {
    send('error', provider.describeError(e, abort.signal.aborted))
  } finally {
    clearTimeout(timeout)
    res.end()
  }
}

function serveStatic(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://x')
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '')
  let file = join(DIST, rel)
  if (!file.startsWith(DIST)) return json(res, 403, { error: 'forbidden' })
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html') // SPA fallback
  if (!existsSync(file)) return json(res, 500, { error: 'build_missing', message: 'Run the build first: corepack pnpm build' })
  const name = file.slice(DIST.length)
  const noCache = name.endsWith('index.html') || name.endsWith('sw.js') || name.includes('workbox') || name.endsWith('.webmanifest')
  res.writeHead(200, {
    'content-type': MIME[extname(file)] ?? 'application/octet-stream',
    'cache-control': noCache ? 'no-cache' : 'public, max-age=31536000, immutable',
    'x-content-type-options': 'nosniff',
  })
  createReadStream(file).pipe(res)
}

const server = createServer((req, res) => {
  const path = (req.url ?? '/').split('?')[0]
  if (path === '/api/tutor/status' && req.method === 'GET') return json(res, 200, provider.status())
  if (path === '/api/tutor' && req.method === 'POST') return void tutor(req, res)
  if (path?.startsWith('/api/')) return json(res, 404, { error: 'not_found' })
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'method_not_allowed' })
  serveStatic(req, res)
})

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  server.listen(PORT, () => {
    const s = provider.status()
    console.log(`Lumen on http://localhost:${PORT}  tutor: ${s.configured ? `${s.provider} (${s.model})` : `not configured: ${provider.reason}`}`)
  })
}
