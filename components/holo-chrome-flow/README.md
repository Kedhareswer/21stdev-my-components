# Holo Chrome Flow

A full-bleed shader of liquid chrome folding over itself, with a holographic
oil-slick film riding the highlights, dark veins opening between the folds and
a few sparkles caught in them. Move the pointer and the foil tilts under it —
the light swings, the rainbow slides across the folds. Drag to smear the metal,
click to drop a bead of mercury that rings outward. Left alone the light drifts
by itself, so it is never a still.

Background only. Put your content on top through `children` (or stack it
yourself).

Self-contained: **raw WebGL2, no three.js, no CSS file** — React is the only
import. One fragment shader, one triangle, zero buffers.

## Usage

```tsx
import HoloChromeFlow from "@/components/ui/holo-chrome-flow"

<HoloChromeFlow />                                         // full viewport, opal
<HoloChromeFlow preset="noir" height="520px" />            // inside a section
<HoloChromeFlow colors={{ filmA: "#ff3d7f", filmB: "#00e5ff" }} veins={0.8} stretch={3}>
  <YourHero />
</HoloChromeFlow>
```

Do not pass `height="100%"` unless every ancestor up to `<html>` has a definite
height — the canvas fills this box, and without a real length it collapses to
0px.

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | **Must be a definite length.** |
| `preset` | `"opal"` | `opal` · `noir` · `rose-gold` · `glacier` · `aurora` |
| `colors` | — | `{ base, shine, vein, filmA, filmB, filmC }`, any subset, `#rgb` / `#rrggbb`. Overrides the preset. |
| `speed` | `1` | Flow speed. `0` freezes the metal; the pointer stays live. |
| `flow` | `1` | How hard the field folds. `0.5` lazy swells → `1.6` marbled. |
| `scale` | `1` | Pattern zoom. Above 1 = finer, more folds. |
| `stretch` | `2.2` | How much the folds are combed into one direction. `1` is isotropic. |
| `angle` | `35` | Direction of the comb, in degrees. |
| `iridescence` | `1` | Strength of the holographic film. `0` is plain chrome. |
| `ridges` | `1` | The fine poured lines along each fold. `0` is smooth. |
| `veins` | `0.5` | How much of the surface opens into dark seams, 0–1. |
| `sparkle` | `1` | Twinkles, denser in the veins. |
| `tilt` | `1` | How far the pointer tilts the foil. |
| `smear` | `1` | How strongly a moving pointer drags the metal. |
| `grain` | `0.6` | Film grain. `0` is clean. |
| `vignette` | `0.45` | Edge darkening, 0–1. |
| `seed` | `0` | A different pour with the same character. |
| `interactive` | `true` | Pointer tilt, smear and drops. Off, the light wanders by itself. |
| `ripples` | `true` | Click / tap drops a bead of mercury. |
| `maxDpr` | `1.25` | Device-pixel-ratio cap — it is a full-screen shader. |
| `children` | — | Rendered above the metal; pointer events still reach it. |
| `className` | `""` | Appended to the root. |

Every visual prop is a uniform read through a ref, so changing one (a slider, a
theme switch, a colour picker) never rebuilds the GL context.
`HOLO_CHROME_PRESETS` and `hexToRgb` are exported.

## How it works

- **The metal** is fbm warped by fbm warped by fbm — the classic recipe for
  folds that look poured. The plane is combed along `angle` and squeezed by
  `stretch` first, so everything streams one way like the reference pour.
- **Poured lines.** A small sine of the height is added back onto itself, so
  thin ridges run along every contour. Lit, they read as the layered edges of
  metal that set while it was still moving.
- **Chrome.** Finite differences give a normal; the normal reflects a soft
  studio (dim floor, bright sky, a long softbox) plus a warm key and a cool rim.
  Slopes facing away fall into blue-grey shadow, which is most of the depth.
- **Holographic film.** A three-stop palette (`filmA → filmB → filmC`) is walked
  by the viewing angle, the height and the tilt, and laid over the slopes and
  the bright side. Around each hot highlight a faster rainbow fringe splits the
  white the way a hologram does.
- **Tilt.** The pointer swings the lights around the axis instead of raising
  them, so highlights travel while the exposure holds steady — the light never
  turns into a white-out when the pointer reaches a corner.
- **Veins** are a narrow band along a low contour, measured as distance in
  pattern space so a seam keeps its width on steep and shallow folds alike, and
  tapered by a slow noise so they swell and pinch out. Their lips catch a
  hairline of light; sparkles collect in them.

## Notes

- `prefers-reduced-motion` draws **one still frame** — no loop, no drops. The
  tilt still follows the pointer on demand.
- Scrolled off-screen, it stops rendering (IntersectionObserver) and resumes on
  return.
- No WebGL2 falls back to a CSS gradient in the same palette, not a black box.
- A lost GPU context is caught and the scene rebuilt.
- The pointer is read off the component, not `window`, and the host cursor is
  never hidden.
- The scene brings its own palette; it does not follow light/dark tokens. Only
  the playground demo's chrome uses them.

## Demos

- `demo.tsx` — the opal pour, full-bleed.
- `demo-hero.tsx` — a hero with glass-panel copy on top.
- `demo-playground.tsx` — every preset, colour and knob, live.
