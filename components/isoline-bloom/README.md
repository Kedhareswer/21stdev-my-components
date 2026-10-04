# Isoline Bloom

A living, lobed shape drawn only by its contour lines — neon hairlines flowing
outward from an indigo core, violet on one side, magenta through the middle,
ember red on the other. Move over it and the lines bulge around your pointer
and the whole figure leans toward you; move fast and the rings pump outward;
click or tap and a shock pulse runs through every line.

**No dependencies.** Raw WebGL2 in one fragment pass; React is the only import.
No textures, no image assets, no CSS file.

## How it's drawn

The shape is a field, not geometry: a radius bent by three angular harmonics
(the lobes, a slower wobble, a fine ripple), twisted with distance so outer
rings lag the inner ones, and domain-warped by slow fbm so no line is machined.
The isolines are slices of that field, and their distance is measured in
**screen pixels** with `fwidth`, so every line stays a crisp `lineWidth` px
hairline with a `glow` px bloom at any size and any device-pixel ratio.

## Usage

```tsx
import IsolineBloom from "@/components/ui/isoline-bloom"

<IsolineBloom />                                     // full-bleed ultraviolet
<IsolineBloom preset="solar-flare" height="520px" /> // inside a section
<IsolineBloom params={{ lobes: 5, rings: 18, flow: -0.3 }} />
<IsolineBloom>
  <h1 className="m-auto text-white">Overlay content</h1>
</IsolineBloom>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | **Must be a definite length.** The canvas fills this box. |
| `preset` | `"ultraviolet"` | `ultraviolet` \| `solar-flare` \| `abyss` \| `aurora` \| `ghost`. |
| `params` | — | `Partial<IsolineParams>` layered over the preset. Changes apply live, without restarting WebGL. |
| `interactive` | `true` | Pointer lenses the lines; click sends a pulse. |
| `touch` | `"scroll"` | `scroll` keeps the page scrollable on touch; `draw` takes the gesture. |
| `maxDpr` | `2` | Device-pixel-ratio cap. |
| `children` | — | Overlay. Pointer events pass through unless a child sets `pointer-events-auto`; clicks on links and buttons never fire a pulse. |
| `className` | `""` | Appended to the root. |

`ISOLINE_DEFAULTS` and `ISOLINE_PRESETS` are exported; a preset is just a
partial overlay, so `{ ...ISOLINE_PRESETS.abyss, rings: 20 }` is a valid `params`.

### The knobs (`IsolineParams`)

- **Shape** — `scale`, `centerX`/`centerY`, `lobes`, `lobeDepth`, `wobble`,
  `twist`, `warp`, `morph`, `spin`.
- **Lines** — `rings`, `lineWidth`, `glow`, `glowGain`, `flow` (negative pulls
  inward), `falloff`, `hollow`.
- **Colour** — `backgroundColor`, `coreColor`, `leftColor`, `midColor`,
  `rightColor`, `hotColor` (6-digit hex), `hueAngle`, `hueDrift`, `heat`,
  `coreGlow`, `exposure`.
- **Pointer** — `pull`, `lens`, `lensRadius`, `lensGlow`, `energy`,
  `pulseSpeed`, `pulseGain`.
- **Post** — `speed`, `vignette`, `grain`.

The `studio` demo has sliders for the main ones and prints the matching JSX.

## Notes

- With no hand on it, an invisible lens wanders the field on incommensurate
  sines, so it never sits dead and never visibly loops.
- **`prefers-reduced-motion`** freezes every clock on one composed frame; the
  pointer and pulses are off.
- The loop pauses when the canvas is off-screen or the tab is hidden.
- Rates are integrated, so tuning `flow`, `spin` or `morph` live never makes
  the figure jump.
- No WebGL2: a still CSS picture of the same rings is painted instead of a
  black box. A dropped GPU context rebuilds itself.
- The canvas measures its own box, not the window, and every GL object is
  released on unmount.
