# Velvet Haze

An out-of-focus light leak on grainy black film: a silver haze high on the
left, violet bleeding in at the top right, a warm ember between them, and two
shadows cutting it — a silk fold that sweeps the light off the bottom of the
frame and a dark mass curling in from the right. Film grain re-rolls at 24 fps
with a little gate weave, so it shivers like projected film rather than
crawling like video noise.

Full-screen by default — just the shader, nothing around it. Built as a
**background**: drop content in as children and it sits on top.

**No dependencies.** Raw WebGL2 in one fragment pass, React is the only import —
no three.js, no textures, no image assets.

## Interaction

- **Move** — the haze gathers under the pointer, a fast gesture smears the silk
  along it, and the shadow from the right is pushed back.
- **Click** — a refractive ring ripples through the haze.
- **Leave it** — the light drifts on its own, so the silk keeps breathing.

## Usage

```tsx
import VelvetHaze from "@/components/ui/velvet-haze"

<VelvetHaze />                                        // full screen, 100svh
<VelvetHaze height="640px" />
<VelvetHaze preset="rose" params={{ grain: 0.12 }} />

<VelvetHaze>
  <h1 className="m-auto text-7xl text-white">trnspr</h1>
  <a className="pointer-events-auto" href="#contact">Get in touch</a>
</VelvetHaze>
```

Children sit in a `pointer-events-none` layer so the pointer still reaches the
haze; give interactive elements `pointer-events-auto`. Clicks on links, buttons
and form controls never send a ring.

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | **Must be a definite length.** The canvas fills this box. |
| `preset` | `"velvet"` | `velvet` \| `chrome` \| `rose` \| `aqua` \| `ember`. |
| `params` | — | `Partial<HazeParams>` layered over the preset. Live — never restarts WebGL. |
| `interactive` | `true` | Pointer drag and ring on click. |
| `maxDpr` | `2` | Device-pixel-ratio cap. |
| `children` | — | Content over the haze. |
| `className` | `""` | Appended to the root. |

## Customising

`HAZE_DEFAULTS` and `HAZE_PRESETS` are exported. The ones worth knowing:

| Param | What it does |
|---|---|
| `lightX`, `lightY` | Where the silver haze is brightest (0..1, y down). |
| `exposure`, `bloom`, `ember` | Strength of the silver, the violet, and the warm band. |
| `shadow` | Strength of the dark mass from the right. `0` is all light. |
| `fold`, `softness` | Height of the silk fold, and how soft its edge is (low = fabric, high = fog). |
| `flow`, `speed` | How far and how fast the folds drift. |
| `grain`, `grainSize`, `grainFps` | Grain amount, cell size in CSS px, and re-roll rate. `grainFps: 0` freezes it. |
| `jitter` | Gate weave per grain frame, in CSS px. `0` holds the frame dead still. |
| `vignette` | Darkens toward the bottom right, away from the light. |
| `lens`, `drag`, `reach` | Pointer feel: gather, smear, radius. |
| `inkColor` … `silverColor` | Six hex colours, dark to bright. |

## Notes

- Needs WebGL2 (no extensions). Without it the component paints a still
  gradient of the same light rather than a black rectangle.
- `prefers-reduced-motion`: the clock and the grain freeze on one frame, and
  clicks send no ring.
- Pauses when scrolled off-screen or the tab is hidden.
- Sizes from its own box, not the window; pointer coordinates come from the
  canvas rect, so it behaves the same in a card as full-bleed.
- A dropped GPU context rebuilds; every GL object is released on unmount.
