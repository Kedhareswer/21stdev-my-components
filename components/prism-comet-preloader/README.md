# Prism Comet Preloader

A cinematic loading gate built like a motion designer's effects stack, with
the load progress as the interpolation slider. Every frame is one WebGL
shader, and each stage is the same light bent into a new shape. Nothing
cross-fades between pictures.

1. **Fractal noise · Optical flare.** Iridescent curtains of ridged noise
   hang from a flare at the top of a faint compositing grid. Blue, violet and
   magenta ribbons run white-hot where they peak, with gold and cyan
   chromatic fringes and sparks drifting down them.
2. **Polar coordinates.** The sheet curls into a fan, then closes into a
   ring. The flare it hung from becomes the bright centre of a bloom.
3. **Sphere · Mesh warp.** The ring spins half a turn and gathers upward into
   a tulip-shaped flame with a bright tip at the bottom.
4. **Radial blur · Wave warp.** The flame tips over into a comet. Its tail
   stretches and ripples as it streams up and to the right.
5. **Final.** A four-point star ignites at the comet's head, and blue speed
   lines stream past.

At 100% the star swoops to the centre, swells, spins and tilts into 3D. It
becomes a star-shaped portal: white-hot inside, with thin-film bands (pink →
violet → cyan) round the rim, set in a dark spiralling membrane with light
rays. The wordmark racks into focus under it. Then the camera pushes through
the portal, and your page is on the other side.

A `000%` counter with one segment per pass sits in the bottom-left corner, and
letterbox bars close in for the ignition.

**Interactive.** While it loads, the pointer is a displacement pass. It drags
a small eddy through the light wherever it goes. Once the portal is lit, the
star tilts toward the pointer in 3D. A click, Enter or Space moves on to the
next phase. While it's loading, that rushes the load to 100%.

```tsx
import PrismCometPreloader from "@/components/ui/prism-comet-preloader"

// Looping showcase, nothing else on screen
<PrismCometPreloader loop />

// Page gate, driven by real progress: the page shows through the portal
<PrismCometPreloader progress={loaded} onComplete={() => {}}>
  <YourPage />
</PrismCometPreloader>

// Your own words and light
<PrismCometPreloader
  word="Solstice"
  caption="Festival of light · Night one"
  palette={{ background: "#070302", blue: "#b3261e", violet: "#ff6a1a", magenta: "#ffb02e", cyan: "#fff1c2", gold: "#ffd36b" }}
  speed={1.4}
  grid={false}
/>
```

**No dependencies beyond React, and no assets.** The light is computed per
pixel. The shader uses fractal value noise that tiles across the sheet, so
the ring closes without a seam. The sheet is mapped through one coordinate
rig: a fan whose opening, apex and turn are eased on the CPU. A shallow fan
with a far apex is the flat sheet. Open it to a full turn around its top edge
and you get polar coordinates. Everything in between is the morph. The
portal is a superellipse star with a swirl and a projective tilt.

## Props

| Prop | Default | Description |
|---|---|---|
| `children` | — | Content revealed through the portal. Ignored while `loop` is set. |
| `loop` | `false` | Cycle forever. The push-through whites out into the next load. `onComplete` never fires. |
| `progress` | — | Real progress, `0`–`100`. Leave it out to run a simulated load. The star waits for `100`. |
| `durationMs` | `6500` | Length of the simulated load. It surges and stalls like a real one. |
| `word` | `"Prisma"` | Wordmark under the portal. |
| `caption` | `"Five passes · One light"` | Line under the wordmark. |
| `passes` | five labels | Pass labels, announced to screen readers as the load reaches each one. |
| `palette` | see below | Partial overrides, as hex. |
| `intensity` | `1` | Brightness of the light, `0.4`–`2`. |
| `speed` | `1` | Speed of the flow, `0`–`3`. `0` freezes the noise but not the load. |
| `quality` | `0.6` | Render scale, `0.35`–`1`. The light is soft, so `0.6` looks the same as `1` at about a third of the cost. |
| `grid` | `true` | The faint compositing grid behind the load. |
| `hud` | `true` | The loading counter. |
| `grain` | `true` | Film grain. |
| `fontFamily` | sans stack | Face for the wordmark and counter. Nothing is fetched. Pass one the host already loads. |
| `height` | `"100svh"` | Root height. Always a definite length, never `h-full`. |
| `onComplete` | — | Fired once, after the camera has passed through the portal. |
| `className` | `""` | Extra root classes. |

### Palette

| Key | Default | Used for |
|---|---|---|
| `background` | `#03030b` | The night. |
| `blue` | `#2c55ff` | Body of the streaks, speed lines, the portal's membrane. |
| `violet` | `#8a3dff` | Mid tone of the streaks, the portal's second band. |
| `magenta` | `#ff3fc8` | Hot tone of the streaks, the star's halo, the portal's first band. |
| `cyan` | `#86e6ff` | Flare tint, cool chromatic fringe, the portal's rim. |
| `gold` | `#ffc35c` | Sparks, warm chromatic fringe. |

Colours go into the shader, so they must be hex (`#rgb` or `#rrggbb`).
Anything else falls back to the default for that key.

## Notes

- The stage is always dark. It's a set piece, and it reads the same in light
  and dark hosts.
- When it renders `children`, the canvas goes transparent inside the star as
  the camera pushes in. The page you pass is mounted the whole time and shows
  through the portal. Nothing in the stylesheet reaches into it, and the
  counter's type and colour live on the gate, not the root.
- The canvas renders at `quality × devicePixelRatio` (capped at 2) and the
  browser scales it up. It stops drawing while off screen or in a hidden tab.
- Without WebGL, a CSS fallback plays the same story: a glow that gathers
  with the progress and a star that turns and swells at 100%.
- `prefers-reduced-motion` freezes the flow, the grain, the pointer eddy and
  the swirl. The stack still follows the progress, because that's
  information, not decoration. The ignition is quick, the portal fades open
  instead of zooming, and the letters fade instead of racking focus.
- Exposes `role="progressbar"` with its value. It's focusable, works with
  Enter and Space, and each pass is announced as the load reaches it.
- A lost WebGL context is rebuilt when the browser restores it.
