# Acceptance criteria

`E2E` = Playwright test in `apps/web/e2e/`, `Unit` = Vitest, `Manual` = checked by hand or in Chrome.

## Vertical slice

| # | Criterion | Test |
|---|---|---|
| V1 | From Today, a learner reaches the mitochondrion explainer and picks Reader or Guided | E2E journey |
| V2 | Switching mode keeps the current step | E2E journey |
| V3 | Tapping a part shows its name, role and one-line explanation | E2E journey |
| V4 | A recall check gives feedback naming the part actually tapped | E2E journey |
| V5 | Three consecutive recall misses on one step show the simpler scaffold within 2 s, with the reason, and Revert restores the full view in one tap (PRD 1 acceptance) | E2E adaptation, Unit load-engine |
| V6 | Step, mode and recall evidence survive a reload | E2E journey |
| V7 | After one online visit, the app and lesson load and work with the network off | E2E offline |
| V8 | Skills shows explored and checked-in-app states derived from stored events | E2E journey |
| V9 | The perspective scenario requires an argument before the reveal, then contrasts it with cited consensus | E2E perspectives |
| V10 | No request leaves the origin during the journey | E2E privacy |

## Interface requirements

| Req | Location | Behaviour and test |
|---|---|---|
| 6.1 Dark mode | Header toggle and Settings (system, light, dark) | Tokens swap via `data-theme`. Inline script prevents a flash. Persists in localStorage. E2E theme, Unit contrast (both themes). |
| 6.2 Storage notice | Bottom of viewport on first visit, non-blocking | States the real storage. "Understood" persists. It can be shown again from Settings. E2E notice. |
| 6.3 Search | Header link to `/search` | Local index over steps, parts, analogies, the scenario, FAQ and the learner's notes. Enter opens the first result, arrows move, Escape clears. Labelled scope. E2E search, Unit search. |
| 6.4 Back to top | Long pages (Perspectives, Settings) | Appears after 600 px, labelled, smooth unless reduced motion. E2E scroll. |
| 6.5 Mobile menu | Header below 960 px | Disclosure with `aria-expanded`. Escape closes and returns focus. Closes on navigation. E2E mobile. |
| 6.6 Loading | Three.js chunk load, initial IndexedDB read | Small ink-dot loader with text, shown only while the promise is pending. Static under reduced motion. Manual. |
| 6.7 States | `components.css` | Hover, `:focus-visible`, `:active`, `[aria-pressed]`, `:disabled`, `[aria-invalid]`. Manual and axe. |
| 6.8 Scroll progress | Perspectives page only | Thin bar under the sticky header, rAF-throttled, ResizeObserver. E2E scroll. |
| 6.9 Copy | Part detail panel, notes | Clipboard API with a `execCommand` fallback. Inline "Copied" or "Copy failed". E2E copy. |
| 6.10 Design system | `src/styles/tokens.css` | No hex values outside the token file (lint-like grep in Unit). |
| 6.11 Sticky header | Global | `scroll-padding-top` matches header height. Manual on mobile. |
| 6.12 Skip link | First focusable element | Moves focus to `<main tabindex=-1>`. E2E skip. |
| 6.13 Password toggle | N/A (D-011) | No accounts exist |
| 6.14 UTM | App boot | Strips `utm_*` from the URL and stores nothing. Unit utm, E2E utm. |
| 6.15 Forms | Library note form, Perspectives argument | Inline errors with `aria-describedby`. Values kept. Success only after the Dexie write resolves. Storage errors are distinguished. Submit is disabled while saving. E2E forms. |
| 6.16 Confirm modal | Reset progress, delete note, clear all data | Native `<dialog>`, Cancel is the default focus, Escape cancels, focus returns to the trigger. E2E confirm. |
| 6.17 Last revised | Lesson and scenario footer, Settings build info | Content `revised` field and build constant, labelled by source (D-016). Manual. |
| 6.18 FAQ | Settings, "Questions" | Buttons with `aria-expanded` and `aria-controls`. Real answers about storage, offline and AI. E2E faq. |
| 6.19 Floating contact | N/A (D-011) | No destination exists |
