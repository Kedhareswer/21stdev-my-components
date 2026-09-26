# Halftone Nebula

A pixel-art night sky printed in halftone dots — crimson gas, needle-spiked
sparkle stars and a dotted planet. Built as a **background**: drop content in as
children and it sits on top.

Move the pointer and it becomes a lamp that parts the gas and swells the dots
under it; the whole sky parallaxes in three depths. Click anywhere to hang a new
sparkle star, which sends a shock ring through the cloud. Leave it alone and the
lamp wanders on its own.

**No dependencies.** Raw WebGL2 in one fragment pass, React is the only import —
no three.js, no textures, no image assets. Every pixel is procedural.

## How it is printed

1. **Gas** — domain-warped fbm plus a curving "river" band, sampled **once per
   pixel cell** so everything snaps to a chunky grid.
2. **Dither** — density is quantised to `levels` steps with a 4×4 Bayer matrix,
   the ordered-dither look of the reference art.
3. **Halftone** — each cell is a flat square of the dim ramp with a round dot of
   the bright ramp on top, radius from density. Thin gas becomes a faint dot
   mesh; thick gas grows the dots until they nearly touch.
4. **Stars** — three hashed layers at different parallax depths, twinkling.
5. **Sparkles** — a pixel-snapped disc core, a white cross in it, 1-CSS-px
   spikes (plus short diagonals on the big ones) and a halo that feeds back into
   the halftone so the dots bloom around them.

## Usage

```tsx
import HalftoneNebula from "@/components/ui/halftone-nebula"

<HalftoneNebula />                                   // full-bleed, crimson
<HalftoneNebula preset="ultraviolet" height="520px" />
<HalftoneNebula params={{ pixel: 4, seed: 99, planet: false }} />

<HalftoneNebula>
  <h1 className="p-10 text-6xl text-white">Lost in the red static.</h1>
  <button className="pointer-events-auto">Enter</button>
</HalftoneNebula>
```

Children sit in a `pointer-events-none` layer so the pointer still reaches the
sky; give interactive elements `pointer-events-auto`. Clicks on links, buttons
and form controls never spawn a star.

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | **Must be a definite length.** The canvas fills this box. |
| `preset` | `"crimson"` | `crimson` \| `ultraviolet` \| `abyssal` \| `solar` \| `phosphor`. |
| `params` | — | `Partial<NebulaParams>` layered over the preset. Live — never restarts WebGL. |
| `interactive` | `true` | Lamp, parallax, click-to-spawn. |
| `touch` | `"scroll"` | `scroll` keeps the page scrollable; `draw` takes the gesture. |
| `maxDpr` | `2` | Device-pixel-ratio cap. |
| `children` | — | Content over the sky. |
| `className` | `""` | Appended to the root. |

## Customising

`NEBULA_DEFAULTS` and `NEBULA_PRESETS` are exported. The ones worth knowing:

| Param | What it does |
|---|---|
| `pixel` | CSS px per cell. `4` is fine-grained, `10` is loud pixel art. |
| `dotMin` / `dotMax` | Dot radius in empty / dense gas (cells). Past ~0.7 dots merge into solid blocks. |
| `levels` | Quantisation steps before dither. |
| `threshold` / `softness` / `density` | How much of the sky is gas. |
| `band`, `bandAngle`, `bandOffset`, `bandWidth` | The bright river of gas and where it runs. |
| `warp`, `scale`, `drift` | Shape, zoom and speed of the gas. |
| `stars`, `twinkle`, `starDrift` | Pixel star density and life. |
| `sparkles`, `seed` | How many sparkle stars, and which sky. The same seed always hangs the same sky. |
| `planet`, `planetX`, `planetY`, `planetRadius` | The halftone planet (position 0..1, y up). |
| `lens`, `lensRadius`, `lensPush`, `parallax` | Pointer feel. |
| `voidColor` … `starColor` | Seven hex colours, dark to bright. Any palette works. |

## Notes

- Needs WebGL2 (no float targets or extensions). Without it the component paints
  a still gradient of the same sky rather than a black rectangle.
- `prefers-reduced-motion`: the clock freezes on a lit frame. Clicks still hang
  stars, fully grown, with no shock ring.
- Pauses when scrolled off-screen or the tab is hidden.
- Sizes from its own box, not the window; pointer coordinates come from the
  canvas rect, so it behaves the same in a card as full-bleed.
- A dropped GPU context rebuilds; every GL object is released on unmount.
- Up to 16 sparkles (the shader's uniform array). Clicks recycle the oldest
  *user* star; the seeded sky is never evicted.
