# Singularity Horizon

A black hole with a live accretion disk, cycling through named states — nominal,
turbulent, collapsing — with a relativistic HUD over it. Drag to orbit.

Self-contained: **raw WebGL2, no three.js, no GSAP, no CSS file** — React is the
only import. One instanced draw puts all 5000 streaks on the GPU; the orbital
motion, Doppler shift and turbulence warp happen in the vertex shader, so the
CPU only moves a camera and eases five uniforms.

## Usage

```tsx
import SingularityHorizon from "@/components/ui/singularity-horizon"

<SingularityHorizon />                              // full viewport
<SingularityHorizon height="420px" hud={false} />   // inside a card
```

Do not pass `height="100%"` unless every ancestor up to `<html>` has a definite
height — the canvas fills this box, and without a real length it collapses to
0px while the HUD still paints. That failure reads as "the text shows up but the
scene doesn't".

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | **Must be a definite length.** |
| `states` | 3 states | What it cycles through. Pass one to hold a single look. |
| `interval` | `10000` | Milliseconds per state. `0` holds the first one. |
| `hud` | `true` | Title, status pill and corner readouts. |
| `mass` / `lensing` / `radiation` | cosmetic strings | The static HUD readouts. |
| `particles` | `5000` | Streaks in the disk. Drop it on low-end targets. |
| `interactive` | `true` | Drag to orbit. Never captures scroll. |
| `className` | `""` | Appended to the root. |

Each entry in `states` is `{ title, status, accent, velocity, morph,
compression, intensity, orbit, spin, camDistance, camHeight }`. Import
`DEFAULT_SINGULARITY_STATES` and spread one to tweak a single field:

```tsx
import SingularityHorizon, { DEFAULT_SINGULARITY_STATES } from "@/components/ui/singularity-horizon"

<SingularityHorizon
  states={[{ ...DEFAULT_SINGULARITY_STATES[0], camDistance: 58, spin: 0.14 }]}
/>
```

The horizon sits at radius 4 and the disk spans 5–45, so `camDistance` below
about 20 puts the camera inside the disk.

## Notes

- `prefers-reduced-motion` draws **one still frame** and stops — no RAF loop, no
  state cycling. Dragging still redraws on demand.
- No WebGL2 (old Safari, blocklisted GPU, some headless capture) falls back to a
  CSS gradient still of the same subject rather than an empty black box.
- A lost GPU context is caught and the scene rebuilt; without that the canvas
  stays black forever.
- Portrait viewports dolly the camera out instead of widening the lens, so a
  phone gets the whole disk rather than a cropped middle.
- The scene supplies its own palette — it is a black hole, it does not follow the
  host's light/dark tokens. Only the demo wrapper uses them.
- Cost is one instanced draw plus two quads per frame. `particles={2600}` halves
  the vertex work if you are stacking several on a page.

## Credit

Inspired by [VoXelo](https://codepen.io/VoXelo)'s black hole pen — the state
config, the Doppler-shifted disk and the HUD readouts come from there.

Rebuilt rather than ported: three.js and GSAP are gone (raw WebGL2, one
instanced draw, an exponential lerp in place of the timelines), the camera and
the canvas size come off the container instead of `window`, and the page-level
`body` / `#overlay` CSS is scoped to the component so installing it cannot
restyle the host app.
