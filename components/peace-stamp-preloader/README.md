# Peace Stamp Preloader

A loading gate drawn as a postage stamp. A sheet of teal-edged, perforated
paper lands on the page, and the stamp prints itself as the page loads. In the
middle, on a mint disc lit from within, a gold dog-rose grows from a bud. Two
blue hands reach in over the edges of the stamp until their fingertips almost
meet. They are Michelangelo's, from the Creation of Adam. At 100% the light
flares between the fingertips, a postmark cancels the stamp, and the stamp
lifts off the page to reveal whatever it was guarding.

1. **Land.** The sheet drops onto the page with a tilt and settles. The teal
   edge prints, the magenta plate wipes across, then the gold hairlines.
2. **Print.** The load drives everything. The striped rules run out from the
   corners and the diagonal bands draw in toward the medallion. The lettered
   ring turns into place, and the side panels' lettering slides up and down.
   The Victorian scrollwork unfurls in the teal spandrels and the winged
   fleurs open. The ring counts the face value up from `€0,00`.
3. **Grow.** The stem draws itself and the leaves unfurl. A bud appears and
   morphs open, petal by petal, into an engraved dog-rose, and the stamens
   come up in its heart.
4. **Reach.** The left hand slides in from the left edge, the right hand from
   the right. Each swings up from the wrist into its reach as it arrives.
5. **Touch.** At 100% a gold spark flashes between the fingertips and the
   disc brightens.
6. **Cancel.** A rough-edged postmark slams onto the corner with the face
   value and wavy bars. The sheet thumps under it.
7. **Lift.** The stamp peels up and off the page. Underneath is whatever the
   gate was guarding. With `loop`, it lands again and reloads.

The stamp tilts toward the pointer on a spring, the flower sways, and the
hands breathe. Click, or press Enter or Space, while it loads to rush it to
100%. In `loop` mode, click the cancelled stamp to lift it.

```tsx
import PeaceStampPreloader from "@/components/ui/peace-stamp-preloader"

// Looping showcase, nothing else on screen
<PeaceStampPreloader loop />

// A gate, driven by real progress
<PeaceStampPreloader progress={loaded} onComplete={() => setReady(true)}>
  <YourPage />
</PeaceStampPreloader>

// Your own printing
<PeaceStampPreloader
  preset="cobalt"
  word="LUX"
  leftText="FIRST CLASS"
  rightText="REGISTERED"
  cornerText="MAIL"
  year="1968"
  value={0.5}
  currency="$"
  decimal="."
  postmark="RECEIVED"
/>
```

**No dependencies beyond React, and nothing is fetched.** The stamp is
procedural SVG built in the file. The hands are two small images embedded in
the file itself.

- **Frame.** The perforation is a CSS mask on the sheet, so the hands, grain
  and sheen all clip against it.
- **Ornament.** The scrollwork is tapered ribbons wound into logarithmic
  spirals. The lettering sits on arcs.
- **Hands.** These are Adam's and God's hands from Michelangelo's fresco on
  the Sistine Chapel ceiling, c. 1512, which is in the public domain. They
  were cut out of the Wikimedia Commons file "Creation of Adam (Michelangelo)
  Detail.jpg" and stored as greyscale WebP images, about 23KB each, embedded
  as data URIs. A gradient-map filter maps the fresco's light and shade onto
  the palette's four skin tones, so every preset recolours them, and adds a
  little grain. Each hand casts a soft shadow on the stamp.
- **Texture.** Paper grain, ink mottling and the postmark's rough edge are
  SVG filters, painted once.

The frame, the ring, the flower and each hand are separate layers. The ring
turns and the hands slide and swing on the compositor, and only the flower
repaints as it morphs. One `requestAnimationFrame` loop drives everything, writing to the
DOM directly, and it skips any write whose value hasn't changed.

## Props

