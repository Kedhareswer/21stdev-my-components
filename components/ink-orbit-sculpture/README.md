# Ink Orbit Sculpture

A generative 3D ink sculpture — stippled loops and bowed bridges caging a glass
sphere that refracts what's behind it. It drifts on its own, leans toward the
pointer, drags and flicks on both axes, and a click reforges it: every grain
morphs into the next seed's shape.

Lifted out of `ink-orbit-saas-template`'s hero and made standalone.

**No dependencies.** One seeded point cloud projected by hand onto a 2D canvas —
no WebGL, no textures, no assets. React is the only import.

## Usage

```tsx
import InkOrbitSculpture from "@/components/ui/ink-orbit-sculpture"

<InkOrbitSculpture />                                   // follows the OS theme
<InkOrbitSculpture theme="dark" height="560px" />
<InkOrbitSculpture ink="#2b1d14" background="#f3ece1" autoReforge={7} />
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | **Must be a definite length.** The canvas fills this box. |
| `theme` | `"auto"` | `light` \| `dark` \| `auto` (prefers-color-scheme). |
| `ink` / `background` | — | 6-digit hex; override the theme. |
| `seed` | `4211` | Starting shape. Change it and the sculpture morphs. |
| `onReforge` | — | `(seed) => void` on click, Enter/Space or the timer. |
| `autoReforge` | `0` | Reforge every N seconds (min 2); `0` = never. Paused off-screen and mid-drag. |
| `spin` | `0.16` | Idle spin, radians per second. |
| `density` | `1` | Grain multiplier, 0.25–1.5. Lower for small or low-power slots. |
| `glass` | `true` | The refracting sphere at the core. |
| `hud` | `true` | Corner readouts: live compass heading, `label`, `hint`, seed. |
| `label` / `hint` | `"FORGE · 3D"` / `"Drag to rotate · Click to reforge"` | HUD text. |
| `interactive` | `true` | Drag, tilt, keyboard and click-to-reforge. |
| `maxDpr` | `2` | Device-pixel-ratio cap. |

## What's new over the template's version

- Drag tilts as well as turns, with inertia on both axes; pitch springs home.
- The compass heading in the HUD is live.
- A shock ring runs out from the core on every reforge.
- `autoReforge`, `density`, `glass`, `hud`, `interactive` and theme/colour props.
- Keyboard: ←/→ spin, ↑/↓ tilt, Enter/Space reforge.

## Notes

- `prefers-reduced-motion` stops the spin, the morph and the ring; the shape
  still answers drags.
- Drawing pauses when the canvas is off-screen.
- Touch keeps the page scrollable vertically (`touch-action: pan-y`).
