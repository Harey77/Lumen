# Test matrix

Run on 2026-10-16 on a Windows 11 laptop, Node 24.22, Playwright headless Chromium 156 (software WebGL), against `pnpm preview` (the production build with its service worker). **Not** run on the PRD's 3 GB reference Android phone, which has not been chosen yet.

Commands: `pnpm typecheck`, `pnpm lint`, `pnpm test` (Vitest, 53 tests), `pnpm e2e` (Playwright, 39 tests). Final run: **53/53 and 39/39 passed.**

| Area | Result | Evidence |
|---|---|---|
| Startup | Pass | Every e2e test boots the build. Chrome check found and fixed one runtime exception (blob morph phase). |
| Navigation | Pass | All 6 destinations plus Search and Not found render real content. axe test visits each one. |
| Theme | Pass | `interface.spec`: toggle changes computed tokens and persists across reload. The pre-paint script avoids a flash. |
| Storage notice | Pass | Shows once, persists, can be re-opened from Settings. Text matches actual storage (no cookies: `offline-privacy.spec` asserts the cookie jar is empty). |
| Search | Pass | Unit (`search.test`) plus e2e: relevant results, ArrowDown and ArrowUp, Enter opens the first result, Escape clears, empty state. |
| Mobile menu | Pass | 375 px with touch: open, focus moves into the menu, Escape closes and returns focus, closes on navigation. |
| Loading | Pass (manual) | Ink loader only while IndexedDB or the Three.js chunk is pending. No artificial delays in code. |
| Interaction states | Pass (manual and axe) | Hover, focus-visible, active, pressed, disabled and invalid defined in `components.css`. Keyboard-only recall verified by script. |
| Scroll controls | Pass | Back to top appears after 600 px and returns to 0. The progress bar reaches `scaleX(1)` and follows height changes. |
| Copy | Pass | Clipboard holds the displayed definition. The failure path shows an inline message (code-reviewed; not forced in a test). |
| Skip link | Pass | First Tab focuses it, and Enter focuses `main`. |
| Forms | Pass | Notes and the Perspectives argument: inline errors with `aria-invalid`, values kept, success shown only after the Dexie write resolves, duplicate submit blocked while saving. The storage-failure branch is code-reviewed, not forced. |
| Password toggle | N/A | No accounts (D-011). |
| Confirmation dialog | Pass | Native `<dialog>`, Cancel focused, Escape cancels, focus returns to the trigger, reset really clears the record. |
| FAQ | Pass | `aria-expanded` toggles and the answer shows. |
| Floating contact | N/A | No real destination exists (D-011). |
| UTM handling | Pass | Unit: repeated, mixed-case and malformed values. E2E: stripped from the URL, nothing stored. |
| Persistence | Pass | Step, mode, recall evidence, notes and the review list survive a reload. |
| Offline | Pass | After one online visit, with the context offline: lesson, 3D chunk, fonts, every route and search work, and position survives a reload offline. |
| Accessibility | Pass (automated plus partial manual) | axe WCAG 2.0/2.1/2.2 A and AA: 0 violations on 9 views in light and dark. Contrast unit-tested per token pair. 320 px reflow: 0 px overflow on 8 views. Reduced motion stops blob morph. **Screen-reader pass: not done (Blocked: no screen reader run in this session).** |
| Responsive | Pass | Screenshots at 1366, 375 and 320 px. Explore switches to an ordered path under 720 px. Overflow fixed in the stage and Skills table. Tablet and large desktop viewed only at 1366. |
| Security / privacy | Pass | Request audit: zero requests leave the origin during a full journey. Lint bans network APIs. No secrets in the client. No encryption claims (D-007). |
| Performance | Measured | See below. |

## Performance (measured, laptop, not the reference phone)

| Measure | Target | Unthrottled | 4x CPU slowdown, Fast 3G first load |
|---|---|---|---|
| First usable screen (hero visible) | under 3 s | 0.14 s | 1.56 s |
| Lesson with 3D model ready | under 10 s offline | 0.57 s | 0.98 s |
| Offline lesson cold load | | 0.30 s | 0.92 s |
| Next step input to update | under 100 ms | 13 ms | 32 ms |
| Particle animation frame rate | 30 fps | 60 fps | **28 fps** (software WebGL; auto-off threshold is 24) |
| Whole build (precached) | under 5 MB | 1.2 MB on disk; 1.09 MB precache | |
| JS gzip | | main 134 kB, Three.js chunk 146 kB (lazy) | |
| Explainer model data | under 2 MB | 0 bytes (procedural geometry, D-008) | |

The 28 fps figure misses the 30 fps target under 4x throttling with software rendering. It needs a measurement on the real reference device with a GPU.
