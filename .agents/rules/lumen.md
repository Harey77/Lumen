Follow AGENTS.md at the repository root; it is the single source of project instructions.

Short form of the hard rules:
- No network calls from app code except src/tutor/api.ts (Lumen's own /api); no CDNs, external fonts or analytics.
- Do not claim encryption, peer-to-peer, credentials or C/C#/Java/Python execution: none are built. AI exists only in the tutor and its output must be labelled.
- No fabricated quotes, stats, reviewers or testimonials.
- Colours only via apps/web/src/styles/tokens.css; no emoji icons, icon libraries, toasts, skeleton loaders or em dashes in copy.
- WCAG 2.2 AA; every canvas action has a button equivalent.
- Verify with `corepack pnpm test` and `corepack pnpm e2e`, not with screenshots alone.
- Your role in this repo: independent reviewer. See docs/antigravity-review.md.
