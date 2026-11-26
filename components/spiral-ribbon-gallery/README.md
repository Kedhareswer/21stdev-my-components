# spiral-ribbon-gallery

A ribbon of photos wound into a helix that turns slowly in the dark. On load it starts as a
crumpled clump, spins fast and unfurls into the spiral. Drag to turn it. The photo under the
pointer ripples like cloth: the wave spreads out from the pointer, warps the picture and
catches a raking light, then settles when you move on. As the section scrolls away the camera
moves in close. Left alone, a ripple runs across the front photo every few seconds.

## Props

| Prop | Default | Notes |
|---|---|---|
| `images` | nine generated portraits | `{ src, alt? }[]`, landscape 4:3 works best. 15 panels; photos repeat, never side by side. |
| `spin` | `2.2` | Turns per minute at rest. |
| `autoPlay` | `true` | The occasional unattended ripple. |
| `height` | `"100svh"` | Stage height. A definite length. |
| `className`, `style` | – | |

## Notes

- Uses `three` (declared in the root `package.json`). Each panel is a 20 × 8 grid rebuilt
  every frame from one function (`ribbonPoint`), which is what lets the ribbon unfurl and
  ripple; there are no precomputed animations.
- Images load from `https://kedhar-components.pages.dev/spiral-ribbon-gallery/`; pass your
  own `images` in production (they must allow CORS for WebGL).
- The stage carries its own near-black background in light and dark.
- `prefers-reduced-motion`: the spiral appears already unfurled and still; no spin, no
  ripples; the camera follows scroll directly.
