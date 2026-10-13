# Guilloché Enamel

An engine-turned silver plate under translucent enamel, the way the dial of a
fine watch is made, as a full-bleed background. A snailed spiral centre, a ring
of rose-engine waves and a field of sunburst rays, split by two polished beads.
The pointer is the lamp: move it and the light runs through the cuts; press and
hold to bring it down low and rake it across them. On load the rose engine cuts
the pattern into a mirror blank, from the centre out.

Background only. Put your content on top through `children`; with the default
`align="right"` the left side is quiet sunburst satin that takes copy well.

Self-contained: **raw WebGL2, no three.js, no CSS file**. React is the only
import. One fragment shader, one triangle, no textures: every groove is
computed per pixel.

## Usage

```tsx
import GuillocheEnamel from "@/components/ui/guilloche-enamel"

<GuillocheEnamel />                                    // full viewport, cobalt flinqué
<GuillocheEnamel preset="salmon" height="560px" />     // bare salmon-gilt plate in a section
<GuillocheEnamel colors={{ enamel: "#7a1f2b" }} depth={1.3} align="center">
  <YourHero />
</GuillocheEnamel>
```

Do not pass `height="100%"` unless every ancestor up to `<html>` has a definite
height. The canvas fills this box, and without a real length it collapses to
0px.

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | **Must be a definite length.** |
| `preset` | `"cobalt"` | `cobalt` · `forest` (enamel over silver) · `salmon` · `argent` (bare metal under clear lacquer) |
| `colors` | — | `{ enamel, metal }`, either, `#rgb` / `#rrggbb`. White enamel is a clear lacquer. |
| `align` | `"right"` | Where the rosette sits: `left` · `center` · `right`. Phones always centre it. |
| `scale` | `1` | Size of the rosette zones. The groove pitch stays the same. |
| `depth` | `1` | Enamel thickness. `0` is bare metal, `1.6` deep and inky. |
| `light` | `1` | Lamp brightness. |
| `vignette` | `0.55` | Edge darkening, 0 to 1. |
| `intro` | `true` | Engine-turn the pattern into a mirror blank on mount (2.1 s). |
| `interactive` | `true` | Pointer moves the lamp, press lowers it. Off, the lamp drifts on its own. |
| `maxDpr` | `1.5` | Device-pixel-ratio cap. The shader supersamples 4×, so this is plenty. |
| `children` | — | Rendered above the plate. |
| `className` | `""` | Appended to the root. |

Visual props are read through a ref, so changing one (a finish picker, a theme
switch) never rebuilds the GL context. `GUILLOCHE_PRESETS`, `hexToRgb` and
`hexToLinear` are exported.

## How it works

- Each zone is a groove family written as a phase function: a one-start spiral
  (colimaçon), concentric rings pushed in and out by a 36-lobe rosette cam, and
  900 straight rays. The cutter is round-nosed, so the cross-section of every
  groove is a scallop whose slope runs straight from wall to wall; the slope
  and the groove direction give a normal and a tangent at every pixel.
- Metal is lit with a Ward anisotropic highlight aligned to the tool marks, so
  the light streaks across the cuts the way it does on a real dial, plus a dark
  studio (a diffuser panel, a strip light, a warm bounce) blurred along the
  same direction. Polished parts (the beads, the uncut blank) mirror the lamp's
  strip softbox instead.
- The enamel is a filter whose thickness is an exponent on its colour: it
  pools darker in the cuts and thins over the beads. Its fired surface carries
  its own faint reflection of the softbox, with a little orange peel.
- Grooves finer than the pixel grid fade into the satin sheen they average to,
  and the frame is 4× supersampled, so it does not moiré. Groove pitch is held
  in CSS pixels, so a short section shows the same cuts as a full screen.

## Notes

- `prefers-reduced-motion`: no intro, no drift, one still frame of the finished
  plate. The lamp still follows the pointer on demand.
- On touch the page scrolls normally; the lamp follows a finger that is down.
- Scrolled off-screen, it stops rendering and resumes on return.
- No WebGL2 falls back to a CSS still in the same finish. A lost GPU context is
  caught and the scene rebuilt.
- The pointer is read off the component, not `window`, and the cursor is never
  hidden.
- The plate brings its own palette; it does not follow light/dark tokens.
