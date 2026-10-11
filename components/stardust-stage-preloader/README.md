# Stardust Stage Preloader

A cinematic loading gate in black-and-white stipple. A lone star in a
pixel-art cosmos turns into a moonlit theatre stage, and every dot on screen
moves in that change.

1. **Ignite.** A four-point star burns at the centre of a dithered nebula.
   A dotted orbit fills clockwise as the load climbs, warp lines stream out
   of it faster and faster, and pixel planets hang in the dark. Under the
   star, a `000` counter ticks up over a status line ("Gathering starlight",
   "Charting the orbit"…).
2. **Morph.** At 100% the planets warp out of frame and letterbox bars slide
   in. Every dot then flies along its own arc to a new place. The core folds
   into a stippled moon, the orbit spreads into its halo, the warp lines
   trace a proscenium arch from the left column round to the right, and the
   loose stars settle into the glow on the stage floor.
3. **Reveal.** Stippled clouds rise, curtains unfurl from the rail, and a
   lone figure walks into the moonlight. The wordmark racks from blur into
   focus in the stage's reflection.
4. **Lift.** The camera pushes through the arch and the stage dissolves away
   from whatever it was guarding.

The pointer parts the stardust as it passes, and the dots drift back behind
it. The sky, the nebula, the clouds and the curtains each lean toward the
pointer at their own depth. With no pointer, the camera drifts on its own. A
click, Enter or Space moves on to the next phase. While it's loading, that
rushes the load to 100%.

```tsx
import StardustStagePreloader from "@/components/ui/stardust-stage-preloader"

// Looping showcase, nothing else on screen
<StardustStagePreloader loop />

// Page gate, driven by real progress
<StardustStagePreloader progress={loaded} onComplete={() => {}}>
  <YourPage />
</StardustStagePreloader>

// Your own words and ink
<StardustStagePreloader
  word="Selene"
  caption="A moon in three movements"
  acts={["Tuning the telescope", "Finding the moon", "Dimming the house lights"]}
  palette={{ stage: "#120d08", ink: "#f1dfc0", dim: "#9a8467" }}
  density={0.8}
  rain={false}
/>
```

**No dependencies beyond React, and no assets.** Every texture is painted
procedurally onto canvas once on mount. That covers the starfield, the
Bayer-dithered nebula and planets, and the stippled moon, clouds, curtains
and figure. Each one is seeded, so it comes out the same every time, and
each is painted at the size it's shown, so every dot lands on one device
pixel. The 1,300 to 3,600 morphing dots live on one canvas, drawn by a single
`requestAnimationFrame` loop. Everything else moves with scoped CSS.

## Props

| Prop | Default | Description |
|---|---|---|
| `children` | — | Content revealed once the gate lifts. Ignored while `loop` is set. |
| `loop` | `false` | Cycle ignite → morph → reveal forever. `onComplete` never fires. |
| `progress` | — | Real progress, `0`–`100`. Leave it out to run a simulated load. The star waits for `100`. |
| `durationMs` | `5200` | Length of the simulated load. It surges and stalls like a real one. |
| `word` | `"Nocturne"` | Wordmark set in the stage's reflection. |
| `caption` | `"Act I · The sky takes the stage"` | Line under the wordmark. |
| `acts` | four lines | Status lines under the counter, one per equal slice of the load. `[]` hides them. |
| `palette` | see below | Partial overrides: `{ stage, ink, dim }`. |
| `density` | `1` | Dot count multiplier, `0.3`–`2`. Scales the morphing dots and the stipple. |
| `figure` | `true` | The lone figure on the stage. |
| `rain` | `true` | Fine rain over the stage. |
| `planets` | `true` | Pixel planets around the star while it loads. |
| `counter` | `true` | The `000` counter and status line under the star. |
| `fontFamily` | serif stack | Wordmark face. Nothing is fetched. Pass one the host already loads. |
| `height` | `"100svh"` | Root height. Always a definite length, never `h-full`. |
| `onComplete` | — | Fired once, after the gate has lifted. |
| `className` | `""` | Extra root classes. |

### Palette

| Key | Default | Used for |
|---|---|---|
| `stage` | `#050505` | The night, and the solid backing of every painted shape. |
| `ink` | `#f2f0ea` | Every dot, line, sparkle and letter. |
| `dim` | `#8c8a84` | Status line, caption, and the lower half of the wordmark gradient. |

## Notes

- The stage is always dark. It's a set piece, and it reads the same in light
  and dark hosts.
- Textures are repainted only when the stage changes size by a noticeable
  step, or when `palette` or `density` changes. They aren't repainted on
  every resize event.
- Textures are encoded synchronously. `canvas.toBlob` runs in the browser's
  idle time, and a page this busy never has any, so it never resolves.
- `prefers-reduced-motion` stops the warp, drift, sway, rain, grain and
  twinkle. The dots cross-fade from cosmos to stage instead of flying, and
  the camera doesn't push through at the end.
- Exposes `role="progressbar"` with its value. It's focusable, works with
  Enter and Space, and each status line is announced as the load reaches it.
