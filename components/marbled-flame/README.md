# Marbled Flame

A wall of fire painted like marbled ink on raw canvas. The licks at its edge
sway sideways while the base barely moves, loose red ribbons tear away into the
dark, and embers drift up and off. Drag through it to smear the paint after
your hand; click to make it flare. Left alone, it flares by itself.

**No dependencies.** Raw WebGL (2 where available, 1 otherwise), React is the
only import — no three.js, no animation library, no CSS file.

## How it is drawn

One full-screen fragment pass. The fire is a single signed field — a tilted,
bowed front bent by three levels of domain-warped noise — and everything is
read off it:

- **the rim** — the saturated `flame` colour right at the zero crossing,
  scorched to `deep` just outside it;
- **the heat** — `flame → blush → glow → core` as the field climbs toward the
  hot corner;
- **the veins** — level lines of a second warp folded through the mid-heat,
  ringed in red;
- **the ribbons** — level lines of a third warp, kept only near the front and
  broken up, so they read as paint torn off rather than contour lines;
- **the canvas** — a per-pixel grain dithers the edge into sand, and a woven
  texture shows through the dark.

The noise is worked in the front's own frame and stretched along it
(`stretch`), which is why the paint streams in long licks instead of round
blots.

**The sway** is a sum of three sines displacing the domain sideways, weighted
by distance from the mass: the tips swing, the core holds still.

## Usage

```tsx
import MarbledFlame from "@/components/ui/marbled-flame"

<MarbledFlame />                                     // full-bleed, vermilion
<MarbledFlame preset="azure" height="440px" />       // inside a card
<MarbledFlame params={{ sway: 0.09, swaySpeed: 1.6, reach: 0.15 }} />
<MarbledFlame params={{ flame: "#ff3b00", core: "#fff4d6" }} />

<MarbledFlame>
  <h1 className="p-10 text-6xl text-white">Burn slow.</h1>
</MarbledFlame>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | **Must be a definite length.** The canvas fills this box. |
| `preset` | `"vermilion"` | `vermilion` \| `azure` \| `solar` \| `phantom` \| `verdigris`. |
| `params` | — | `Partial<FlameParams>` layered over the preset. Retuning never rebuilds WebGL. |
| `interactive` | `true` | Drag smears, click flares, the fire leans toward the pointer. |
| `touch` | `"scroll"` | `scroll` keeps the page scrollable; `draw` takes the gesture (right full-bleed, wrong mid-article). |
| `children` | — | Laid over the fire. The layer is `pointer-events-none` so the canvas keeps the pointer; give buttons `pointer-events-auto`. |
| `className` | `""` | Appended to the root. |
| `aria-label` | — | Describes the region. |

`FLAME_DEFAULTS` and `FLAME_PRESETS` are exported; a preset is a partial
overlay, so `{ ...FLAME_PRESETS.solar, sway: 0.1 }` is a legitimate `params`.

### The knobs that change its character most

| Param | Default | What it does |
|---|---|---|
| `background` … `ember` | vermilion palette | Nine hex colours: the dark, its lift, the scorched rim, the edge, three heat steps, veins, flecks. |
| `angle` | `-68` | Direction the fire comes from, in degrees. `-68` is lower right, `-110` lower left. |
| `reach` | `-0.08` | How far the mass reaches into the frame. |
| `curve` | `0.34` | Bows the front into a bank. `0` is a straight wall. |
| `sway` / `swaySpeed` | `0.05` / `0.9` | Sideways swing of the tips, and its tempo. |
| `lean` | `0.12` | How far the fire leans toward the pointer. |
| `flow` | `0.09` | Speed of the boil underneath the sway. |
| `stretch` | `2.4` | How long the licks stream along the front. |
| `turbulence` | `1.15` | How hard the noise folds the front. |
| `tendrils` / `veins` / `embers` | `1` / `0.9` / `0.6` | How much of each. `0` removes it. |
| `grain` / `weave` | `1` / `0.55` | The canvas: sandy edge and pigment speckle, woven texture in the dark. |
| `smear` / `trailFade` | `0.12` / `1.4` | How far a drag drags the paint, and how long it takes to heal. |
| `flare` | `1` | Size of a click flare. |
| `ambientFlares` / `ambientEvery` | `true` / `3.2` | The fire flaring on its own when nobody is touching it. |
| `quality` | `1` | Drawing-buffer scale, `0.4 … 1`. Drop it on huge screens. |

## Notes

- **Reduced motion** paints one still frame and stops; retuning `params` still
  repaints it.
- The loop **pauses offscreen** (IntersectionObserver). A full-screen pass per
  frame for nobody is the most common way a hero background drains a battery.
- The canvas measures **its own box**, not the window; pointer coordinates come
  from its bounding rect, so it behaves the same in a card as full-bleed.
- A dropped GPU context rebuilds. No WebGL at all paints a still radial
  gradient in the same palette rather than a black rectangle.
- The program and the one vertex buffer are released on unmount.
- Pointer speed is capped before it reaches the shader: a flick measured over a
  single short frame reads as enormous and would tear the whole flame across
  the screen.
