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

- **`brush`** — the painted marks, and the whole reason this reads as dry media
  rather than vector ink. A displacement pass roughs the outline and a small
  blur takes the vector hardness off the edge, so the grain below has something
  to bite into. Then three noise fields are multiplied into one mask and
  composited `in`:
  - **tooth** — the grain of the stock, at the same frequency and seed the
    sheet itself is given, so the ink sits *in* the paper rather than on it.
    Weighted hard towards opaque (`0.28 0.74 0.92 0.99 1 1`): it speckles a
    dark stroke, it does not turn one grey.
  - **load** — where the brush was still carrying and where it was running out,
    at the scale of a letter rather than a fibre.
  - **skip** — turbulence stretched along x, for the streaks splayed bristles
    leave along the drag.

  The ramps are the delicate part, and the failures are opposite. Flatten them
  and the strokes become flat fills with scratches cut out — vector ink, which
  is exactly what this looked like before. Steepen them and the strokes turn to
  grey dither. The floor matters as much as the ceiling: none of the three ever
  reaches 0, because even the slackest part of a stroke leaves something.

  The tooth is isotropic on purpose. Stretching it two ways makes a convincing
  woven linen, which is the wrong material — this is a cold-pressed paper, and
  it is granular, not cloth.
- **`press`** — the same idea far lighter, for the watermark, the tear and the
  spray.
- **`tooth` / `mottle` / `grain`** — the sheet. Blended `overlay` and `multiply`
  under the art and `overlay` over it. `tooth` shares the `TOOTH` frequency
  with the ink, so the two describe one surface.

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
identical in both themes by design — a `?dark` capture is pixel-for-pixel
identical to the light one across the component's own box. The dark check is
about confirming nothing inverts, not about a second palette.
