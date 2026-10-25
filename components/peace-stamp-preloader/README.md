# Peace Stamp Preloader

A loading gate drawn as a postage stamp. A sheet of perforated paper lands on
the page, the teal and magenta plates print one after the other, and the gold
hairlines and the guilloche border draw themselves in. In the middle, on a
mint disc lit from within, a golden hellebore grows out of a bud as the page
loads. Two engraved blue hands reach in from the edges of the stamp: one open
and pointing, the other pinching the stem. At 100% the fingertip glints, a
postmark cancels the stamp, and the stamp lifts off the page to reveal
whatever it was guarding.

1. **Land.** The sheet drops onto the page with a tilt and settles. The teal
   plate wipes across, then the magenta plate, then the gold.
2. **Print.** The load drives everything: the guilloche ribbons draw round the
   border, the side lines and the word's big arcs come in, the stem draws and
   the leaves unfurl, the bud appears and morphs open petal by petal, and the
   ring counts the face value up from `€0,00`.
3. **Reach.** The open hand slides in from the left, its index finger
   straightening as it arrives; the pinching hand slides in from the right and
   closes its thumb and finger on the stem.
4. **Touch.** At 100% a gold spark flashes at the fingertip and the disc's
   light brightens.
5. **Cancel.** A postmark slams onto the corner, rough-edged, with the face
   value and the wavy bars of a cancellation. The sheet thumps under it.
6. **Lift.** The stamp peels up and off the page. Underneath is whatever the
   gate was guarding. With `loop`, it lands again and reloads.

The stamp tilts toward the pointer on a spring, and its shadow, hands and
flower sit at different depths. Click or press Enter or Space while it loads
to rush it to 100%. In `loop` mode, click the cancelled stamp to lift it.

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
  word="UNI"
  leftText="FIRST CLASS"
  rightText="REGISTERED"
  year="1968"
  value={0.5}
  currency="$"
  decimal="."
  postmark="RECEIVED"
/>
```

**No dependencies beyond React, and no assets.** Every mark is procedural SVG
built in the file: the perforation (a CSS mask the hands, grain and sheen all
clip against), the guilloche, the ring type on arcs, the flower with its
morphing petals, the two hands and the postmark. The hands are a palm shape
plus articulated fingers: each finger is a chain of joints posed by forward
kinematics, drawn as a round-capped capsule with a dark rim, a highlight down
its lit side, a crease at every joint, a nail and a cast shadow, with
engraver's hatching fading in from the shadow side. Paper grain and the
postmark's rough ink come from SVG filters painted once, outside the animated
tree. One `requestAnimationFrame` loop drives the load, the morphs and the
tilt, and writes straight to the DOM; React only sees the phase changes.

## Props

| Prop | Default | Description |
|---|---|---|
| `children` | — | Revealed once the stamp lifts. `inert` until then. Ignored while `loop` is set. |
| `loop` | `false` | Showcase mode: land, load, cancel, lift, and again. `onComplete` never fires. |
| `progress` | — | Real progress, `0`–`100`. Leave it out to run a simulated load that surges and stalls. The bloom waits for `100`. |
| `durationMs` | `5200` | Length of the simulated load. |
| `word` | `"МИР"` | The word on the ring (spaced with dots) and on the big arcs either side. Three or four letters read best. |
| `leftText` | `"PAR AVION"` | Up the left edge. |
| `rightText` | `"POSTAGE"` | Down the right edge. |
| `year` | `"2026"` | In the four corner tabs and on the postmark. |
| `value` | `0.68` | Face value. The ring counts up to it with the load. |
| `currency` | `"€"` | Sign before the value. |
| `decimal` | `","` | `","` or `"."`. |
| `postmark` | `"DELIVERED"` | Text round the postmark. `""` for a plain cancellation. |
| `preset` | `"magenta"` | `magenta` (the picture) · `cobalt` (cobalt and coral) · `olive` (olive and rust, sepia hands). |
| `palette` | — | Partial overrides, see below. |
| `tilt` | `7` | Largest tilt toward the pointer, in degrees. `0` holds it flat. |
| `hud` | `true` | The corner read-out and the hint. |
| `label` | `"Loading"` | Accessible name of the progress bar, and the top-left line. |
| `serifFamily` / `monoFamily` | system stacks | Faces for the stamp's type and the read-out. Nothing is fetched. |
| `onComplete` | — | Fired once, after the stamp has lifted. |
| `height` | `"100svh"` | Root height. Always a definite length, never `h-full`. |
| `className` | `""` | Extra root classes. |

### Palette

| Key | Magenta | Used for |
|---|---|---|
| `paper` | `#f5f0e4` | The sheet. |
| `field` | `#e4247c` | The magenta plate: the field and the inner ring. |
| `band` | `#41b3a1` | The teal plate: the border, the side letters, the outer ring. |
| `gold` | `#e0b35c` | Hairlines, dots and the guilloche's second ribbon. |
| `mint` | `#bfe9d9` | Edge of the disc. |
| `disc` | `#ffffff` | Centre of the disc, where the light is. |
| `petal` | `#e6bd52` | The flower. |
| `petalDark` | `#a8741f` | Veins, stamens, and the engraved lines on the leaves. |
| `leaf` | `#8a9a3a` | Stem and leaves. |
| `skin` | `#3f82df` | The hands. |
| `skinDark` | `#1b3f94` | Their shadow side, rims, creases and hatching. |
| `skinLight` | `#b9d7fb` | Their highlights and nails. |
| `ink` | `#1d2744` | The postmark. |
| `stage` | — | Behind the stamp. Leave out to use the host's `bg-background`. |

## Notes

- The stage uses the host's background and foreground tokens, so the stamp
  sits on a light or dark page as it is. Set `palette.stage` to pin it.
- The default word, lines and value are placeholders in the style of an
  airmail stamp. Swap in your own.
- `prefers-reduced-motion` turns the landing, the lift and the postmark into
  fades, stops the tilt, the drift and the sheen, and fades the hands in
  where they stand instead of sliding them. The flower still opens with the
  load.
- The gate is a focusable `role="progressbar"` with its value and a status
  text, and works with Enter and Space.
- All the geometry is exported (`pspPetal`, `pspFlower`, `pspLeaf`,
  `pspHandOpen`, `pspHandPinch`, `pspFingerMarks`, `pspGuilloche`,
  `pspPerforationPath`…) so the same drawing can be reused elsewhere.
