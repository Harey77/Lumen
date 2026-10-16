# Lumen: instructions for coding agents

This is the single source of instructions for Claude Code, Google Antigravity and any other agent. `CLAUDE.md` points here. Antigravity also reads `.agents/rules/lumen.md`.

## What this is
An offline-first adaptive learning lab for exactly two domains: programming (HTML, CSS, C, C#, Java, Python, JavaScript) and biology (anatomy, cell biology, botany). It has an AI tutor (server-side Claude, streamed), validated visualizations, 11 lessons with adaptive quizzes, practice sets, a learner dashboard, and the earlier mitochondrion explainer and Perspectives scenario. The source documents are in `docs/source/`. Decisions are in `docs/decision-log.md`, so read it before reversing anything.

## Commands (run from the repo root; pnpm via corepack)
```
corepack pnpm install
corepack pnpm dev          # http://localhost:5173 (no service worker in dev)
corepack pnpm build        # type-check plus production build to apps/web/dist
corepack pnpm start        # http://localhost:4173: the built app plus the tutor API (reads apps/web/.env)
corepack pnpm dev:server   # tutor API on 8787 for use with pnpm dev
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test         # Vitest unit tests
corepack pnpm e2e          # Playwright against the real server with the test-only provider (builds first)
```
One-time setup for e2e: `corepack pnpm --filter @lumen/web exec playwright install chromium`.

## Map
- `apps/web/src/content/`: authored modules (explainer timeline, scenario, FAQ). Plain TypeScript data. Every claim cites a source.
- `apps/web/src/load-engine/`: the pure cognitive-load model plus the session store. The model is unit tested.
- `apps/web/src/explainer/`: Explainer UI, the shared `StageProps` contract, `Model3D` (lazy Three.js), `Diagram2D` (light tier and fallback), narration.
- `apps/web/server/`: Node server (static app + `/api/tutor`), provider adapter, system prompt. The only place credentials exist.
- `apps/web/src/tutor/`: client API (the one module allowed to call the network), safe Markdown renderer, offline answers.
- `apps/web/src/visual/`: visual spec validator (untrusted AI output) and the trusted renderer registry.
- `apps/web/src/content/catalog.ts`, `lessons-more.ts`: subjects, lessons and quiz questions.
- `apps/web/src/lib/`: Dexie DB, prefs, search index, quiz logic, skill derivation, UTM stripping.
- `apps/web/src/routes/`: one file per destination.
- `apps/web/src/styles/tokens.css`: the **only** place raw colours live (enforced by test).
- `apps/web/e2e/`: Playwright, including offline, privacy, axe and mobile.

## Hard rules
1. **No network calls from app code except `src/tutor/api.ts`**, which talks only to Lumen's own `/api`. ESLint bans network APIs elsewhere and bans provider SDKs in `src/`. An e2e test fails if any request leaves the origin, and another fails if key material or the SDK appears in the bundle. No CDNs and no external fonts.
2. **Never claim what is not built.** Nothing is encrypted. There is no P2P and no signed credentials, and no code execution for C, C#, Java or Python (their traces are pre-computed and say so). AI output is always labelled with its source. Never show fabricated answers as AI.
2b. **AI output is untrusted.** Render it with `Markdown.tsx` (no innerHTML) and pass visuals through `parseSpec`. Learner code runs only in the sandboxed iframe Worker.
3. **No fabricated content.** No invented quotes (paraphrases are labelled), stats, testimonials or reviewers.
4. **Design contract:** midnight-first tokens (the light theme is complete too), cobalt for programming, mint for biology, lime highlight. No emoji icons, icon libraries, toasts or skeleton loaders. No em dashes in authored copy (enforced by test).
5. **Accessibility:** WCAG 2.2 AA. Every canvas interaction has a button equivalent (the parts tray). Keep axe at zero violations in both themes.
6. **Budgets:** initial UI under 5 MB (now about 1.2 MB total). Three.js stays a lazy chunk. Explainer particles switch themselves off below 24 fps.
7. Keep components small and match the existing style. Shared state goes through the existing stores (`prefs.ts`, `load-engine/store.ts`, Dexie). Do not add a state library.

## Collaboration (Claude Code and Antigravity)
- Claude Code owns implementation. Antigravity owns independent verification (see `docs/antigravity-review.md`).
- Work on a branch, keep diffs small, and do not rewrite another agent's files without reading the diff.
- A screenshot or a passing build is not proof that a journey works. Run `pnpm e2e`.
