# Sector Tide Matrix

A diverging dot-matrix chart of who gained and who lost, month by month. Each column is a month and each dot is a sector. Sectors that rose that month stack upward from a zero line, and sectors that fell sink below it. The biggest moves sit furthest from the line. A diverging scale colours every dot, running from red (−1% and below) through orange, yellow and a pale near-zero shade, then light and mid green, to blue (+0.75% and above). Sectors that didn't move collect in a "Flat" row underneath, and shaded bands mark periods such as a recession.

The default series is synthetic. It's built in the file from a seeded random generator: 20 sectors over 110 months (January 2006 to February 2015), sliding into a downturn, bottoming out, then recovering, with noise on top. It never fetches anything. Pass your own `data` to chart real numbers.

It needs nothing beyond React.

```tsx
import SectorTideMatrix from "@/components/ui/sector-tide-matrix"

<SectorTideMatrix
  title="Store traffic, week by week"
  sectors={["North", "South", "East", "West"]}
  start="2024-01"
  data={[
    [0.4, -0.2, 0, 1.1],
    [0.1, -0.6, 0.3, 0.8],
    // …one row per month, one value per sector (% change; null if missing)
  ]}
  bands={[{ from: "2024-06", to: "2024-08", label: "Renovation" }]}
  defaultPinned="North"
/>
```

## Interactions

- **Hover or tap a dot** to see the sector, its change and the month, plus where it ranks that month (for example "3rd of 14 rising"). A column highlight and a month marker on the top axis follow the pointer.
- **Click a dot, or pick one from the Follow menu**, to follow that sector. The menu is a styled listbox that stays inside the stage and lists each sector with its latest change. It works with the keyboard: `↑` and `↓` move, typing a letter jumps to a sector, `Enter` picks and `Esc` closes. It turns dark in every month and a faint thread joins its path. Click it again to stop following. On touch screens, the first tap reads the dot and a second tap on the same dot follows it.
- **Legend swatches are filters.** Click one to show only that range, and click more to add ranges. Everything else fades back, but a followed sector always stays visible.
- **Keyboard:** tab to the chart. `←` and `→` move through months while staying on the same sector, `Shift` with `←` or `→` jumps a year, and `↑` and `↓` walk the column. `Home` and `End` go to the first and last month, `Enter` follows the sector you're on, and `Esc` clears the filter and the followed sector. Every move is read out through an `aria-live` region, and the chart carries a written summary of its worst and best months.
- **Toolbar readout:** next to Follow, a single line shows the hovered month's tally (rising, falling, flat). With nothing hovered it names the toughest month.
- **Replay** rebuilds the chart with its staggered build-in. Dots rise out of the zero line month by month.
- **Steady controls:** Follow, Reset and Replay stay where they are. Hover tints them slightly and a press nudges them down, so nothing moves while you're reading the chart.
- **Context cursor:** a label says what a click will do before you click: *Follow Accommodation*, *Unfollow*, *Only −0.50% to −0.25%*, *Rebuild the chart*.
- **Easter egg:** a band's label is a button. Click **Recession** and the chart briefly imagines it never happened: every sector in those months grows, and the dots drift up into green before the record snaps back. Keep trying and the chart starts counting.

The custom cursor only runs on devices that can hover with a fine pointer (`(hover: hover) and (pointer: fine)`). On touch screens, taps work normally and the keyboard hints are hidden.

With `prefers-reduced-motion: reduce`, the chart draws fully on the first frame, with no build-in, no drift and no thread drawing. The Easter egg swaps values instantly.

## Props

| Prop | Default | |
|---|---|---|
| `data` | seeded series | `(number \| null)[][]`, one row per month and one value per sector. Values are % change from the previous month, `0` means unchanged and `null` means missing. |
| `sectors` | 20 industry names | Names, in the same order as each row of `data`. |
| `start` | `"2006-01"` | First month of `data`, as `"YYYY-MM"`. |
| `bands` | one recession, Dec 2007 to Jun 2009 | `{ from, to, label }[]`, with months as `"YYYY-MM"`. |
| `scale` | 9 colours | `{ thresholds: number[]; colors: string[] }`, where `colors` has `thresholds.length + 1` entries running from the steepest loss to the strongest gain. Any CSS colour works, including `color-mix()` against `var(--color-background)`. |
| `legendTicks` | `[-1, 0, 0.75]` | Which thresholds to label under the legend. |
| `defaultPinned` | `"Construction"` | The sector followed on load, or `null` for none. |
| `onPinChange` | — | `(sector: string \| null) => void` |
| `eyebrow`, `title`, `description`, `legendLabel`, `footnote` | … | Copy. |
| `labels` | `{ rising: "Sectors rising", falling: "Sectors falling", flat: "Flat" }` | Axis words. |
| `height` | `"100svh"` | Height of the stage. |

## Notes

- Colours come from the host's `--color-background`, `--color-foreground`, `--color-muted-foreground` and `--color-border`. The near-zero shades are mixed into the background, so a small move reads as "less ink". It's pale in light mode and deep in dark mode, and neither turns grey.
- The plot is one SVG scaled to fit, using container query units, so the year axis, dots and tooltips stay in proportion at any size. Below 860px wide, it scrolls sideways instead of shrinking the dots.
- Hovering reads no layout: every dot carries its month and sector, and the tooltip is placed in the chart's own coordinates. Layout is read only once, when the pointer enters the stage, so the cursor label can flip at the right edge. About 2,200 dots are memoised, so moving the pointer never re-renders them.
