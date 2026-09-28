# Dragon Type Specimen

A scroll-driven type-foundry specimen book that a dragon lives in. Seven pages
play inside one pinned stage, and a glossy black dragon moves between them. Its
body follows its head along a path, so it slithers like one living animal
instead of cutting between stills. At rest it still breathes, ripples, blinks
and watches the pointer.

**No dependencies.** React is the only import. There are no images and no fonts
to load:

- **The dragon** is WebGL2: its body is swept along its path every frame and
  shaded as wet, dark clay, with broken glints on the lit side and the page's
  colour bouncing into the shadow side. The skin texture is baked from numbers
  at start-up.
- **The display face** is an original angular slab serif, built from stroked
  polylines with mitred spikes, slabs, thorns and diamond beads. It comes in
  regular, bold, outline and bold outline, plus thorned stylistic alternates.
  It covers A–Z, 0–9 and `- . : ! ? /`.

## The pages

| # | Page | The dragon | Interaction |
|---|---|---|---|
| 01 | Cover | coiled round the title, tail across the bottom; dives off the bottom as you scroll | click anywhere: it snaps |
| 02 | The eye | a slot opens in the page and a slit eye opens behind it | the wet glint follows the pointer; come close and the lids narrow |
| 03 | Glyph set | rises from the lower right, jaws open at the alphabet | hover or tap a glyph to preview it |
| 04 | Weights | drops in from the top left, claws hanging over four G's (thin to heavy, solid and outline) | hover a G |
| 05 | Styles | climbs out of the dark page through a red needle cross | pick a style: every title switches to it (keyboard too) |
| 06 | Alternates | lunges in from the left and roars at the word | |
| 07 | Liquid | arches over the drop and out past the right edge, one hand reaching down for it | the liquid drop follows the pointer, and the hand follows the drop |

The stage is `position: sticky` inside a taller section. The book plays over
`scrollDistance`, and scrolling back up plays it in reverse. Each page holds
its pose for about a third of its scroll; the arrivals and exits are the quick
parts.

## Usage

```tsx
import DragonTypeSpecimen from "@/components/ui/dragon-type-specimen"

<DragonTypeSpecimen hideScrollbar />                      // DRAKON / TYPEFACE, red and yellow
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
| `background` | `"#de0902"` | Page colour. It also bounces into the dragon's shadow side. |
| `night` | `"#000000"` | Colour of the dark styles page. |
| `ink` | `"#fdc80f"` | Type colour. |
| `dragonColor` | `"#2b2621"` | Skin. Use a hex value: it tints the whole material. |
| `eyeColor` | `"#ff2a1a"` | Eye glow. |
| `defaultStyle` | `"regular"` | `regular`, `bold`, `outline` or `bold-outline`. |
| `height` | `"100svh"` | Pinned stage height. **Must be a definite length.** |
| `scrollDistance` | `"700svh"` | Extra scroll the seven pages play over. |
| `progress` | none | `0..1` to drive it yourself. This turns off the scroll. |
| `hint` | `true` | The "scroll" cue on the cover. |
| `hideScrollbar` | `false` | Hides the page's scrollbar (the window's, or a scrolling parent's) while the book is mounted, and restores it after. Scrolling still works. |
| `className` | `""` | Appended to the root. |

## Notes

- Do not put it inside an element with `overflow: hidden` or `auto`, because
  that breaks `position: sticky`. The root uses `overflow: clip` for this reason.
- The page is laid out on a 1600 × 1000 scene that always fits whole, so no type
  is cut off at any window size. Wider screens show more of the dragon at the
  sides, narrower ones more above and below. On a phone held upright the whole
  page shows as a band across the middle of the screen: it is designed for
  landscape.
- Reduced motion: nothing moves on its own. The dragon appears at rest on each
  page instead of travelling, and it does not breathe, blink, drip or snap.
- Everything is seeded or geometric, so it looks the same on every visit. The
  animation pauses while the component is off screen.