| Prop | Default | Description |
|---|---|---|
| `children` | — | Revealed once the stamp lifts. `inert` until then. Ignored while `loop` is set. |
| `loop` | `false` | Showcase mode: land, load, cancel, lift, and again. `onComplete` never fires. |
| `progress` | — | Real progress, `0`–`100`. Leave it out to run a simulated load that surges and stalls. The bloom waits for `100`. |
| `durationMs` | `5600` | Length of the simulated load. |
| `word` | `"МИР"` | The word on the ring: across the top with dots between its letters, and down either side. Three or four letters read best. |
| `leftText` | `"PAR AVION"` | Up the left panel. Ten letters or fewer fit. |
| `rightText` | `"POSTE"` | Down the right panel. |
| `cornerText` | `"PAX"` | In two of the diagonal bands. |
| `year` | `"2026"` | In the other two bands, and on the postmark. |
| `value` | `0.68` | Face value. The ring counts up to it with the load. |
| `currency` | `"€"` | Sign before the value. |
| `decimal` | `","` | `","` or `"."`. |
| `postmark` | `"DELIVERED"` | Text round the postmark. `""` for a plain cancellation. |
| `preset` | `"magenta"` | `magenta` (the picture) · `cobalt` (cobalt and coral) · `olive` (olive and rust, sepia hands). |
| `palette` | — | Partial overrides, see below. |
| `tilt` | `6` | Largest tilt toward the pointer, in degrees. `0` holds it flat. |
| `hud` | `true` | The corner read-out and the hint. |
| `label` | `"Loading"` | Accessible name of the progress bar, and the top-left line. |
| `serifFamily` / `monoFamily` | system stacks | Faces for the stamp's type and the read-out. Nothing is fetched. |
| `onComplete` | — | Fired once, after the stamp has lifted. |
| `height` | `"100svh"` | Root height. Always a definite length, never `h-full`. |
| `className` | `""` | Extra root classes. |

### Palette

| Key | Magenta | Used for |
|---|---|---|
| `field` | `#e8287a` | The magenta plate: the field, the ring, the scrollwork. |
| `band` | `#38b8a2` | The teal plate: the perforated edge, the bands, the bars, the spandrels. |
| `cream` | `#f8e7c5` | Lettering, hairlines, and the paper before it prints. |
| `gold` | `#dcae5e` | The gold frame line. |
| `mint` | `#bfe8d8` | Edge of the disc. |
| `disc` | `#ffffff` | Centre of the disc, where the light is. |
| `petal` | `#e8c461` | The flower. |
| `petalDark` | `#94641a` | The engraving, the veins, the stamens, the stem's edge. |
| `leaf` | `#9a8a3a` | The leaves. |
| `skin` | `#3d84ea` | The hands' midtones. |
| `skinDark` | `#143c94` | Their shadows. A darker navy is derived from it for the deepest ones. |
| `skinLight` | `#a9d4ff` | Their lights. |
| `ink` | `#1f2547` | The postmark. |
| `stage` | — | Behind the stamp. Leave out to use the host's `bg-background`. |

## Notes

- The stage uses the host's background and foreground tokens, so the stamp
  sits on a light or dark page as it is. Set `palette.stage` to pin it.
- The default word, lines and value are placeholders in the style of an
  airmail stamp: МИР and PAX both mean peace. Swap in your own.
- `prefers-reduced-motion` has these effects:
  - The landing, the lift and the postmark become fades.
  - The tilt, the sway, the drift and the sheen stop.
  - The ring stops turning.
  - The hands fade in where they stand instead of sliding.
  - The flower still opens with the load.
- The component file is about 130KB, most of it the two embedded hand images.
- The gate is a focusable `role="progressbar"` with its value and a status
  text, and works with Enter and Space.
- All the geometry is exported, so the same drawing can be reused elsewhere.
  That includes `pspPetal`, `pspFlower`, `pspLyre`, `pspSScroll`,
  `pspLeaf` and `pspPerforationPath`.
