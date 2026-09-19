# Caustic Pool

Shallow water you can stir, lit from above. Drag across it and the wake spreads,
reflects off the walls and interferes with itself; leave it alone and it keeps
moving without you.

**No dependencies.** Raw WebGL2, React is the only import — no three.js, no
animation library, no CSS file.

## Why the light looks right

A wave equation runs on a float texture, ping-ponged each step. The render pass
then treats that height field as a lens, and the bright veins are not painted —
they are **measured**:

```glsl
float jxx = 1.0 - A*hxx, jyy = 1.0 - A*hyy, jxy = -A*hxy;
float det = jxx*jyy - jxy*jxy;     // area compression of the refracted-ray map
float ca  = 1.0 / max(abs(det), floor);
```

That determinant is how much a patch of seabed is squeezed or spread by the
surface above it, so light piles up exactly where the water focuses it. Ripples
crossing produce the lattice for free, which is what a noise texture pretending
to be caustics can never do. Everything else — the sand, the absorption with
depth, two suns, the Fresnel sky — is lit off the same field.

## Usage

```tsx
import CausticPool from "@/components/ui/caustic-pool"

<CausticPool />                                        // full-bleed tidepool
<CausticPool preset="deep-ocean" resolution={512} />   // the hero
<CausticPool preset="ink-bath" height="440px" />       // inside a card
<CausticPool params={{ causticA: 14, veinGain: 0.2 }} />
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | **Must be a definite length.** The canvas fills this box. |
| `preset` | `"tidepool"` | `tidepool` \| `deep-ocean` \| `golden-hour` \| `ink-bath` \| `alien-pool`. |
| `params` | — | `Partial<CausticParams>` layered over the preset. |
| `resolution` | `256` | Simulation grid. `512` is visibly finer full-bleed and costs four times as much. |
| `interactive` | `true` | Pointer stirs the water. |
| `touch` | `"scroll"` | `scroll` keeps the page scrollable and draws on horizontal drags; `draw` takes the gesture, which is right full-bleed and wrong mid-article. |
| `className` | `""` | Appended to the root. |

`CAUSTIC_DEFAULTS` and `CAUSTIC_PRESETS` are exported: a preset is just a
partial overlay, so `{ ...CAUSTIC_PRESETS["ink-bath"], exposure: 2.2 }` is a
legitimate `params`.

There are around seventy parameters — the whole surface of the piece, from
`propagation` and `damping` through the two suns to the film grain. They are
grouped and commented in `CausticParams`.

## It stirs itself

Three things keep the water alive so it is never a dead rectangle:

- **ambient** — a few wandering sources drip at intervals, quieter while you are
  actually touching it (`drivenMult`) and full strength once you go idle.
- **the attract cursor** — after `ghostReturn` seconds of no interaction an
  invisible hand takes over, drawing with the same brush a real pointer uses.
  Its path is a sum of sines whose frequencies share no common multiple, so it
  wanders without ever closing a loop — the giveaway that reads as a screensaver.
- **`prefers-reduced-motion`** — none of the above. One step, one frame, still
  water.

## Notes

- Needs WebGL2 **and** float or half-float render targets; that is the technique,
  not a nicety. Where it is missing the component paints a still gradient of the
  same water rather than a black rectangle.
- The simulation integrates at a fixed `simRate` with up to `maxSub` steps per
  frame. The wave equation is only stable at the rate it was tuned for, so a
  stalled tab catches up in several small steps instead of one enormous one that
  would detonate the pool.
- The canvas measures **its own box**, not the window, and pointer coordinates
  come from its bounding rect — so it behaves the same in a card as full-bleed.
- A dropped GPU context rebuilds; without that the canvas stays black forever.
- Every GL object is released on unmount. Two programs, two textures, two
  framebuffers and a VAO per mount is a fast leak in a router otherwise.
- Cost scales with the canvas, not just the grid: each frame is one step at
  `resolution²` plus one full-screen pass. Several pools on one page means
  several WebGL contexts, and browsers cap those.

## Credit

Ported from a standalone WebGL2 sketch. The port keeps the physics and the
shading intact and changes what a page demands of a component: sizing from the
element, pointer coordinates from the canvas, a reduced-motion path, context-loss
recovery, cleanup on unmount, and the dat.GUI panel replaced by props and
presets.
