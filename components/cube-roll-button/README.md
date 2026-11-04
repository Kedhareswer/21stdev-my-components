# Cube Roll Button

A two-part call-to-action: a porcelain pill and a square arrow tile. On hover or keyboard focus every letter turns over like the face of a small cube, rolling up to reveal a second label underneath, one letter after another. The back colour floods up from the bottom edge as the letters turn, a glint sweeps across once, and the arrow rolls over to point up and out. The whole button leans toward the pointer in 3D.

It rolls in from underneath on mount. Under `prefers-reduced-motion` the labels cross-fade and nothing tilts.

```tsx
import CubeRollButton from "@/components/ui/cube-roll-button"

<CubeRollButton label="Book a visit" revealLabel="Pick a time" onClick={…} />
<CubeRollButton tone="ink" size="lg" label="Reserve" revealLabel="Let's go" href="/reserve" />
```

## Props

| Prop | Default | |
|---|---|---|
| `label` | `"Book a visit"` | Resting label. Also the accessible name unless `aria-label` is set. |
| `revealLabel` | `"Let's go now"` | Label that rolls up on hover / focus. Each label keeps its own letter spacing. |
| `href` | none | Renders an `<a>` instead of a `<button>`. |
| `onClick` | none | Click handler. |
| `tone` | `"porcelain"` | `"porcelain"` (ivory face, rolls to ink) or `"ink"` (the reverse). |
| `size` | `"md"` | `"md"` (52 px) or `"lg"` (84 px). |
| `tilt` | `8` | Maximum pointer tilt in degrees. `0` turns it off. Mouse only. |
| `font` | system sans stack | CSS `font-family`. |

No dependencies beyond React. The pointer tilt measures the button once when the pointer enters and only reads that cache while it moves.
