# Flatlay Resume Board

A CV as a desk flat-lay: a perforated sheet, a pinned photo card, a smart-watch
"about me", a crumpled receipt of experience with dotted leaders, torn-paper
education, a lolly-stick label over grid paper, layered skill strips, an SD
card, app tiles on cloth — and two QR codes that actually scan.

Everything is generated. No image file, no icon set, no font file, no npm
dependency beyond React.

## Usage

```tsx
import FlatlayResumeBoard from "@/components/ui/flatlay-resume-board"

<FlatlayResumeBoard />
<FlatlayResumeBoard name="Your Name" portfolioUrl="https://you.dev" />
<FlatlayResumeBoard photo={headshot} items={roles} education={schools} />
<FlatlayResumeBoard height="52rem" />
```

Every rule is scoped to `.frb-*` inside the component's own `<style>`; no
Tailwind utilities.

## Props

| Prop | Default | What it does |
|---|---|---|
| `height` | `"100svh"` | Height of the hero. Must be a definite length. |
| `minHeight` | `"640px"` | Floor, so the board stays readable on short viewports. |
| `name` / `title` / `roles` | — | The card. `roles` shows three lines. |
| `country` / `locale` | — | The two-cell box under the roles. |
| `contacts` | 3 rows | `{ kind: "phone" \| "mail" \| "link", text }`. Three fit. |
| `about` | 7 lines | Pre-broken watch copy. Wrap a phrase in `*stars*` to bold it. |
| `items` | 6 rows | The receipt. `{ title, lines, date, ring }` — `ring` draws the red circle. |
| `education` | 3 entries | `{ title, detail, date }`. |
| `abilities` / `skills` | 6 / 4 | The grid-paper list and the strips. |
| `tiles` | 4 | `{ label, tint, ink }` — the squares on the cloth. |
| `portfolioUrl` / `codeUrl` | — | **Encoded into the two QR codes, for real.** |
| `photo` | drawn stand-in | Portrait for the card. |

Do not pass `height="100%"`. The board is fitted to the root's box, so a
percentage height collapses to 0px on any installed page.

Text does not reflow: `about` and the receipt rows are placed on a fixed grid,
so keep `about` lines around 30 characters, `items` to six rows, `education` to
three, `abilities` to six and `skills` to four. Past that they run off their
paper.

## The QR codes are real

`portfolioUrl` and `codeUrl` are encoded by a QR encoder that ships in this
file — byte mode, error-correction level M, versions 1 to 10, which covers any
URL up to 213 bytes. It picks the smallest version that fits, computes the
Reed-Solomon codewords, lays out the function patterns, tries all eight masks
and keeps the one with the lowest penalty.

This matters because **a decorative QR is worse than no QR on a CV**. Nobody
discovers it does not work until someone points a phone at it.

The encoder lives in a `// #region qr` block, so the published component stays
one file while `tests/flatlay-resume-board.test.mjs` lifts it out and runs it
against matrices captured from a build whose every output was decoded back to
its exact input by a third-party reader. The rendered SVG was scanned too, not
just the matrix.

One bug is worth knowing about, because it is invisible: from version 7 up,
alignment patterns sit on the timing row and column. Skipping those — which is
what happens if you treat "a module is already set" as "already handled" —
produces a code that looks completely normal and never scans. The test asserts
those two patterns explicitly.

If a URL is longer than 213 bytes the encoder returns `null` and the component
draws a plain grey square rather than a truncated code.

## About the defaults

`photo` is unset by default and the card draws a stand-in. That is not a
placeholder habit — 21st's capture sandbox blocks external origins, so a
component whose default state points at an image URL builds fine and then never
generates a cover image.

The default URLs are the one exception, and they are not loaded: they are
encoded into a matrix locally. Nothing in this component fetches anything.

## Deliberate departures from the reference

- **The app tiles are monograms, not logos.** The reference shows Adobe's
  product icons; those are trademarks and are not reproduced. `tiles` takes
  whatever labels and tints you want.
- **The second QR's badge reads `CODE`**, not a third-party wordmark, for the
  same reason.
- **The handwritten lists are set in a slanted system sans**, not a drawn hand.
  The sibling components (`pinboard-portfolio-hero`, `polaroid-zine-hero`) draw
  their own alphabets because handwriting has no safe system fallback; here the
  typography is overwhelmingly printed, so the one slanted list uses the same
  sans rather than carrying a third alphabet.

## Checks worth repeating

```bash
npm run dev     # then ?dark, and drag the window to phone width
npm run check
node tests/flatlay-resume-board.test.mjs
```

The board uses no semantic colour tokens — it is a photograph of a desk, so it
looks identical in both themes by design. Nothing animates, so there is no
motion to gate behind `prefers-reduced-motion`.
