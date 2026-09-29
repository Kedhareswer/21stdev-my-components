# Foundation Primitives

A card of soft 3D primitives: an asterisk, a sphere, a stack of half-domes, an
hourglass and an orb. They are shaded as frosted gradient gel and sit on pale
plates, with a glass lens floating over them. The card holds only the shapes,
with no text.

**No dependencies.** React is the only import. There are no images and no
three.js. The shapes are signed distance fields raymarched in one WebGL2 fragment
pass:

- **Material**: a saturated core fades to a milky rim, the silhouette edges are
  soft and translucent (they also anti-alias), there is a specular glint, and
  light seeps through on the side away from the lamp.
- **Depth**: soft shadows and a coloured glow fall on the card and on the plates.
  The half-domes fade toward their flat faces, and you see the next dome through
  them.
- **Glass lens**: a convex lens bends the rays behind it, so it magnifies whatever
  it floats over.

## Interaction

| Where | What happens |
|---|---|
| Move over the card | the scene tilts toward the pointer, the light follows, and the lens follows and magnifies |
| Hover a shape | it lifts. The asterisk spins and the half-domes fan open |
| Drag a shape | it spins with inertia and springs back upright |
| Click a shape | squash-and-spin pop, and it stays lifted as the selection (`onSelect`) |
| Keyboard | shapes are buttons: arrows move between them, Enter or Space selects |
| Idle | shapes float and turn slowly, and the hourglass flips over like a timer |

## Usage

```tsx
import FoundationPrimitives from "@/components/ui/foundation-primitives"

<FoundationPrimitives />

<FoundationPrimitives
  items={[
    { label: "Radius", shape: "cube", colors: ["#14b8a6", "#b8f3e8"], tile: "disc" },
    { label: "Elevation", shape: "torus", colors: ["#f43f5e", "#fecdd3"], tile: "square" },
  ]}
  selected={picked}
  onSelect={setPicked}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | the five from the reference | Up to 6. See below. |
| `selected` / `onSelect` | none | Controlled selection: an index, or `null`. |
| `defaultSelected` | `null` | Uncontrolled starting selection. |
| `height` | `"clamp(240px, 30vw, 340px)"` | **Must be a definite length.** On a narrow card five or six shapes fold into two rows. |
| `lens` | `true` | The glass lens. |
| `idle` | `true` | Floating, slow turning, the hourglass flip. |
| `interactive` | `true` | `false` makes it a still picture. |
| `shadow` | `0.5` | 0..1 |
| `glow` | `0.5` | 0..1, the coloured light each shape throws on the card. |
| `maxDpr` | `1.75` | Canvas resolution cap. |
| `ariaLabel` | `"Foundation primitives"` | Accessible name of the card. |
| `className` | `""` | Appended to the root, e.g. to change the rounding or background. |

### `FoundationItem`

| Field | Notes |
|---|---|
| `label` | Accessible name of the shape's button. It is never drawn. |
| `shape` | `asterisk`, `sphere`, `halves`, `hourglass`, `torus`, `pill` or `cube` |
| `colors` | `[core, rim]`. Any CSS colour works, including `oklch()`. |
| `tile` | `disc`, `square` or `none`. Neighbouring `square` tiles join into one strip. |

## Notes

- **Theme**: the plates and the lens outline are tinted from the computed text
  colour (`text-foreground`), so the card works in light and dark. It watches
  `<html>` for a theme class change.
- **Reduced motion**: nothing moves on its own. Hover and selection change
  instantly, a drag turns the shape without inertia, and the canvas redraws only
  when something changes.
- The animation pauses while the card is off screen. A lost WebGL context
  rebuilds itself. Without WebGL2 the card shows flat gradient discs.
