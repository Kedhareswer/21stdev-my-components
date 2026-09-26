# Dragon Type Specimen

A scroll-driven type-foundry specimen book that a dragon lives in. Seven pages
play inside one pinned stage, and a glossy black dragon moves between them. Its
body follows its head along a path, so it slithers like one living animal
instead of cutting between stills. At rest it still breathes, ripples, blinks
and watches the pointer.

**No dependencies.** React is the only import. There are no images and no fonts
to load:

- **The dragon** is drawn on a canvas each frame: a shaded tube with a red rim
  light, spines along its back, belly folds, four clawed legs that step as it
  moves, horns, a thorn frill, a hinged jaw with teeth, and a glowing slit eye.
- **The display face** is an original angular slab serif, built from stroked
  polylines with mitred spikes, slabs, thorns and diamond beads. It comes in
  regular, bold, outline and bold outline, plus thorned stylistic alternates.
  It covers A–Z, 0–9 and `- . : ! ? /`.

## The pages

| # | Page | The dragon | Interaction |
|---|---|---|---|
| 01 | Cover | coiled round the title, tail across the bottom; dives off the bottom as you scroll | click anywhere: it snaps |
| 02 | The eye | a slot opens in the page and a slit eye opens behind it | the pupil follows the pointer |
| 03 | Glyph set | rises from the lower right, jaws open at the alphabet | hover or tap a glyph to preview it |
| 04 | Weights | drops in from the top left, claws hanging over four G's (thin to heavy, solid and outline) | hover a G |
| 05 | Styles | climbs out of the dark page through a red needle cross | pick a style: every title switches to it (keyboard too) |
| 06 | Alternates | lunges in from the left and roars at the word | |
| 07 | Liquid | pours down the right side and curls toward the drop | the liquid drop follows the pointer, the dragon watches it |

The stage is `position: sticky` inside a taller section. The book plays over
`scrollDistance`, and scrolling back up plays it in reverse.

## Usage

```tsx
import DragonTypeSpecimen from "@/components/ui/dragon-type-specimen"

<DragonTypeSpecimen />                                    // DRAKON / TYPEFACE, red and yellow
<DragonTypeSpecimen
  title="WYVERN"
  subtitle="DISPLAY"
  background="#0f3b2c"
  ink="#e8f0c8"
  eyeColor="#9dff3a"
  defaultStyle="bold"
/>
<DragonTypeSpecimen progress={0.36} />                    // hold one page, no scroll
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `title` | `"DRAKON"` | Cover title. It is fitted to the page width, so longer names shrink. |
| `subtitle` | `"TYPEFACE"` | |
| `studio` | `"STUDIO WYRM"` | Small line above the title. |
| `year` | `"2026"` | |
| `specimenWord` | `"SNARL"` | The word on the alternates page. |
| `background` | `"#e3160f"` | Page colour. It is also the dragon's rim light. |
| `night` | `"#0b0a0b"` | Colour of the dark styles page. |
| `ink` | `"#f7d117"` | Type colour. |
| `dragonColor` | `"#1f1d21"` | Skin. Use a hex value: the highlights are mixed from it. |
| `eyeColor` | `"#ff2a1a"` | Eye glow. |
| `defaultStyle` | `"regular"` | `regular`, `bold`, `outline` or `bold-outline`. |
| `height` | `"100svh"` | Pinned stage height. **Must be a definite length.** |
| `scrollDistance` | `"700svh"` | Extra scroll the seven pages play over. |
| `progress` | none | `0..1` to drive it yourself. This turns off the scroll. |
| `hint` | `true` | The "scroll" cue on the cover. |
| `className` | `""` | Appended to the root. |

## Notes

- Do not put it inside an element with `overflow: hidden` or `auto`, because
  that breaks `position: sticky`. The root uses `overflow: clip` for this reason.
- The page is laid out on a 1600 × 1000 scene that scales to fit. The type stays
  inside the middle 1300 units, and on wide screens the dragon uses the extra
  width.
- Reduced motion: nothing moves on its own. The dragon appears at rest on each
  page instead of travelling, and it does not breathe, blink, drip or snap.
- Everything is seeded or geometric, so it looks the same on every visit. The
  animation pauses while the component is off screen.
