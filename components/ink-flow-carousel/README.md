# Ink Flow Carousel

An image carousel where every slide is wet paint. Move over it and the picture
stirs like ink in water, then settles back. Change slides and the next one
pours in as ink: a jet from the edge, or a drop where you clicked, curling into
vortices as it spreads.

```tsx
import InkFlowCarousel from "@/components/ui/ink-flow-carousel"

<InkFlowCarousel items={items} />                        // full-bleed hero
<InkFlowCarousel items={items} autoplay={4000} />        // with a timer
<InkFlowCarousel items={items} height="560px" />         // inside a section
<InkFlowCarousel items={items} stir={0} />               // pours only, no hover stirring
```

```ts
type InkFlowItem = { src: string; title?: string; caption?: string; alt?: string }
```

**No dependencies beyond React.** Raw WebGL2, one file, no CSS file, no Tailwind.

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | — | Required. `src` must be CORS-enabled, same-origin, or a `data:` URL. |
| `height` | `"100svh"` | Total height, rail included. **Must be a definite length.** |
| `autoplay` | `0` | Milliseconds between pours. `0` is off. |
| `duration` | `1800` | Milliseconds a pour takes to cover the stage. |
| `stir` | `1` | How hard the pointer stirs the paint. `0` turns stirring off. |
| `loop` | `true` | Wrap past the ends. |
| `rail` | `true` | Caption rail: counter, title, caption, controls. |
| `index` / `defaultIndex` / `onIndexChange` | — | Controlled or uncontrolled. |
| `className` | `""` | Appended to the root. |

## Interaction

- **Hover** ripples the paint gently. **Drag** stirs it like a brush, 4.5× harder.
- **Click or tap** drops the next slide's ink right where it lands: a burst, then a spreading puddle.
- **Next / previous**, the arrow keys and autoplay pour it in as a jet from that side's edge.

## How it works

A stable-fluids simulation on the GPU: vorticity confinement, a pressure
projection and semi-Lagrangian advection, on half-float render targets.

The trick is **what** it moves. It doesn't advect coloured dye. It advects a
**coordinate map**, so every pixel remembers where its paint came from and the
image itself gets smeared. Relaxing that map back toward where each pixel
belongs is what makes the paint settle. A second field carries the incoming
slide's ink, and the image switches wherever that field crosses its halfway
line, so the edge takes whatever shape the fluid gave it.

The pour has three parts. First a jet, or an 8-way burst for a click. Then a
hard-edged disc that grows toward the farthest corner, with a rim that wobbles
differently on every pour. Last, eddies seeded along that rim, so the flow
tears the edge into fingers instead of letting it spread as a circle.

## Things it took to look like ink

| Before | After | Why |
|---|---|---|
| Gaussian bloom, blended across 0.32–0.68 of the ink field | Hard-edged growing disc, blended across 0.45–0.55 | The gaussian made the ink field a shallow ramp, so the pour read as a blurry radial wipe with a dark smudge |
| Coordinate map in 16-bit float | 32-bit where it can be rendered and filtered | It stores positions. At 16 bits a coordinate near 1.0 resolves to about 1.6 texels of a 3200px image, and the rounding compounds every frame into frayed, speckled edges |
| Mip level taken from the smeared coordinate | `textureGrad` with the undistorted coordinate's derivatives | Where the paint tore, the mip level jumped between neighbouring pixels and made blocky patches of blur |
| Displacement relaxed at a single rate | Plus a small viscosity on the displacement field | Grid-scale speckle relaxed as slowly as the broad swirls and left letters frayed for seconds; paint damps fine detail faster than broad motion |
| A "wet sheen" from the coordinate map's gradient | Removed | It amplified precision noise into white haze across flat colour |

## It stops when it's still, and adapts when it can't keep up

- **At rest** it draws **0 frames**. After the last stir or pour it keeps simulating for 3.4s, until under 1% of the distortion is left, then snaps flat and stops. The test fails if that cut-off comes too early.
- **A frame-time watchdog** watches the first busy frames. If the device can't keep up (a software renderer, an old phone), it switches once to a lighter simulation: a smaller grid, 8 pressure iterations instead of 20, and 1× pixel density. Measured: a software renderer went from about 3fps to **18fps**; an Intel UHD integrated GPU stayed on full quality at **147fps**.
- **Pours follow the clock**, not the frame count, so a slow device still lands one on time instead of in slow motion.

## Autoplay

The countdown ring on the Next button and a hidden clock share one duration
and one pause state, the same pattern as Paper Curl Carousel. Resting the
pointer on the stage doesn't pause it: on a full-bleed hero the pointer is
always there. The caption rail, focus, a hidden tab or scrolling it out of view
does pause it. Any press, key or button stops rotation for good. It's off under
`prefers-reduced-motion`.

## Reduced motion

No stirring and no fluid. A slide change is a 240ms cross-fade through the same
ink field.

## Install safety

- The root takes an explicit `height`, never a percentage.
- All styles live in one scoped `<style>` (`.ifc-*`) using only the five tokens in `dev/styles.css`.
- Without WebGL2 or half-float render targets, it cross-fades plain images instead of showing a black rectangle. A lost context is rebuilt when it's restored.
- Every shader opens with `#version 300 es` on its first line; a leading newline fails the compile. No GLSL ES 3.00 reserved words are used as identifiers. The test checks both.
- The demo paints its five posters at runtime, so it makes no network requests. 21st's capture sandbox refuses them, and a demo that makes one publishes with no video.
