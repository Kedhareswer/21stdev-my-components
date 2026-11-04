# Tilted Metric Deck

A pile of glass metric cards lying in 3D beside an upright detail card. Each card's edge glows in its own colour. Hover, tap or arrow through the pile, and the picked card rises above the stack and slides out sideways. The detail card redraws for it: the value rises in, the sparkline draws itself over a soft fill, the monthly bars grow one after another and the target bar fills. The stage glow takes on the metric's colour. Until someone touches it, the deck flips through the metrics on its own.

```tsx
import TiltedMetricDeck from "@/components/ui/tilted-metric-deck"

<TiltedMetricDeck
  metrics={[
    {
      label: "Revenue", value: "$184.2K", delta: "+12.4%",
      trend: [42, 45, 44, 51, 49, 58, 61],
      rows: [{ label: "Aug", score: 70 }, { label: "Sep", score: 79 }],
      target: 83, updated: "Sep 30, 2026",
    },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `metrics` | required | `{ label, value, delta, trend, rows, target, updated?, color? }[]`. `value` and `delta` are preformatted strings, and a `delta` starting with `-` or `−` turns red. `rows[].score` and `target` run 0–100. |
| `autoplay` | `3200` | Ms between automatic flips until the first interaction. `0` turns it off. |

Six colours are built in (coral, mint, sky, amber, violet, pink); `color` overrides one.

## Notes

- React only, pure CSS 3D (`perspective` + `preserve-3d`). The sparkline is an SVG path drawn with `pathLength` and `stroke-dashoffset`. Nothing reads layout.
- The pile is a `tablist` (arrow keys move and focus) and the detail card is its `tabpanel`, announced politely.
- Autoplay stops for good on the first hover, tap or key, and never starts under `prefers-reduced-motion`. Reduced motion also drops every transition.
- Below 720 px the detail card stacks under a smaller pile.
