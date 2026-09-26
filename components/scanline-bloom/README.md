# Scanline Bloom

A bouquet of lilies and roses printed in red on black paper, the way a cheap
risograph or a dying CRT would do it: ragged horizontal scanlines that thicken
with the light, a stipple dither that takes over toward the bottom, paper
grain, and a thin frame behind it all.

**No dependencies.** React is the only import. Nothing is downloaded: the
flowers are painted procedurally with Canvas 2D from a seed (petals, veins,
freckles, stamens, ruffled rose petals), uploaded as a texture, and one
fullscreen triangle in a plain WebGL1 context does the printing.

## Interaction

| Input | What happens |
|---|---|
| Hover | A loupe (dashed ring) magnifies, arches the scanlines over itself and **flips the print mode** under it: lines become stipple, stipple becomes lines, and the dither boils. |
| Move fast | Rows tear sideways like a slipped signal, in proportion to pointer speed. |
| Click / Enter / Space | **Rebloom**: a new bouquet scans in from the top behind a glowing front. `onBloom` gets the new seed. |

Clicks on links, buttons and inputs among `children` keep their own behaviour and do not rebloom.

## Usage

```tsx
import ScanlineBloom from "@/components/ui/scanline-bloom"

<ScanlineBloom />
<ScanlineBloom seed={42} mode="lines" lineSpacing={6} />
<ScanlineBloom ink="#3d8bff" highlight="#bfe0ff" background="#050a14" />   {/* cyanotype */}
<ScanlineBloom src="/my-photo.jpg" />                                    {/* print your own picture */}
<ScanlineBloom onBloom={(seed) => console.log(seed)}>
  <p className="absolute left-10 top-10 font-mono text-xs text-red-500">Plate Nº 7</p>
</ScanlineBloom>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `src` | none | Print your own image (luminance only). Must be same-origin or serve CORS headers; otherwise the bouquet stays. |
| `seed` | `7` | Which bouquet to paint. Changing it scans the new one in. |
| `ink` | `"#e3161f"` | The ink. |
| `highlight` | `"#ff6a4f"` | What the brightest petals, the loupe ring and the scan fronts push toward. |
| `background` | `"#0b0909"` | The paper. |
| `mode` | `"mixed"` | `"mixed"` (lines on top, stipple toward the bottom through a noisy border), `"lines"`, `"stipple"`. |
| `lineSpacing` | `5` | Scanline pitch, CSS px. |
| `dotSize` | `1.6` | Stipple dot, CSS px. |
| `frame` / `frameInset` / `frameColor` | `true` / `18` / ink | The thin frame. It sits behind the ink, so petals cover it. |
| `lensRadius` | `150` | CSS px. `0` turns the loupe off. |
| `glitch` | `0.3` | Idle row tearing, 0..1. Pointer speed adds to it. |
| `sway` | `1` | How much the flowers breathe, 0..2. |
| `scanSpeed` | `5` | Scanline crawl, CSS px/s. |
| `grain` | `0.5` | Paper grain, 0..1. |
| `vignette` | `0.35` | Corner darkening, 0..1. |
| `interactive` | `true` | Click / Enter / Space reblooms. Off: the picture is `role="img"`. |
| `onBloom` | none | Called with the new seed after each rebloom. |
| `paused` | `false` | Freezes the clock; the pointer still works. |
| `label` | a description | Accessible description of the picture. |
| `height` | `"100svh"` | **Must be a definite length.** |
| `className` | `""` | Appended to the root. |
| `children` | none | Rendered above the print. |

## Notes

- The bouquet layout is aspect-aware (tall boxes get a fourth bloom) and is
  repainted, debounced, when the box changes shape.
- Device pixel ratio is capped at 2, the painting at 1600 px on its long side.
  The loop stops while the tab is hidden; a lost WebGL context is rebuilt.
- Reduced motion: no sway, crawl or tearing; the intro and reblooms cut instead
  of sweeping. The loupe still follows the pointer, one frame per move.
- No WebGL: a CSS scanline-and-glow fallback with the frame.
