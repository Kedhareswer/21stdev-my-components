# Sunlit Cutting Mat

An animated WebGL background: a green self-healing cutting mat on a desk by a window. Sunlight falls across it
through a slatted blind and past foliage outside: soft, straight diagonal bands
broken up by blurred leaf shadows, drifting slowly. The light is blocked, not
refracted, so nothing ripples.

**No dependencies.** Raw WebGL2, React is the only import.

## How it works

- The mat's ink (grid, bold every-five grid, 45° guide, ruler ticks and figures)
  is drawn with the 2D canvas API at device resolution, once per resize, and
  uploaded as a texture. So the lines and numbers stay crisp.
- The fragment shader lights it: cool skylight in the shade, warm sun in the
  gaps, a slightly translucent vinyl that glows yellower where it's lit, grain
  and mottling on the surface, and a little bloom around the white ink.
- Slat edges soften unevenly along their length (the penumbra widens with
  distance), and a second, slower term keeps the bands from reading as stripes.

## Usage

```tsx
import SunlitCuttingMat from "@/components/ui/sunlit-cutting-mat"

<SunlitCuttingMat />                       // full-bleed background

<SunlitCuttingMat>                         // with content centred on top
  <h1 className="text-4xl font-medium text-white">Your headline</h1>
</SunlitCuttingMat>

<SunlitCuttingMat color="#1f3a8a" sunColor="#ffe2b8" intensity={1.3} height="480px" />
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `children` | none | Centred over the mat. |
| `color` | `"#0c7f55"` | Mat colour, hex. |
| `sunColor` | `"#fff0cf"` | Sunlight colour, hex. |
| `intensity` | `1` | 0 is overcast, ~1.6 is harsh noon. |
| `speed` | `1` | 0 freezes the light. |
| `unit` | `32` | Grid square in CSS px. Stretched slightly so whole squares fit. |
| `height` | `"100svh"` | **Must be a definite length.** |
| `className` | `""` | Appended to the root. |

Reduced motion paints a single still frame. Without WebGL2 it falls back to a
flat CSS grid in the mat colour.
