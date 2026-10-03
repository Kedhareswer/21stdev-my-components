# Anodized Ink

A full-bleed shader background: crimson ink suspended in black, lit like
anodized metal. Move the pointer to stir it, click to drop ink that rings
outward. Left alone, the light drifts on its own so it is never a still.

Background only — no text, no cards, no custom cursor. Put your content on top
through `children` (or stack it yourself).

Self-contained: **raw WebGL2, no three.js, no CSS file** — React is the only
import. One fragment shader, one triangle, zero buffers.

## Usage

```tsx
import AnodizedInk from "@/components/ui/anodized-ink"

<AnodizedInk />                                   // full viewport, crimson
<AnodizedInk preset="cobalt" height="480px" />    // inside a section
<AnodizedInk colors={{ ink: "#ff5a00" }} turbulence={1.4} scale={1.6}>
  <YourHero />
</AnodizedInk>
```

Do not pass `height="100%"` unless every ancestor up to `<html>` has a definite
height — the canvas fills this box, and without a real length it collapses to
0px.

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | **Must be a definite length.** |
| `preset` | `"crimson"` | `crimson` · `cobalt` · `venom` · `aurum` · `orchid` |
| `colors` | — | `{ deep, ink, sheen }`, any subset, `#rgb` / `#rrggbb`. Overrides the preset. |
| `speed` | `1` | Flow speed. `0` freezes the ink; the pointer stays live. |
| `turbulence` | `1` | How hard the field folds. `0.4` calm bands → `1.6` marbled. |
| `scale` | `1` | Pattern zoom. Above 1 = finer, more bands. |
| `sheen` | `1` | Metallic glints + the anodized thin-film tint. |
| `grain` | `1` | Film grain. `0` is clean. |
| `glow` | `1` | The light that follows the pointer. |
| `swirl` | `1` | How strongly the pointer twists the ink (scales with pointer speed). |
| `vignette` | `0.6` | Edge darkening, 0–1. |
| `interactive` | `true` | Pointer light, swirl and drops. Off, the light wanders by itself. |
| `ripples` | `true` | Click / tap drops ink. |
| `maxDpr` | `1.5` | Device-pixel-ratio cap — it is a full-screen shader. |
| `children` | — | Rendered above the ink; pointer events still reach it. |
| `className` | `""` | Appended to the root. |

Every visual prop is a uniform read through a ref, so changing one (a slider, a
theme switch) never rebuilds the GL context. `ANODIZED_INK_PRESETS` and
`hexToRgb` are exported.

## How it works

- The ink is an iterated sine warp — the "suspension" banding of the original —
  roughened by a slow fbm drift so it never visibly tiles.
- The same field is read as a height map. Finite differences give a normal, so a
  key light (swung toward the pointer) glints off the crests and a thin-film
  term tints the slopes the way an oxide layer does on anodized aluminium.
- The pointer twists the field around itself; drops are a damped ring that
  pushes the field radially as it passes. Up to six at once.
- Grain is re-rolled per frame, and a 1/255 dither keeps the blacks from
  banding.

## Notes

- `prefers-reduced-motion` draws **one still frame** — no loop, no drops. The
  pointer light still follows on demand.
- Scrolled off-screen, it stops rendering (IntersectionObserver) and resumes on
  return.
- No WebGL2 falls back to a CSS gradient in the same palette, not a black box.
- A lost GPU context is caught and the scene rebuilt.
- The pointer is read off the component, not `window`, and the host cursor is
  never hidden.
- The scene brings its own palette; it does not follow light/dark tokens. Only
  the playground demo's chrome uses them.

## Credit

Background of the "SIGILLIAM // Anodized Ink Suspension" page, rebuilt without
three.js: WebGL2 full-screen triangle, heightfield lighting, thin-film sheen,
pointer swirl and ink drops added.
