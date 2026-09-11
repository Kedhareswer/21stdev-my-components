# Brushstroke Portfolio Hero

A full-bleed portfolio poster: an editorial rule at the top and bottom, a
letterspaced credit line, and `Portfolio` painted across the middle in dry
brush over a ghosted `PORT` / `FOLIO` watermark, on torn, sprayed, grainy paper.

Everything in it is generated — there is no image, no video, no icon set and no
font file for the display work. The painted word, the watermark, the tear, the
spray, the paper tooth and the device glyphs are all SVG paths and filters in
the one component file.

## Usage

```tsx
import BrushstrokePortfolioHero from "@/components/ui/brushstroke-portfolio-hero"

<BrushstrokePortfolioHero />                                  // full viewport sheet
<BrushstrokePortfolioHero name="Kedhareswer Naidu" />         // your credit line
<BrushstrokePortfolioHero fit="cover" height="26rem" />       // cropped hero band
```

No npm dependencies beyond React, and no Tailwind utilities — every rule is
scoped to `.bph-*` inside the component's own `<style>`, so it renders the same
against a bare `@import "tailwindcss"` page as it does here.

## Props

| Prop | Default | What it does |
|---|---|---|
| `height` | `"100svh"` | Height of the hero. Must be a definite length. |
| `minHeight` | `"460px"` | Floor, so the rules and the painted word stay legible. |
| `fit` | `"contain"` | `"contain"` shows the whole 1200×734 sheet, centred. `"cover"` scales it to fill the box and crops whichever dimension overflows. |
| `role` | `"3D Artist"` | Top rule, left cell. Its **first** word is the bold one. |
| `period` | `"2022-2023"` | Top rule, centre — the big line. |
| `periodNote` | `"Selected works"` | Top rule, centre — the letterspaced line under it. |
| `name` | `"Your Name"` | The credit line. Its **last** word is the bold one. |
| `possessive` | `true` | Append the lowercase `’s`, as the poster sets it. |
| `email` | `"hello@example.com"` | Bottom rule, left cell. Set in caps. |
| `phone` | `"000 000 0000"` | Bottom rule, right cell. |
| `sansFamily` | system grotesque stack | Face for the *set* text only. |
| `className` | — | Appended to the root. |

Every string is uppercased for you — pass them in normal case.

Do not pass `height="100%"`. The sheet is fitted to the root's box, so a
percentage height collapses to 0px on any page where the ancestors up to
`<html>` lack a definite height — which is every installed page. `100svh` and
`26rem` are both safe; `100%` is not.

The sheet is landscape, 1.64:1. Under the default `fit="contain"` a phone in
portrait will letterbox it into a band with a lot of empty paper above and
below — the honest result of showing a 1.64:1 sheet in a 0.46:1 box. Pass
`fit="cover"` for a hero that fills the screen instead; it scales the sheet up
and crops whatever overflows, which is the left and right edges on a phone and
the top and bottom in a wide band. Cropping a short band that way takes the
rules and the contact line with it, so `cover` suits a band you want the
painting to fill and `contain` suits one you want the whole poster in.

## Why the painted word is generated, not traced

The obvious way to ship brush lettering is one big traced outline. This does
something else: every mark is a **centreline and a pressure profile** — a
half-width per point — and `ribbon()` builds the filled outline from the two.

```ts
ribbon([[219, 249], [223, 298], [228, 349], [234, 401]], [6, 14, 13.5, 6.5])
```

That is the stem of the `P`: the path the hand took, and the load it carried
down it. The taper at the end of a stroke is a number in the data rather than a
bezier that has to be refitted by hand every time a letter moves, which is what
makes the letterforms adjustable at all. Bowls are the same idea closed into a
`ring()`, which measures its two offsets rather than assuming which side came
out bigger — that depends on the direction the centreline was wound, and
guessing it wrong fills every counter on the sheet solid.

The word is fixed at `Portfolio`, because the nine marks in `WORD` are that
word. This is a poster, not a lettering engine; extending it means adding marks.

The watermark behind it is a separate, drawn display face — seven glyphs
(`P O R T F L I`) on a 100-unit cap height, both rows fitted to one measured
width so they stack as a block. Drawing them means no webfont can fail to load
and take the watermark with it.

## What the filters are doing

- **`brush`** — the painted marks. Two displacement passes rough the outline
  (coarse for the ragged edge, fine for chatter), then a turbulence stretched
  hard along x is thresholded into a mask and composited `in`. That mask is the
  dry brush. Its ramp is the single easiest thing to get wrong here: too
  shallow and the strokes turn into grey dither, too steep and they become flat
  vector fills with no skip in them at all. Four of seven stops sit at full
  opacity before the drop.
- **`press`** — the same run far lighter, for the watermark, the tear and the
  spray.
- **`tooth` / `mottle` / `grain`** — paper. Blended `soft-light` and `multiply`
  under the art and `overlay` over it, so the ink sits *in* the sheet rather
  than on it.

Filter ids are namespaced with `React.useId()`. Two posters on one page would
otherwise share them and the second would repaint the first.

## Fidelity note

This is a reconstruction from a flat image of a printed poster, so:

- **The lettering is redrawn, not traced.** It is the same word, hand, size and
  position, built from the stroke data above. Individual letterforms are close
  but not glyph-identical to the original painting.
- **The set text uses a system grotesque stack**, not the poster's face — that
  face is not identifiable from a raster and could not be shipped with a 21st
  component anyway. Only the painted word and the watermark are drawn.
- **The paper, tear, spray, dust and grain are procedural**, seeded from
  `rng()` so the sheet is the same every render rather than a new one each
  mount. They are not a scan of the original stock.
- **The contact details are props with neutral defaults.** The reference poster
  carries a real person's email address and phone number; reproducing the
  layout is the point, republishing their contact details is not.
- SVG cannot measure text, so the phone glyph is placed off an advance estimate
  for the caps run. It tracks the string length, but a face with very different
  metrics will shift the gap.

## Checks worth repeating

```bash
npm run dev     # then ?dark, and drag the window to phone width
npm run check
node tests/brushstroke-portfolio-hero.test.mjs
```

The component uses no semantic colour tokens: it is a printed sheet, so it looks
identical in both themes by design — the `?dark` render is byte-for-byte the
same file. The dark check is about confirming nothing inverts, not about a
second palette.
