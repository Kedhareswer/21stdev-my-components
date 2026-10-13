# Galaxy Starfield

A full-bleed hero background: you sit inside a sphere of tens of thousands of
stars, each twinkling on its own clock and flaring into a four-point
diffraction cross at its peak, against a slow violet-and-teal nebula with a
dusty band across the equator. The sky leans toward the pointer, turns by
itself, and can be dragged round like a planetarium dome. On load the camera
warps in from deep space.

Raw WebGL in one React file: no three.js, no textures, no network.

```tsx
import GalaxyStarfield from "@/components/ui/galaxy-starfield"

<GalaxyStarfield />                      // warm ember sky, full viewport
<GalaxyStarfield preset="prism" />      // the neon spectrum
<GalaxyStarfield>{/* your hero content */}</GalaxyStarfield>
```

## Props

| Prop | Default | |
|---|---|---|
| `preset` | `"ember"` | `ember` (warm), `prism` (neon spectrum), `aurora` (teal and green), `ice` (blue-white) |
| `colors` | preset | star colours, any number of hex values |
| `nebula` | preset | `{ base, a, b, band }` hex colours for deep space, the two clouds and the equator band |
| `stars` | `65000` | star count (capped lower on software renderers) |
| `twinkle` | `1` | twinkle speed multiplier |
| `autoRotate` | `0.4` | turns per minute; `0` stops it |
| `interactive` | `true` | drag to orbit (mouse and pen) and lean toward the pointer |
| `zoom` | `false` | wheel zoom; off so the page keeps scrolling |
| `intro` | `true` | warp in from deep space on load |
| `seed` | `7` | reshuffles the stars |
| `height` | `"100svh"` | a definite length |
| `children` | none | content over the sky; its links, buttons and inputs take the pointer |

## Notes

- Touch never orbits, so phones keep scrolling the page.
- Sleeps off-screen and in background tabs. With reduced motion it holds a
  still sky (no warp, no rotation, no twinkle) and still lets you drag.
- The sky shader is held to a pixel budget, and software renderers (21st's
  preview capture, some VMs) get fewer stars, so it stays smooth everywhere.
- Without WebGL it shows a CSS sky in the same colours.
- Converted from a three.js scene (OrbitControls, a shader-sphere nebula and
  additive point sprites) into dependency-free WebGL; the nebula samples 3D
  noise along each view ray, so it has no seam or pinched poles.
