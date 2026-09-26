# Foundation Primitives

A design-system **Foundations** page. The hero is a row of soft 3D primitives, each
one standing for a base material: an asterisk (iconography), a sphere (colour), a
stack of half-domes (typography), an hourglass (spacing) and an orb (grid). Under
it is an interactive **Base material** list, and each row opens a live specimen.

**No dependencies.** React is the only import. There are no images, no fonts and
no three.js. The shapes are signed distance fields raymarched in one WebGL2
fragment pass:

- **Material**: frosted gradient gel. A saturated core fades to a milky rim, the
  silhouette edges are soft and translucent (they also anti-alias), there is a
  specular glint, and light seeps through on the side away from the lamp.
- **Depth**: soft shadows and a coloured glow fall on the card and on the pale
  plates the shapes sit on. The half-domes fade toward their flat faces, and you
  see the next dome through them.
- **Glass lens**: a convex lens bends the rays behind it, so it magnifies whatever
  it floats over.

## Interaction

| Where | What happens |
|---|---|
| Move over the card | the scene tilts toward the pointer, the light follows, and the lens follows and magnifies |
| Hover a shape | it lifts and shows its label. The asterisk spins and the half-domes fan open |
| Drag a shape | it spins with inertia and springs back upright |
| Click a shape | squash-and-spin pop, and its row opens below |
| Hover or click a row | the matching shape lifts or is selected |
| Keyboard | shapes are buttons: arrows move between them, Enter or Space opens one |
| Idle | shapes float and turn slowly, and the hourglass flips over like a timer |

## Usage

```tsx
import FoundationPrimitives from "@/components/ui/foundation-primitives"

<FoundationPrimitives />

<FoundationPrimitives
  title="Foundations"
  description="모든 디자인 요소의 기반이 되는 가장 원자적인 단위들로 …"
  sectionTitle="Base material"
/>

<FoundationPrimitives
  items={[
    { label: "Radius", description: "…", shape: "cube", colors: ["#14b8a6", "#b8f3e8"], tile: "disc", specimen: <MyRadii /> },
    { label: "Elevation", description: "…", shape: "torus", colors: ["#f43f5e", "#fecdd3"], tile: "square" },
  ]}
  selected={picked}
  onSelect={setPicked}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `title` | `"Foundations"` | |
| `description` | English copy | |
| `sectionTitle` | `"Base material"` | Heading above the list. |
| `items` | the five from the reference | Up to 6. See below. |
| `selected` / `onSelect` | none | Controlled selection: an index, or `null`. |
| `defaultSelected` | `1` (Color) | Uncontrolled starting selection. |
| `stageHeight` | `"clamp(240px, 30vw, 340px)"` | Height of the 3D card. **Must be a definite length.** On a narrow card five or six shapes fold into two rows. |
| `lens` | `true` | The glass lens. |
| `idle` | `true` | Floating, slow turning, the hourglass flip. |
| `interactive` | `true` | `false` makes it a still picture. |
| `hint` | `true` | "hover · drag to spin · click to open" in the card. |
| `shadow` | `0.5` | 0..1 |
| `glow` | `0.5` | 0..1, the coloured light each shape throws on the card. |
| `typeSample` | the title | Text used by the typography specimen. |
| `maxDpr` | `1.75` | Canvas resolution cap. |
| `className` | `""` | Appended to the root. |

### `FoundationItem`

| Field | Notes |
|---|---|
| `label`, `description` | Row text. The label is also the shape's accessible name and hover chip. |
| `shape` | `asterisk`, `sphere`, `halves`, `hourglass`, `torus`, `pill` or `cube` |
| `colors` | `[core, rim]`. Any CSS colour works, including `oklch()`. |
| `tile` | `disc`, `square` or `none`. Neighbouring `square` tiles join into one strip, as in the reference. |
| `specimen` | `color`, `type`, `spacing`, `grid`, `icon`, `none`, or any React node |
| `meta` | Short note at the right of the row, e.g. `"12 columns"`. |

## Notes

- **Theme**: the text uses `foreground`, `muted-foreground` and `border` tokens.
  The plates and the lens outline are tinted from the computed text colour, so
  the card works in light and dark. The component watches `<html>` for a theme
  class change.
- **Reduced motion**: nothing moves on its own. Hover and selection change
  instantly, a drag turns the shape without inertia, and the canvas redraws only
  when something changes.
- The animation pauses while the card is off screen. A lost WebGL context
  rebuilds itself. Without WebGL2 the card shows flat gradient discs, and the
  list still works.
