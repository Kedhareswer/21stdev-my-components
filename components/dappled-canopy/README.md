# Dappled Canopy

Late sun through a tree, thrown soft and warm across a plaster wall. Two layers
of out-of-focus leaves sway on a slow breeze, flutter on their own and swing
when a gust comes through, while the light pools in one corner and fades out
across the wall. Film grain over everything. There's no text on it: it's a
background.

**No dependencies.** One fragment shader in raw WebGL1, and React is the only
import. No textures, no video, no assets, no CSS file.

## Interaction

- **Move across it** and you push the canopy. Leaves near the pointer part and
  shiver, the whole tree swings in the direction you moved and settles back on
  a spring with a little overshoot, and the sun leans slightly toward you.
- **Click or tap** and a gust comes through: everything flutters, and the tree
  swings away from where you clicked.
- **Leave it alone** and it keeps moving. The breeze rises and falls on its own,
  with gusts now and then.

Listeners sit on the root, so anything you pass as `children` (a headline, a
navbar) still lets the pointer stir the leaves underneath it.

## Usage

```tsx
import DappledCanopy from "@/components/ui/dappled-canopy"

<DappledCanopy />                                   // full-bleed, apricot wall
<DappledCanopy preset="noon-plaster" height="32rem" />
<DappledCanopy params={{ light: "#ffd59a", blur: 0.9, gustiness: 0.8 }} />

// as a hero background
<DappledCanopy>
  <h1 className="pt-[30svh] text-center font-serif text-7xl text-[#fff6ea]">…</h1>
</DappledCanopy>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | **Must be a definite length.** The canvas fills this box. |
| `preset` | `"apricot"` | `apricot` · `golden-hour` · `sage-morning` · `noon-plaster` · `lilac-dusk` · `moonlit` |
| `params` | none | Any `CanopyParams` keys, layered over the preset. |
| `interactive` | `true` | Pointer pushes the canopy and leans the sun. |
| `speed` | `1` | Time scale for every motion. `0` freezes the breeze. |
| `className`, `style` | none | Applied to the root `<section>`. |
| `children` | none | Laid over the light. |

## Parameters

Every one is optional in `params`. `CANOPY_DEFAULTS` and `CANOPY_PRESETS` are
exported, and a preset is just a partial overlay, so
`{ ...CANOPY_PRESETS["golden-hour"], blur: 1 }` is a valid `params`.

| Group | Keys |
|---|---|
| Colour (hex) | `wallTop`, `wallBottom`: the wall gradient. `bounce`: warm fill across the sunlit area. `light`: the sun. `hot`: extra heat at its core. |
| Sun patch | `sunX`, `sunY` (0..1, y up), `sunWidth`, `sunHeight` (in short-side units), `sunAngle` (radians) |
| Leaves | `leafAngle` (radians), `leafSize`, `density` (0..1), `blur` (0..1), `shadow` (0..1, how dark a shadow is inside the light) |
| Wind | `sway`: branches. `flutter`: single leaves. `gustiness` (0..1). |
| Film | `grain`, `flicker` (0..1, the sun's shimmer) |
| Pointer | `follow`: how far the sun leans. `push`: how hard motion shoves the tree. |

Changing a value never rebuilds the GL context. The render loop reads the
current params through a ref.

## How it's lit

The wall is a diagonal two-colour gradient. The sun is a soft ellipse on it,
and the light inside the ellipse is cut by leaf shadows.

Each layer of leaves is a stretched cell grid with one leaf per cell, a soft
ellipse that narrows toward its tip. A slow clump field keeps or drops leaves,
so whole branches are present or missing and the light has gaps to stream
through. The softness of each leaf's edge is the blur. The far layer is
bigger, softer and slower than the near one, which is what makes it read as
depth.

The motion comes in three scales:

1. **Sway.** A slow, smooth warp of the whole leaf space, so neighbouring
   leaves move together like a branch.
2. **Flutter.** Each leaf twists a little and narrows as it turns on its stem,
   which is how a leaf turning edge-on looks on a wall. The twist is clamped so
   a leaf can't swing out of the 3×5 neighbourhood the shader searches, which
   would show up as a straight seam.
3. **Gusts.** Two octaves of 1D noise in JS scale up flutter and sway together.
   Pointer pushes and clicks feed a damped spring that offsets the whole
   canopy.

Grain is re-seeded at 24 fps rather than every frame, so it reads as film and
not as TV static.

## Notes

- **Reduced motion:** one still frame, redrawn only when the box resizes. The
  pointer doesn't animate it either.
- **Off-screen:** an `IntersectionObserver` stops the loop entirely.
- **Resolution:** the light is soft by nature, so the drawing buffer is capped
  at 1.25× device pixels. The cost is one full-screen pass with 30 leaf tests
  per pixel.
- **Portrait screens:** the leaf scale uses the shorter side, but never less
  than 62% of the longer one, so a tall phone gets real leaves instead of ones
  shrunk to its narrow width.
- **No WebGL:** a still radial gradient in the same palette instead of an empty
  box. A lost GPU context rebuilds itself, and everything is released on
  unmount.
- The first frame is drawn synchronously on mount, so screenshots and cover
  captures are never blank.
