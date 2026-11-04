# Pixel Wave Loader

A loader made of a small grid of soft pixels. A wave rolls through it and each pixel swells, overshoots a little and brightens as the wave passes, then shrinks back to a dim dot. The wave can run in a diagonal, spread out from the centre, ring out as a ripple, or snake row by row. The grid is tinted along its diagonal from one colour to another. Pure CSS: one keyframe that only animates transform and opacity, with a delay per pixel.

No dependencies.

```tsx
import PixelWaveLoader from "@/components/ui/pixel-wave-loader"

<PixelWaveLoader />
<PixelWaveLoader rows={7} cols={7} size="18px" gap="6px" pattern="radial" from="#ffd39a" to="#d8462c" label="Preparing your workspace" />
<button aria-busy="true"><PixelWaveLoader rows={3} cols={3} size="4px" gap="2px" /> Uploading</button>
```

## Props

| Prop | Default | |
|---|---|---|
| `rows` / `cols` | `4` / `4` | Grid size. |
| `size` / `gap` | `"10px"` / `"4px"` | Pixel size and gap, any CSS length. |
| `pattern` | `"diagonal"` | `"diagonal"`, `"radial"`, `"ripple"` or `"snake"`. |
| `duration` | `1.5` | Seconds per wave. |
| `from` / `to` | host `--color-foreground` | Gradient across the grid. Set only `from` for one colour. |
| `label` | none | Small caption under the grid, and the accessible name (`"Loading"` without one). |

It renders as `role="status"`. With `prefers-reduced-motion` the pixels hold their size and only glow in turn.
