# Meridian Mist

A grainy cobalt mesh gradient under a drafting overlay: sky blue catching the
top-left corner, a royal bloom in the middle, navy pooling into the bottom-left
and slate grey everywhere the light doesn't reach. On top sit hairline guides
(two columns, a few rows, and a pair of large overlapping circles), with fine
grain printed over all of it.

Full-screen by default, just the shader with nothing around it. Built as a
**background**: drop content in as children and it sits on top.

**No dependencies.** Raw WebGL2 in one fragment pass, React is the only import:
no three.js, no textures, no image assets.

## Interaction

- **Move.** A dashed crosshair follows the pointer with a live `x × y` readout.
  It **snaps** to any guide it comes near, landing on intersections and onto
  circle outlines, and the guide it caught lights up (`◆` in the readout). The
  royal bloom leans toward the pointer and the circles drift with it for depth.
- **Click.** A ring drops from the crosshair and expands through the mist,
  refracting it as it goes.
- **Leave it.** The mesh keeps breathing on slow fbm and the bloom drifts home.

## Usage

```tsx
import MeridianMist from "@/components/ui/meridian-mist"

<MeridianMist />                                         // full screen, 100svh
<MeridianMist height="640px" />
<MeridianMist preset="dusk" params={{ grain: 0.08 }} />
<MeridianMist params={{ columns: [0.25, 0.5, 0.75], rows: [0.5], circles: 1 }} />
<MeridianMist crosshair={false} />                       // keep the bloom, drop the tool

<MeridianMist>
  <h1 className="mt-auto p-10 text-7xl font-light text-white">Drawn on the grid.</h1>
  <a className="pointer-events-auto" href="#contact">Get in touch</a>
</MeridianMist>
```

Children sit in a `pointer-events-none` layer so the pointer still reaches the
mist; give interactive elements `pointer-events-auto`. Clicks on links, buttons
and form controls never drop a ring.

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | **Must be a definite length.** The canvas fills this box. |
| `preset` | `"cobalt"` | `cobalt` \| `dusk` \| `glacier` \| `sage` \| `graphite`. |
| `params` | none | `Partial<MistParams>` layered over the preset. Live, never restarts WebGL. |
| `interactive` | `true` | Bloom follows the pointer, guides glint, click drops a ring. |
| `crosshair` | `true` | The snapping crosshair and its coordinate readout. |
| `maxDpr` | `2` | Device-pixel-ratio cap. |
| `children` | none | Content over the mist. |
| `className` | `""` | Appended to the root. |

## Customising

`MIST_DEFAULTS` and `MIST_PRESETS` are exported. The ones worth knowing:

| Param | What it does |
|---|---|
| `columns`, `rows` | Guide positions as fractions of width / height, up to 8 each. `[]` hides them. |
| `circles`, `circleRadius`, `circleGap` | 0–3 circles stacked along the long side; radius as a fraction of the short side; centre spacing in radii. |
| `lineOpacity`, `lineWidth`, `lineColor` | Guide strength at rest, stroke in CSS px, and colour. |
| `glowX`, `glowY`, `bloom` | Where the royal bloom sits (0..1, y down) and how big it is. |
| `depth`, `haze` | Navy pooling into the bottom-left; sky corners and periwinkle tint. |
| `flow`, `speed` | How far and how fast the mesh breathes. |
| `grain`, `grainSize`, `grainFps` | Grain amount, cell size in CSS px, and re-roll rate. `grainFps: 0` prints it still. |
| `lens`, `glint`, `reach`, `snap` | Pointer feel: bloom pull, guide brightening, radius, snap distance in px (`0` = no snapping). |
| `inkColor` … `mistColor` | Seven hex colours, deepest navy to palest slate. |

## Notes

- Needs WebGL2 (no extensions). Without it the component paints a still
  gradient of the same sheet, with its column and row guides, rather than a
  flat box.
- `prefers-reduced-motion`: the mesh and grain freeze on one frame and clicks
  drop no ring. The crosshair still follows the pointer, without easing.
- Pauses when scrolled off-screen or the tab is hidden.
- Sizes from its own box, not the window; guides are drawn in CSS pixels, so
  they stay hairline-crisp at any size or DPR.
- A dropped GPU context rebuilds; every GL object is released on unmount.
