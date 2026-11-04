# Shimmer Wave Text

Loading text with a travelling light. In `"wave"` a crest runs through the line: each letter lifts a touch, swells slightly and catches the highlight colour with a soft glow, then dips and settles as the crest moves on. In `"sweep"` a band of light glides across the letters without moving them. Pure CSS, one keyframe per mode, with each letter on its own delay. Lines only break between words.

No dependencies.

```tsx
import ShimmerWaveText from "@/components/ui/shimmer-wave-text"

<ShimmerWaveText text="Reading 14 sources and drafting your brief…" />
<ShimmerWaveText text="Syncing 3 of 12 files" variant="sweep" duration={1.6} />
<button aria-busy="true">
  <ShimmerWaveText text="Publishing" color="rgba(255,255,255,.45)" highlight="#fff" />
</button>
```

## Props

| Prop | Default | |
|---|---|---|
| `text` | required | The words. |
| `variant` | `"wave"` | `"wave"` lifts letters as the light passes; `"sweep"` only lights them. |
| `duration` | `2.2` | Seconds per pass. |
| `step` | auto | Seconds between letters. By default the crest crosses the line in 60% of a pass. |
| `color` / `highlight` | host `--color-muted-foreground` / `--color-foreground` | Resting and crest colours, so it follows light and dark themes. |
| `lift` | `0.16` | Crest lift in em (wave only). |
| `active` | `true` | `false` stops the shimmer and shows the text at full strength. |
| `as` | `"span"` | `span`, `p`, `div` or a heading. A `span`/`div` gets `role="status"`. |

Screen readers hear the whole string once, not letter by letter. With `prefers-reduced-motion` the wave stops lifting letters and keeps only the moving light.
