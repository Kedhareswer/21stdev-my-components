# Lissajous Orbit Loader

A loader where glowing comets trace parametric figures inside a night-glass orb. Three heads chase each other along a Lissajous figure, a rose curve and a hypotrochoid, and the whole figure eases from one shape into the next every few seconds. Behind them, a faint guide shows the full current curve. Each trail thins and fades towards its tail and blends additively where the comets cross.

Pass `progress` and a gradient ring fills around the orb, with the percentage in a frosted pill. Leave it out for an indeterminate loader. A status line under the heading cycles through your steps with a blur-in.

No dependencies beyond React: it draws on a 2D canvas. Geist and JetBrains Mono (Latin subset) are embedded.

```tsx
import LissajousOrbitLoader from "@/components/ui/lissajous-orbit-loader"

<LissajousOrbitLoader />                                    // indeterminate
<LissajousOrbitLoader progress={0.42} label="Exporting" />  // determinate
```

## Props

| Prop | Default | What it does |
|---|---|---|
| `progress` | – | `0..1` shows the ring and percentage. Leave it undefined for indeterminate. |
| `label` | `"Rendering your scene"` | Heading, also the accessible name. |
| `steps` | five render steps | Lines that cycle every 1.8 s. `[]` hides the line. |
| `size` | `240` | Orb diameter in px. |
| `colors` | violet, cyan, pink | One comet per colour. |
| `hold` | `2.4` | Seconds each figure holds before morphing (the morph takes 1.1 s). |

## Accessibility and performance

The root is a `role="progressbar"`. A determinate loader exposes `aria-valuenow`; an indeterminate one exposes `aria-valuetext` with the current step. The canvas is decorative. With `prefers-reduced-motion`, it draws one still frame and the status line stops animating.

The frame loop never reads layout. Canvas size comes from a `ResizeObserver`, and the loop stops while the tab is hidden. Colours are read from a ref, so passing a new array doesn't restart the animation.
