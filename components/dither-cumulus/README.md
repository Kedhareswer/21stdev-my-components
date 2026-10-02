# Dither Cumulus

A sky of pixel-art cumulus clouds, printed with an ordered (Bayer) dither in
six colours: cream billows over a deep navy night, with a dithered moon that is
also the light. Built as a **background**: drop content in as children and it
sits on top.

- **Hover** to move the moon. The clouds are relit from wherever it is: billows
  facing it go white, the far sides drop into grey-blue shade, and thin edges
  facing it get a silver lining.
- **Drag** to scrub the sky. The three cloud decks move in parallax, and when you
  let go they coast to a stop.
- **Click** to blow a gust. A ring pushes the clouds outward and puffs them up.
- Leave it alone and the wind keeps blowing while the moon wanders across the
  top of the sky.

**No dependencies.** It is raw WebGL2 in one fragment pass, and React is the
only import. There are no textures, no image assets and no three.js. Every
pixel is procedural.

## How it is printed

1. **Cell grid**: the shader draws one texel per cell, and the canvas is scaled
   up with `image-rendering: pixelated`. The pixels stay crisp, and the GPU only
   pays for the cells it draws. A cell is `pixel` CSS px wide.
2. **Billows**: each cloud is a heightfield. A union of hemispheres at three
   sizes forms the cauliflower bumps. It rides on a slow fbm "mass" that
   decides where cloud exists at all, and grows and dissolves over time.
3. **Light**: the domes are real hemispheres, so their gradient is a real
   surface normal. Each cell is lit by the moon, shadowed by any taller billow
   between it and the moon (a 4-step march), and rimmed where it is thin and
   faces the light.
4. **Depth**: three decks are drawn far to near. The far ones are smaller,
   slower and fade toward the sky colour.
5. **Dither**: everything becomes one tone per cell. A 2×2, 4×4 or 8×8 Bayer
   threshold then picks between two neighbouring palette colours, which gives
   the checkerboard fringe at every cloud edge.

## Usage

```tsx
import DitherCumulus from "@/components/ui/dither-cumulus"

<DitherCumulus />                                     // full-bleed, nocturne
<DitherCumulus preset="daybreak" height="520px" />
<DitherCumulus params={{ pixel: 4, dither: 8, coverage: 0.3, seed: 42 }} />

<DitherCumulus>
  <h1 className="p-10 text-6xl text-white">Somewhere above the weather.</h1>
  <button className="pointer-events-auto">Take off</button>
</DitherCumulus>
```

Children sit in a `pointer-events-none` layer, so the pointer still reaches the
sky. Give interactive elements `pointer-events-auto`. Pressing links, buttons
or form controls never starts a drag or a gust.

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | **Must be a definite length.** The canvas fills this box. |
| `preset` | `"nocturne"` | `nocturne` \| `daybreak` \| `ember` \| `lilac` \| `storm` \| `gameboy`. |
| `params` | — | `Partial<CumulusParams>` layered over the preset. Changes apply live, without restarting WebGL. |
| `interactive` | `true` | Hover light, drag to scrub, click to gust. |
| `touch` | `"scroll"` | `scroll` keeps vertical page scrolling (horizontal drags still scrub); `draw` takes every gesture. |
| `children` | — | Content over the sky. |
| `className` | `""` | Appended to the root. |

## Customising

`CUMULUS_DEFAULTS` and `CUMULUS_PRESETS` are exported. The ones worth knowing:

| Param | What it does |
|---|---|
| `pixel` | CSS px per cell. `2` is fine, `3` is the default, and `6`+ is loud pixel art. |
| `dither` | Bayer matrix: `0` (hard posterise), `2`, `4` or `8`. |
| `coverage` | How much of the sky is cloud. `0.25` is fair weather, `0.75` is overcast. |
| `scale`, `billow`, `layers` | Cloud size, how lumpy the billows are, and how many decks (1–3). |
| `edge` | Width of the dithered fringe at a cloud's edge. |
| `wind`, `windAngle`, `morph` | Drift speed and heading, and how fast the clouds reshape. |
| `sunElevation`, `relief`, `shadow`, `ambient`, `rim` | Lighting. Low elevation is dramatic. |
| `shadeTone`, `skyLow`, `skyHigh` | Where shade and sky sit on the palette (0..1). |
| `orb`, `glow` | Moon radius (0 hides it) and its dithered halo. |
| `haze`, `parallax`, `gust`, `friction` | Depth fade, pointer parallax, gust strength, and how long a fling coasts. |
| `seed` | Which sky. The same seed always grows the same clouds. |
| `nightColor` … `cloudColor` | Six hex colours, dark to bright. The dither steps between neighbours, so keep them ordered by lightness. |

## Notes

- Needs WebGL2 (no float targets, no extensions). Without it, the component
  paints a still gradient in the same palette instead of a blank box.
- `prefers-reduced-motion`: the clock and wind stop, and so do gusts and
  flings. Hovering still moves the light and dragging still scrubs, painted on
  demand.
- Pauses when scrolled off-screen or when the tab is hidden.
- Sizes from its own box, not the window. Very large boxes get coarser cells
  instead of an oversized buffer, with a budget of 900k cells.
- If the GPU context is dropped, it rebuilds. Every GL object is released on
  unmount.
