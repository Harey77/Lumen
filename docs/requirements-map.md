# Requirements map

The source of each requirement and what v0 does with it. Status: **Build** (in the vertical slice), **Partial** (a real but reduced version), **Defer** (roadmap, not faked), **N/A**.

## PRD pillars

| PRD ID | Requirement (short) | v0 status | Where |
|---|---|---|---|
| 1.1 | On-device interaction signals | Build | `src/load-engine/` records recall misses, back steps, replays and hesitation per lesson step |
| 1.2 | Transparent, tunable load score; nothing leaves the device | Build | `computeLoad()`; weights are visible in Settings |
| 1.3 | Scale UI density by score | Build | Explainer labels, analogy layer, blob motion, scaffold cards |
| 1.4 | Decompose high-load concepts into step scaffolds | Build | Each step has authored `scaffold` micro-steps shown one at a time under high load |
| 1.5 | Offer break or lighter mode | Partial | High load offers "slow down" with a one-tap override. No break timer. |
| 1.6 | Show why the UI changed; let the learner turn adaptation off | Build | Inline adaptation notice with the reason, Revert, and an off switch in Settings |
| 2.1 to 2.6 | Local micro-LLMs, dialect re-synthesis, locale packs, STT | Defer (D-005) | The source text is always the authored English |
| 3.1 | Local interest profile | Partial | Analogy domain choice (machines or cooking) in Settings |
| 3.2 | Concept to analogy explanation | Partial | Authored analogies per step, two domains |
| 3.3 | Sonification | Defer | Not part of this topic |
| 3.4 | Visual simulation engine | Build | The Three.js explainer with particle flow |
| 3.6 | Every analogy shows where it breaks | Build | A `breaks` line on every analogy |
| 4.1 | Curated, source-cited scenario | Build | Chemiosmosis controversy, 4 citations |
| 4.2 | Multi-agent roles voiced by local models | Defer (D-005) | Roles are authored briefs, labelled as such |
| 4.3 / 4.4 | Argue the opposing role before the reveal; contrast with consensus | Build | `/perspectives` |
| 4.5 | No invented quotes | Build | Paraphrase only, marked "paraphrased" |
| 4.6 | Guardrails against false balance | Build | Scenario states it is settled science |
| 5.1 to 5.7 | DIDs, evidence, attestations, VC export | Defer (D-006) | The skill galaxy shows in-app evidence only. JSON export of the learning record is provided. |
| 6.1 | Explainer module format | Build | `src/content/mitochondrion.ts` timeline, with procedural model instead of glTF (D-008) |
| 6.2 | Mode switch keeps step | Build | Shared `step` state |
| 6.3 | Guided: narration, pause, back, speed | Build | Web Speech API with caption fallback (D-009) |
| 6.4 | Reader: step cards, next, back, replay | Build | |
| 6.5 | Rotate, zoom, tap part, layers | Partial | Rotate, zoom, reset, outer-membrane layer toggle, tap part. Exploded view deferred. |
| 6.6 | Localized narration | Defer | English only |
| 6.7 | Labels follow parts | Build | Projected HTML labels |
| 6.8 | Recall checks | Build | After cristae and ATP synthase, plus the recap quiz |
| 6.9 | Load hooks in explainer | Build | Labels, pace, analogy layer |
| 6.10 | Analogy overlay with breakdown | Build | |
| 6.11 | Device tiers | Build | 3D (WebGL), 2D diagram tier (also the WebGL-missing fallback) |
| 6.12 | "See it again" log and spaced review | Partial | Missed recall and "Keep this" add steps to the Library review list. No spacing schedule. |
| 6.13 | Authoring tools | Defer | |
| 6.14 | Sources, reviewer, simplification note | Partial | Sources and simplification note shown. Reviewer shown as "not yet assigned" (true). |

## Non-functional

| Area | v0 |
|---|---|
| Offline | Workbox precache of the full build. Verified by Playwright offline test. |
| Privacy | No network calls from app code (lint rule plus a Playwright request audit). No cookies. |
| Accessibility | WCAG 2.2 AA target, axe-core per route in both themes, plus manual keyboard checks. |
| Footprint and performance | Measured in `docs/test-matrix.md`. |
| Localization, RTL | Defer. Layout uses logical CSS properties where cheap. |

## Master prompt interface requirements (6.1 to 6.19)

See `acceptance-criteria.md` for the location and test of each.
