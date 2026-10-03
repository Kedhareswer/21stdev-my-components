# Spotlight Laser Preloader

A stage-light loading gate with no on-screen UI. It plays out in two acts.

1. **Light.** A single spotlight hangs over a black room. Its cone falls to a
   faint pool on the floor. It hums, flickers like a dying tube, and goes out.
2. **Laser.** In the dark, the dead lamp re-ignites red. A beam drops from it
   and writes the name across the wall stroke by stroke, throwing sparks that
   skip off the floor and a curl of smoke. The line is white-hot where the beam
   lands and cools behind it to a red neon glow, which spills onto the floor.

The name holds for a moment. Then the gate fades onto whatever it was guarding.
In `loop` mode the name fades instead, and the lamp strikes back on to go again.

**Interactive.** Moving the pointer over the written name re-heats the strokes
it touches, flaring them white-hot and shaking loose a few sparks. Before the
blackout, the spotlight leans slightly toward the pointer. A tap, click, Enter or
Space skips to the next beat: light → blackout → laser, and once the laser is
running, it writes 5× faster.

There are no controls, labels or counters on screen. Everything is set in code.

```tsx
import SpotlightLaserPreloader from "@/components/ui/spotlight-laser-preloader"

// Looping showcase, nothing else on screen
<SpotlightLaserPreloader loop />

// Your own name and colour
<SpotlightLaserPreloader
  name="ARIA"
  durationMs={2800}
  palette={{ laser: "#22ff88", hot: "#eafff2" }}
/>

// Page gate, driven by real progress
<SpotlightLaserPreloader name="KEDHAR" progress={loaded} onComplete={() => {}}>
  <YourPage />
</SpotlightLaserPreloader>
```

**No dependencies beyond React.** The name is drawn with a built-in
single-stroke vector alphabet, so the laser traces real pen strokes rather than
font outlines, and no font is ever fetched. The light is scoped CSS gradients.
The beam, trail, sparks and smoke share one `<canvas>` and one
`requestAnimationFrame` loop.

## Props

| Prop | Default | Description |
|---|---|---|
| `name` | `"KEDHAR"` | What the laser writes. Lowercase is upper-cased. Other characters become spaces. A long name breaks at a space onto two lines on narrow screens. |
| `children` | — | Content revealed when the gate fades. Ignored while `loop` is set. |
| `loop` | `false` | Light → flicker → laser → fade, forever. `onComplete` never fires. |
| `progress` | — | Real progress, `0`–`100`. The laser writes up to that share of the name and waits for `100`. Leave it out to write at a steady pace. |
| `durationMs` | `3600` | How long the laser takes to write the whole name. |
| `sparks` | `true` | Sparks and smoke off the beam. |
| `interactive` | `true` | Pointer re-heats the strokes and leans the spotlight. |
| `palette` | see below | Partial overrides, hex colours: `{ background, light, laser, hot }`. |
| `height` | `"100svh"` | Root height: a definite length, never a percentage. |
| `onComplete` | — | Fired once, after the gate has faded. |
| `className` | `""` | Extra root class names. |

| Palette key | Default | Used for |
|---|---|---|
| `background` | `#000000` | the room |
| `light` | `#ffffff` | the lamp, its cone and the floor pool |
| `laser` | `#ff1f2a` | the beam, the emitter and the settled glow of the name |
| `hot` | `#ffe6cc` | the white-hot burn at the beam, the neon core, the sparks |

## Characters

The alphabet covers A–Z, 0–9, space and `- . ! ? / '`. The strokes run in the
order a hand would draw them, which is the order the laser burns them.

## Timeline

| Beat | Length |
|---|---|
| Light on | 1.4s (1.6s relight on later loops) |
| Flicker out | 1.8s |
| Blackout, emitter warms | 0.8s |
| Laser writes | `durationMs`, or until `progress` reaches 100 |
| Hold | 2s |
| Gate fades / name fades (loop) | 0.9s / 1.2s |

## Install safety

- Explicit `height`, never `h-full`.
- Every rule in the scoped `<style>` block is `.slp-` prefixed. Canvas
  `max-width` is reset against Tailwind Preflight.
- The canvas is DPR-aware (capped at 2×) and is rebuilt by a `ResizeObserver`.
  What is already written stays written across a resize.
- `prefers-reduced-motion: reduce` turns off the flicker (the light fades
  instead), the beam, sparks, smoke, buzz, grain drift and pointer effects. The
  name still appears stroke by stroke as the load runs.
- The gate is a focusable `role="progressbar"` with `aria-valuenow` and a polite
  live region.
