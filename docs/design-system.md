# Design system: ink and cosmos

Source: Design Doc sections 3, 5 and 6. Tokens live only in `apps/web/src/styles/tokens.css`.

## Principles
- Paper and ink, with **one** accent (amber). It marks the next action, the active part and skills checked in the app, always alongside shape or label.
- The **blob window** (an organic ink shape holding a starfield) is the single signature element. It appears as the hero window on Today, as concept nodes in Explore, as the explainer frame and as stars in Skills. It never sits behind text.
- The dark **reading surface** (`--night`) is used for the explainer in both themes, echoing the reference's expanded article panel.
- Editorial layout: left-aligned text, measured line length (about 66ch), rules and whitespace instead of cards and shadows. No shadows, no gradients, no glass.

## Colour tokens (contrast measured, enforced by `contrast.test.ts`)

| Token | Light | Dark | Use | Measured |
|---|---|---|---|---|
| `--bg` | #EAE6DC paper | #20211E night canvas | page | |
| `--surface-2` | #D9D4C8 | #2A2B27 | quiet panels | |
| `--text` | #171815 | #EAE6DC | body | 14.31 / 12.98 |
| `--muted` | #5C5D55 | #A6A69B | secondary text | 5.35 / 6.59 |
| `--accent` | #B98A45 | #D4A866 | fills, rings, glows | non-text in light |
| `--accent-text` | #7A5A26 | #D4A866 | accent as text | 5.08 / 7.39 |
| `--on-accent` | #171815 | #171815 | text on accent fill | 5.76 / 8.14 |
| `--field-line` | #5C5D55 | #77786F | input borders (3:1 UI) | 5.35 / 3.62 |
| `--rule` | #C4BEB1 | #41423B | decorative dividers | decorative |
| `--danger` | #8C3A28 | #E79A82 | errors, destructive | 6.13 / 7.20 |
| `--night` / `--on-night` | #171815 / #EAE6DC | same | reading surface | 14.31 |
| `--on-night-muted` | #A6A69B | same | captions | 7.26 |
| `--night-accent` | #D4A866 | same | active part | 8.14 |

Body text exceeds 7:1 in both themes, as the design doc requires.

## Type
- Display: Big Shoulders Display 800, all caps, hard offset "extruded" shadow (`--extrude`). Used only for page headlines. Flat under high load.
- Title: Fraunces 600.
- Body and UI: Atkinson Hyperlegible 400/700, 18px base, line-height 1.6.
- Captions and navigation: Atkinson 700, uppercase, tracking 0.12em, at least 14px.

## Space, shape, motion
- Space scale `--s-1` to `--s-8` (4, 8, 12, 16, 24, 32, 48, 72 px).
- Radii: `--r-1` 4px for controls. Blobs are paths, not radii.
- Motion: `--dur-fast` 150ms, `--dur` 300ms, `--dur-slow` 500ms, one ease. All set to near zero under `prefers-reduced-motion` or the in-app reduced-motion preference (`data-motion="reduce"`).
- Blob morph: 3 to 4 preset shapes, an 8 s cycle, paused when hidden, off under high load or reduced motion.

## Interaction states (`components.css`)
Default, `:hover` (ink underline or tone shift, never the only cue), `:focus-visible` (2px accent outline plus 2px offset), `:active` (1px translate), `[aria-pressed=true]` and `[aria-current]` (accent ring or underline plus weight), `:disabled` and `[aria-disabled]` (50% opacity, `not-allowed`), `[aria-invalid=true]` (danger line plus message), busy (`aria-busy` with the ink loader).

## Icons
Original 24px inline SVG, 1.75 stroke, round caps, in `components/Icon.tsx`. No icon library.
