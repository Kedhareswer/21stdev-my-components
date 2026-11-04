# Cell Column Trend

A performance chart built from stacked cells. Each column is a period and fills with cells up to its value, and the top cell of each column is a lighter cap. The KPI tiles underneath are tabs. Picking one flips the whole board over in a diagonal wave to the new metric, the y-axis rolls to its new scale, and an ink bar slides under the chosen tile. Hovering, tapping or arrowing a column inks it, dims the rest, drops a dashed hairline, floats a tooltip and pins the date to the axis.

```tsx
import CellColumnTrend from "@/components/ui/cell-column-trend"

<CellColumnTrend
  title="Automation health"
  caption="Weekly · Nov 2025 – Oct 2026"
  labels={weekLabels}
  ticks={["Nov", "Dec", "Jan" /* … */]}
  metrics={[
    { key: "runs", label: "Workflow runs", values: runs, summary: "1.46M", delta: 18.2 },
    { key: "p95", label: "p95 latency", values: p95, summary: "412ms", delta: -7.4, higherIsBetter: false, format: (n) => Math.round(n) + "ms" },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `metrics` | required | `{ key, label, values, summary, delta, higherIsBetter?, format? }[]`. All `values` arrays share the length of `labels`. |
| `labels` | required | One label per column, used by the tooltip and the axis pin. |
| `ticks` | `[]` | Labels spread evenly under the axis. |
| `title` / `caption` | `"Performance"` / `"Weekly, last 12 months"` | Header. |
| `rows` | `12` | Cells per column. |
| `accent` | `#2d5bff` | Cell colour. |

A delta is green when it moves the good way, so a falling latency with `higherIsBetter: false` reads green.

## Notes

- React only. The axis maximum rounds up to a value whose quarters are also round (`800 → 200, 400, 600`).
- Columns, the tooltip, the hairline and the pin are placed by percentage. No layout reads.
- The tiles are a `tablist` (← → switch metrics). The plot is focusable (← → pick a column, Esc clears) and its `aria-label` lists every value.
- Below 640 px the tiles wrap two by two. `prefers-reduced-motion` drops the flip and every glide.
