# Holo Sticker Logo

A die-cut holographic foil sticker with its corner peeling up, as a living logo
mark. It opens on a print-shop preloader, stamps itself in, and then morphs
between marks while it catches the light.

**No dependencies.** Raw WebGL2 for the sheet, a 2D canvas for the ink mask,
procedural SVG for the press marks. React is the only import and nothing is
fetched.

## The sequence

1. **Pressing.** Registration marks, a dashed die line turning slowly, the
   mark as a wireframe, and the cut ring closing as the load climbs.
2. **Stamped.** At 100% the foil is stamped from the centre outward behind a
   white-hot edge. The ink draws on stroke by stroke and the corner curls up.
   Then a band of light crosses the sheet.
3. **Live.** The sticker leans toward the pointer. Click, tap or Enter morphs
   the mark: the sheet dips, spins back and swings, and the foil runs a full
   turn of the spectrum. Grab the curled corner and peel it. A tap flicks it,
   and a hard peel swaps the mark.

## Why it looks like a sticker and not a gradient

**The peel is a real cylinder curl, per pixel.** Past the fold the sheet rolls
round a cylinder of radius `r` and lays back flat over the face. For every
pixel the shader works out which part of the sheet lands there: the face, the
underside of the roll, the top of the roll (the back of the sticker), or the
laid-back flap. It inverts exactly `landing()`:

```
d = s                 (s ≤ 0, still stuck down)
d = r·sin(s / r)      (round the roll)
d = πr − s            (laid back over the face)
```

The fold for a drag is solved so the corner lands exactly under the pointer:
`fold = (q·d + c·d − πr) / 2`.

**The ink rides the sheet.** The mark is painted into a mask and sampled at
each pixel's *source* point, so it wraps round the curl with the foil. It
also ghosts through the back of the flap, mirrored.

**The rainbow follows the view, not a clock.** The foil's hue swings around
your `tint` as a function of the viewing direction, so green foil goes cyan,
violet and gold but always reads as green foil.

## Usage

```tsx
import HoloStickerLogo from "@/components/ui/holo-sticker-logo"

<HoloStickerLogo />
<HoloStickerLogo tone="studio" tint="#8b6bff" peelAngle={132} />
<HoloStickerLogo glyphs={["play", "bars"]} cycle={0} skipIntro />
<HoloStickerLogo progress={loaded} onLoaded={() => setReady(true)} />
```

### Your own mark

```tsx
// Strokes morph point for point: cubic Béziers in a 100 × 100 box, y down,
// [x0, y0, c1x, c1y, c2x, c2y, x1, y1, width].
const ARROW = { name: "Arrow", strokes: [[20, 50, 40, 50, 60, 50, 80, 50, 11], [60, 30, 67, 37, 73, 43, 80, 50, 11], [60, 70, 67, 63, 73, 57, 80, 50, 11]] }

// A filled path you already have cross-dissolves instead (even-odd, same box).
const BOLT = { name: "Bolt", d: "M57 12 L27 55 H47 L41 88 L73 42 H53 Z" }

<HoloStickerLogo glyphs={[ARROW, BOLT, "smile"]} />
```

`line()` and `arc()` are exported to build strokes. A stroke whose ends meet
is a dot.

## Props

| Prop | Default | Notes |
|---|---|---|
| `glyphs` | all six presets | `waves` `play` `bars` `broadcast` `spark` `smile`, or your own. |
| `index` / `defaultIndex` / `onIndexChange` | — / `0` / — | Controlled or not. |
| `cycle` | `5200` | Auto-morph every n ms. `0` holds the mark. Pauses while the pointer is over the stage. |
| `tone` | `"night"` | `night` black stage, `studio` paper, `clear` none (for a header). |
| `tint` | `#2bd67b` | The colour the foil leans to. |
| `ink` | `#120a1c` | The mark's ink. Translucent, so the foil glows through. |
| `foil` | `1` | Rainbow strength, 0–1. |
| `rim` | `0.075` | Pearl rim width as a share of the radius. |
| `peel` | `0.3` | How far the corner is lifted at rest. `0` lies flat. |
| `peelAngle` | `48` | Which way it peels, degrees (0 right, 90 top). |
| `tilt` | `14` | Largest pointer lean, degrees. |
| `size` | `min(64cqmin, 440px)` | Sticker diameter. |
| `height` | `100svh` | Stage height. Must be a definite length. |
| `progress` | — | Real load, 0–100. Leave out to simulate over `durationMs` (`2600`). |
| `skipIntro` | `false` | Open on the finished sticker. |
| `onLoaded` | — | Fired once the press sequence is over. |
| `label` | `"Holo sticker"` | Accessible name. |
| `caption` | `true` | The mark name, index and hint under the sticker. |

## Notes

- **Accessibility.** The sticker is a real button with a label that names the
  current mark. The arrow keys step through marks. The caption is `aria-live`,
  and the load is a `progressbar`.
- **Reduced motion.** The press resolves at once, and the idle drift,
  auto-cycle, light sweeps and glitter stop. The pointer lean still works,
  because that motion is the reader's own.
- **No WebGL2?** It falls back to a conic-gradient disc with the mark on it
  rather than an empty box. A lost GPU context rebuilds itself.
- **Cost.** Rendering pauses off-screen. The ink mask is re-uploaded only while
  a stroke is moving. Every GL object is released on unmount.
- **Sizing.** It is sized by `height` and container query units, never by a
  percentage height, which would collapse on a page with no height chain.
