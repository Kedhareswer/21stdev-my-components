# Pinboard Portfolio Hero

A full-bleed portfolio hero drawn as a lit studio wall: a stamped `PORT` /
`FOLIO` lockup with the lower line mirrored on its baseline, two cut-out
portraits breaking out of the letters, hand-lettered service labels, and pinned
paper joined by red floss.

Everything in it is generated — there is no image, no video, no icon set and no
font file. The display face, the handwriting, the paper tooth, the ink texture
and the pin gloss are all SVG paths, gradients and filters in the one component
file.

## Usage

```tsx
import PinboardPortfolioHero from "@/components/ui/pinboard-portfolio-hero"

<PinboardPortfolioHero />                                   // full viewport sheet
<PinboardPortfolioHero name="Kedhareswer Naidu" />          // your name on the slip
<PinboardPortfolioHero fit="cover" height="34rem" />        // cropped hero band
```

No npm dependencies beyond React, and no Tailwind utilities — every rule is
scoped to `.pph-*` inside the component's own `<style>`, so it renders the same
against a bare `@import "tailwindcss"` page as it does here.

## Props

| Prop | Default | What it does |
|---|---|---|
| `height` | `"100svh"` | Height of the hero. Must be a definite length. |
| `minHeight` | `"620px"` | Floor, so the sheet stays readable on short viewports. |
| `fit` | `"contain"` | `"contain"` shows the whole 2:3 sheet, centred. `"cover"` crops it top and bottom to fill a wide band. |
| `name` | `"Trần Đức Đạt"` | Name on the pinned slip. Its **last word** is inked red. |
| `className` | — | Appended to the root. |

Do not pass `height="100%"`. The sheet is fitted to the root's box, so a
percentage height collapses to 0px on any page where the ancestors up to
`<html>` lack a definite height — which is every installed page. `100svh` and
`34rem` are both safe; `100%` is not.

## Why the type and the handwriting are drawn

Both alphabets are path data in this file rather than a font.

The display lockup needs seven glyphs (`P O R T F L I`). Drawing them means the
poster cannot be broken by a webfont that failed to load, and it lets both rows
be scaled to measured widths so their edges stay aligned.

The wall labels matter more. They are a slanted marker hand, and no marker hand
is a safe system font: the usual stack (`Bradley Hand`, `Segoe Script`,
`Comic Sans MS`, `cursive`) resolves to a different face on macOS, Windows and
Linux, and to a plain serif on the headless Linux box that renders 21st's cover
image. So every character is drawn as centre-line strokes on a shared baseline —
x-height `-38`, cap `-64`, ascender `-72`, descender `+22` — and stroked with a
round pen, slanted at draw time. Vietnamese characters are composed from a base
letter plus placed accents.

**A character with no glyph renders as a blank, silently.** `writeLine` falls
back through lowercase to a space rather than throwing, so a missing glyph looks
like a typo in review, not a bug. `tests/pinboard-portfolio-hero.test.mjs`
asserts that every character in every string the component sets has a glyph; run
it after changing any copy.

## What the filters are doing

- **`ink`** — the stamped letters. Two displacement passes (coarse for the
  ragged outline, fine for edge chatter), then a noise mask composited `in` to
  bite flecks out of the solids. The mask threshold sits about 1.9 sigma into
  the tail: a shallower ramp turns the letters into grey dither instead of solid
  ink with flecks, which is the single easiest thing to get wrong here.
- **`ink2`** — the same press run lighter, for the portraits and the sun.
- **`fibre` / `grain` / `mottle`** — board tooth, blended `soft-light` under the
  art and `overlay` over it, so the ink sits *in* the board rather than on it.
- **`nib`, `floss`, `smudge`** — small tremors that keep the drawn hand, the
  thread and the wall scuffs off the ruler.

Filter ids are namespaced with `React.useId()`. Two heroes on one page would
otherwise share them and the second would repaint the first.

## Fidelity note

The two portraits are the one place this departs from its reference. In the
source poster they are photographic halftone cut-outs; here they are drawn
stencils with a halftone screen and painted shading. Everything else — the
lockup, the mirrored lower line, the grid and register marks, the labels,
arrows, paper, pins, floss, tape and lighting — is reconstructed geometry.

## Checks worth repeating

```bash
npm run dev     # then ?dark, and drag the window to phone width
npm run check
node tests/pinboard-portfolio-hero.test.mjs
```

The component uses no semantic colour tokens: it is a printed sheet, so it looks
identical in both themes by design. The dark check is about confirming nothing
inverts, not about a second palette.
