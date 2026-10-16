# Council reviews

The council is an internal review method. These notes are the build team's own assessments, not quotes or endorsements.

## Review 1: before implementation (2026-10-16)

Inputs read: PRD, Tech Stack, Design Doc (all three readable, copies in `docs/source/`). The repository held only agent skill folders and a Playwright CLI dev dependency. No application code, tests or content existed.

| Seat | Assessment |
|---|---|
| A. Product / hackathon judge | The PRD has five pillars and a 3D Explainer, and each one is a startup by itself. What makes Lumen different and fits in two minutes: **the interface notices the learner struggling and visibly simplifies itself, explains why, and lets them undo it.** Pair that with the mitochondrion explainer (the PRD's own worked example) and a source-cited "argue the losing side" scenario on the same topic (chemiosmosis). One topic, three pillars, all real. Defer the mesh, local LLM translation, DIDs and credentials. |
| B. Product designer | The ink-and-cosmos blob window is the ownable element. Use it sparingly: one hero window, concept nodes, the explainer frame. Everything else is editorial typography on paper. No card grids. The dark reading surface comes from the reference's article panel. |
| C. Learning scientist | Watching is passive. Recall checks ("tap where ATP is made") must be part of the core loop, not an extra. Feedback should name the part that was actually tapped and say why it is different. Every analogy needs a "where it breaks" line (PRD 3.6). The perspective scenario needs a pre-belief and a post-belief check so belief revision is real. |
| D. Frontend architect | The stack doc prescribes a pnpm monorepo with roughly nine packages. Only one app exists, so split by folder inside `apps/web/src` (load-engine, explainer, content, lib) behind the same boundaries. Promote a folder to a package when a second consumer appears. Keep the cognitive-load engine pure and unit tested. |
| E. Offline / performance | Workbox precache of the whole build plus bundled fonts means zero network after the first load. Three.js is the largest asset, so lazy-load it only on the explainer and fall back to an SVG diagram tier. Measure the bundle, don't guess it. |
| F. Privacy / security | No cookies, no analytics, no network calls. The PRD calls for an "encrypted local vault" but none is built, so the app must never say "encrypted". The storage notice is informational, not consent theatre. UTM parameters get stripped and are never stored. |
| G. Accessibility | Three.js canvas is opaque to screen readers, so the parts tray must offer every pick as a real button. Guided mode needs captions and a transcript. Use native `<dialog>` for confirmations. Check contrast for muted text, because the proposed graphite fails on paper. |
| H. Skeptical judge | Risks of looking fake: a "3D model" that is really a picture, an AI tutor that is really canned text, dashboard numbers that mean nothing. Mitigation: label the model as procedural and simplified, state plainly that no AI model runs, and show only counts derived from stored events. The first thing likely to break is speech synthesis being missing or silent, so captions must carry the lesson alone. |

### Agreements
One topic carried through Today, Explore, Lesson, Perspectives, Skills and Library. Adaptation is the headline feature. Honest labelling everywhere.

### Contradictions resolved (see decision log)
Navigation labels (D-003), monorepo shape (D-002), credentials scope (D-006), local AI scope (D-005), the "encrypted vault" claim (D-007).

## Review 2 and the final review
Appended after milestones; see the bottom of this file.

## Review 2: after the vertical slice (2026-10-16)

| Seat | Assessment |
|---|---|
| A. Product | The two-minute story works end to end: Today, explainer, struggle, visible simplification with its reason, revert, recap, Perspectives reveal, Skills. Strongest demo moment: three wrong taps leading to "Simplified: 3 missed taps in a row on this step". |
| B. Design | No cards in grids, no shadows, a single accent. The blob is now the actual frame of the 3D model (D-021). The Explore map was re-laid-out after review because edges crossed labels. The Today hero is strong, but the lower sections are plain. Acceptable for v0. |
| C. Learning | The highlight gave away recall answers. Fixed (D-020). Labels hide during the quiz. Feedback names the wrong part tapped. Belief revision is recorded only when the answer actually changed. |
| D. Architecture | Strict TS, lint clean, small files, pure load engine with tests. Hook rules (React Compiler era) were fixed instead of disabled, apart from two documented false positives. |
| E. Offline / perf | Offline e2e passes on every route. 1.2 MB total. The 30 fps target was missed at 28 fps under 4x throttle with software GL; it needs a real device. |
| F. Privacy | Zero foreign requests (tested), no cookies (tested), UTM stripped (tested). The copy says "not encrypted" plainly. |
| G. Accessibility | axe shows 0 violations, light and dark, on 9 views. Keyboard-only recall works. 320 px reflow is clean. Gap: no screen-reader session. |
| H. Skeptical judge | What breaks first: speech synthesis on machines without voices, which falls back to paced captions and says so. The 3D model is clearly a teaching model, and the sources say so. Most likely judge challenge: "Where is the AI?" The answer is honest: adaptive behaviour comes from a transparent rules model, and no LLM is involved (D-005). |

## Final anti-template audit (2026-10-16)
1. Coherent identity: yes. Ink, paper, condensed extruded display, blob windows.
2. Mistakable for a generic dashboard: no. Today has one window and three rows of real facts.
3. Repetitive cards: no. Lists and rules are used instead.
4. Visuals carry information: map rings and stars encode stored status; the stage shows the current part.
5. Decoration in check: stars are sparse and kept away from text; morph happens on Today only.
6. Controls functional: every control tested or exercised. Two deferred features are documented, not faked.
7. Dark mode designed: tokens are re-scoped, and the explainer surface stays night in both themes.
8. Loading and success truthful: yes. Success appears only after the IndexedDB write resolves.
9. Empty states intentional: yes, on Library, Search and Skills.
10. Mobile deliberate: Explore becomes an ordered path, the stage turns square, and the menu is a compact text button.
11. Offline and privacy claims verifiable: yes, through e2e tests.
12. Features existing only for the prompt: none kept. Password toggle and floating contact were declined (D-011).
13. Journey in under two minutes: yes (see the demo script in the final report).
14. Clear difference: the self-explaining, reversible adaptation.
