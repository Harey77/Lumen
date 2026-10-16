# Lumen

> Your online professor who adapts to your mindset.

An offline-first, adaptive learning lab for two domains: **computer programming** (HTML, CSS, C, C#, Java, Python, JavaScript) and **biology** (human anatomy, cell biology, botany).

- **AI tutor** (`/tutor`): ask in natural language and follow up. You can get step-by-step explanations at beginner, intermediate or advanced level, code and debugging help, flashcards, quizzes and next steps. Answers stream from Claude through Lumen's own server, and the API key never reaches the browser. When the tutor is offline or not configured, it answers from saved lessons and says so.
- **Explain it visually**: the tutor can attach a visual. The browser validates it against a strict whitelist (`src/visual/spec.ts`), and only trusted components render it: a 3D heart, the mitochondrion, a photosynthesis model, a plant cell, the CSS box model, a DOM tree, Python and C traces, an objects-and-references diagram, binary search, and generic labelled diagrams.
- **Lessons**: 11 lessons with objectives, worked examples, interactive models or runnable code, key takeaways, a knowledge check and an adaptive quiz.
- **Adaptive quizzes and practice**: a wrong answer explains why and queues a simpler question on the same concept, and the result recommends the next step. Practice sets include quick revision, interview questions, easier questions, and the questions you missed.
- **Offline-first**: the app, lessons, models and progress work without a connection after the first visit. Live AI answers need the network.

## Run it

Needs Node 23.6 or newer (the server uses Node's built-in TypeScript support). pnpm comes through corepack.

```
corepack pnpm install
corepack pnpm build
cp apps/web/.env.example apps/web/.env      # then put your ANTHROPIC_API_KEY in it
corepack pnpm start                          # http://localhost:4173 (app + tutor API)
```

Without a key everything works, but the tutor shows "AI not configured" and answers from saved lessons.

Development: `corepack pnpm dev:server` (tutor API on port 8787) and `corepack pnpm dev` (Vite on 5173, which proxies /api). Tests: `corepack pnpm test` and `corepack pnpm e2e`. The e2e suite runs the real server with a labelled test provider and needs no key.

### AI provider

- Provider code lives only in `apps/web/server/providers.ts`, behind a small adapter interface. To change model, set `LUMEN_MODEL` (default `claude-opus-5-5`). To change provider, add an adapter there; the UI does not change.
- Server-side refusal fallback (`fallbacks: "default"`) is enabled: if the model declines a request for policy reasons, the API retries on a default substitute model.
- Requests are validated (roles, length, turn count), rate-limited (20 per 5 minutes per client) and time-limited (120 s), and stop when the learner presses Stop or leaves.

## Docs

`docs/`: council reviews, decision log, requirements map, acceptance criteria, test matrix, design system, skill usage. The source PRD, tech stack and design docs are in `docs/source/`.

Licence: not yet chosen (an open question in the PRD).
