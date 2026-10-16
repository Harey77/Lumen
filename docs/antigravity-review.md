# Independent review brief (for Antigravity)

Claude Code built v0. Your job is to **verify it independently, not re-implement it**. Read `AGENTS.md`, `docs/acceptance-criteria.md` and `docs/test-matrix.md` first.

## Setup
```
corepack pnpm install
corepack pnpm build && corepack pnpm preview   # http://localhost:4173
```

## Please check, and report reproducible defects with steps
1. **Core journey by hand**: Today, then Start, Read and watch. Step to Cristae and switch modes (the step must not change). Answer the check wrongly, then rightly. Reload.
2. **Adaptation**: on step 6 tap three wrong parts. Expect "Simplified: 3 missed taps in a row" within 2 s. "Back to full view" must restore the view.
3. **Offline**: load once, reload, turn the network off in DevTools, then open every route.
4. **Real device**: open the preview from a phone on the same network (`pnpm preview --host`). Check rotate and tap on the 3D model, the parts tray, menu, notice and back-to-top.
5. **Screen reader** (NVDA or VoiceOver): skip link, menu, explainer step changes (focus moves to the step title), recall feedback announcements, dialogs. *This is the biggest untested gap.*
6. **Design audit** against `docs/design-system.md`: anything that looks templated, inconsistent spacing, contrast problems not caught by axe.
7. **Content accuracy**: flag any scientific statement in `apps/web/src/content/` that a biologist would dispute. Do not edit the content; list it.

Write findings to `docs/review-findings.md` (severity, route, steps, expected, observed). Do not mark anything fixed without re-running `corepack pnpm e2e`.
