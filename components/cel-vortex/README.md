# Cel Vortex

A hand-inked warp tunnel — the impact frame from an old cel cartoon. A blown-out
white core, and around it rings of rounded ink dashes spiralling inward over a
flat field of colour. Drawn "on twos", with the linework boiling between
drawings the way a hand-traced cel does.

**No dependencies.** Raw WebGL2, React is the only import — no three.js, no
textures, no image assets, no CSS file.

## How it is drawn

One full-screen fragment pass. Space is unrolled into **log-polar coordinates**,
so every ring has the same shape at every radius and the tunnel is
self-similar — the rings flow into the core forever without ever running out.

Each ring is cut into cells; each cell holds at most one tapered capsule. Its
length, width and whether it is inked at all are driven by a single density
that falls off from the core:

- **near the middle** the dashes fatten past their ring and stretch past their
  neighbours until they merge into solid paper, and only blue nicks survive;
- **out at the rim** they thin into drips and specks.

Every ring turns on its own gear, so neighbouring rings shear past each other
and the swirl never looks like a rotating bitmap.

## Usage

```tsx
import CelVortex from "@/components/ui/cel-vortex"

<CelVortex />                                       // full-bleed cobalt
<CelVortex preset="sumi" height="440px" />          // inside a card
<CelVortex params={{ fps: 0, twist: 1.2 }} />       // smooth, tighter spiral
<CelVortex>
  <h1 className="text-[#2f6fd6]">Into the blue.</h1> // sits on the white core
</CelVortex>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | **Must be a definite length.** The canvas fills this box. |
| `preset` | `"cobalt"` | `cobalt` \| `sumi` \| `tangerine` \| `bubblegum` \| `abyss` \| `matcha`. |
| `params` | — | `Partial<VortexParams>` layered over the preset. Changing it never restarts WebGL. |
| `interactive` | `true` | Pointer steers the eye; press surges; click sends a shock ring. |
| `touch` | `"scroll"` | `scroll` keeps the page scrollable; `draw` takes the gesture. |
| `maxDpr` | `2` | Device-pixel-ratio cap. |
| `children` | — | Laid over the vortex. Pointer events pass through, except on links, buttons and form controls. |
| `className` | `""` | Appended to the root. |

`VORTEX_DEFAULTS` and `VORTEX_PRESETS` are exported. A preset is a partial
overlay, so `{ ...VORTEX_PRESETS.sumi, inkColor: "#3a0d0d" }` is a legitimate
`params`.

### The knobs worth knowing

| Param | What it does |
|---|---|
| `inkColor` / `paperColor` | The two tones. Swap them for a dark hole on a pale page (`abyss`). |
| `coreRadius`, `spread` | How big the white core is, and how far the ink reaches past it. |
| `rings`, `segments` | Density of the grid: rings per e-fold of radius, dashes per ring. |
| `twist` | Spiral, in radians per e-fold. `0` is concentric; negative turns the other way. |
| `lenMin`/`lenMax`, `widthMin`/`widthMax`, `taper` | Dash shape. `taper: 1` is a plain capsule; lower drags a thin tail. |
| `inflow`, `spin` | Rings per second into the core; radians per second of turn. |
| `fps` | Drawings per second. `12` is "on twos", `8` is choppier, `0` is smooth. |
| `boil` | How much each new drawing shifts the linework (only when `fps > 0`). |
| `follow`, `surgeBoost`, `surgeOpen`, `pulseSpeed` | Interaction strength. |
| `halo`, `vignette`, `grain` | Post. |

## Interaction

- **Move** — the eye of the vortex leans toward the pointer (`follow`). Leave it
  alone and it drifts on its own lazy orbit, so it is never a dead frame.
- **Press and hold** — surge: spin and inflow multiply by `surgeBoost` and the
  core blows open by `surgeOpen`. Release and it settles.
- **Click** — a shock ring of ink rolls outward from the core.
- **Keyboard** — the vortex is focusable; Space or Enter is the same press.

## Notes

- **`prefers-reduced-motion`** — one drawing, no loop, no surge, no shock rings.
  Changing presets still repaints that drawing.
- Needs WebGL2. Without it the component paints a still sunburst of the same
  two colours rather than a blank box.
- The canvas measures **its own box**, not the window, and pointer coordinates
  come from its bounding rect — it behaves the same in a card as full-bleed.
- The loop pauses when the vortex is off-screen or the tab is hidden, and a
  stalled tab resumes where it left off instead of jumping.
- A dropped GPU context rebuilds; every GL object is released on unmount.
- Phases wrap at periods the shader shares (256 rings, 20π of spin, gears in
  whole tenths), so an all-day kiosk never loses float precision or jumps.
- Text over the core reads best in `inkColor`; text over the rim wants a pill
  of `inkColor` behind it, as in the demo.
