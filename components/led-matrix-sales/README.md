# LED Matrix Sales

A revenue card whose chart is a board of LED dots. Each column is a day and lights from the bottom up to that day's level. The top dot of each column burns brightest. When the card scrolls into view, the board sweeps on from left to right and the total rolls up like an odometer.

Hover, tap or arrow across the board to pick a day. The picked column glows, its neighbours half-dim and the rest fall back. A tooltip glides to the column top, and its digits roll to the new value.

```tsx
import LedMatrixSales from "@/components/ui/led-matrix-sales"

<LedMatrixSales
  title="Net sales"
  caption="Daily revenue · Sep 14 – Oct 25"
  delta={12.4}
  data={[{ label: "Sep 14", value: 4210 }, { label: "Sep 15", value: 3120 } /* … */]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `data` | required | `{ label, value }[]`, one per column. 30–60 points read best. |
| `title` | `"Net sales"` | Card title. |
| `caption` | `"Daily revenue, last six weeks"` | Line under the title. |
| `delta` | `12.4` | Change in percent. Positive is a green chip, negative is red. |
| `deltaLabel` | `"vs previous period"` | Text after the chip. |
| `rows` | `9` | Dot rows. The largest value fills the column. |
| `format` | `$1,234` | Formats the total and the tooltip. |
| `accent` | `#ffb547` | LED colour. |

## Notes

- No dependencies beyond React. Fonts fall back from Inter Tight and JetBrains Mono to the system stack.
- The board is one SVG `viewBox`, and the tooltip and guide are placed by percentage, so nothing reads layout.
- Keyboard: focus the board, then use ← → to move and Esc to clear. The board's `aria-label` lists every value.
- `prefers-reduced-motion` drops the sweep, the digit roll and the glide.
