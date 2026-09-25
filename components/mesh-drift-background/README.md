# Mesh Drift Background

An animated WebGL background: soft colour blobs drifting under film grain, with
a spotlight that follows the cursor. Put it behind a hero or a whole page;
children render on top.

**No dependencies.** React is the only import. One fullscreen triangle in a
plain WebGL1 context, running the "Mesh drift" recipe from the 21st.dev Shader
Builder unchanged.

## Usage

```tsx
import MeshDriftBackground from "@/components/ui/mesh-drift-background"

<MeshDriftBackground>
  <h1>Anything on top</h1>
</MeshDriftBackground>

<MeshDriftBackground colors={["#0b1026", "#3b2bd9", "#f0587a", "#ffc46b"]} cursor="swirl" />
```

## Props

Defaults are the recipe: colours `#101010 → #3A3A3A`, speed 40, zoom 100,
intensity 59, warp 0, contrast 34, brightness 40, saturation 50, hue 360°,
vignette 0, grain 45, spotlight cursor at strength 100 / radius 34. Props take
the shader's own units.

| Prop | Default | Notes |
|---|---|---|
| `colors` | `["#101010", "#3A3A3A"]` | Hex, 1 to 8. One blob per colour. |
| `speed` | `0.86` | Clock multiplier. |
| `scale` | `2.5` | Zoom; higher packs the blobs tighter. |
| `intensity` | `0.59` | How far the blobs wander. |
| `warp` / `detail` | `0` / `2.4` | Domain warp and its noise frequency. |
| `contrast` | `0.91` | |
| `brightness` | `-0.1` | Added to every channel. |
| `saturation` | `1` | |
| `hue` | `6.28` | Radians. |
| `vignette` | `0` | 0..1. |
| `blur` | `0.016` | 5-tap blur radius; 0 turns it off. |
| `grain` | `0.16` | |
| `drift` | `0.03` | Slow wander of the whole field. |
| `seed` / `rotation` | `1` / `0` | |
| `oklab` | `false` | Perceptual colour mixing. |
| `cursor` | `"spotlight"` | `off`, `push`, `repel`, `swirl`, `ripple`, `spotlight`. |
| `cursorStrength` / `cursorRadius` | `1` / `0.35` | Radius is in units of the short side. |
| `paused` | `false` | Freezes the clock; the cursor still works. |
| `height` | `"100svh"` | **Must be a definite length.** |
| `className` | `""` | Appended to the root. |

## Notes

- The pointer is tracked on the window, so the effect works under content that
  sits on top of the canvas.
- Device pixel ratio is capped at 2. The loop stops while the tab is hidden.
- Reduced motion: the clock stops and a still frame is drawn; the spotlight
  still follows the pointer, one frame per move.
- No WebGL: a CSS gradient of the same palette.
