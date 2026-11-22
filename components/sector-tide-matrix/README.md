# Sector Tide Matrix

A diverging dot-matrix chart of who gained and who lost, month by month. Each column is a month and each dot is a sector. Sectors that rose that month stack upward from a zero line, and sectors that fell sink below it. The biggest moves sit furthest from the line. Sectors that didn't move collect in a "Flat" row underneath, and shaded bands mark periods such as a recession.

The component is the chart only. It holds no sample data and no copy: the series, the sector names, the headline and the bands all come in through props. `demo.tsx` builds a seeded, synthetic series (20 sectors over 110 months, sliding into a downturn and recovering) and passes it in. With no `data`, the chart shows an empty state.

It needs nothing beyond React.

```tsx
import SectorTideMatrix from "@/components/ui/sector-tide-matrix"

const sectors = ["North", "South", "East", "West"]
const data = [
  [0.4, -0.2, 0, 1.1],
  [0.1, -0.6, 0.3, 0.8],
  // …one row per month, one value per sector (change from the month before; null if missing)
]
const bands = [{ from: "2024-06", to: "2024-08", label: "Renovation" }]

<SectorTideMatrix
  title="Store traffic, month by month"
  legendLabel="Change from the previous month"
  sectors={sectors}
  data={data}
  start="2024-01"
  bands={bands}
  defaultPinned="North"
/>
```

Keep `data`, `sectors` and `bands` outside the render (module scope or `useMemo`). The chart memoises about 2,000 dots on them.

## Colour

The default scale is diverging: one warm hue for losses, one cool hue for gains, five steps each, with boundaries every 0.2% from −0.8% to +0.8%. The two hues stay apart under red-green colour-vision deficiency. Each step is mixed into the host's `--color-background`, so a small move is "less ink": pale on a light page, deep on a dark one, and the strongest moves are the most saturated in both. Unchanged sectors are neutral grey. Pass `scale` to use your own thresholds and colours.

## Interactions

- **Hover or tap a dot** to see the sector, its change and the month, plus where it ranks that month (for example "3rd of 14 rising"). A column highlight and a month marker on the year axis follow the pointer. The tooltip stays inside the chart, including when the chart is scrolled.
- **Click a dot, or pick one from the Follow menu**, to follow that sector. Its dots keep their colours and gain an outline, a thread joins its path, and everything else fades back, so you can read how that one sector moved through the whole period. The toolbar line counts the months it rose and fell. Click it again to stop. On touch screens, the first tap reads the dot and a second tap on the same dot follows it.
- **The Follow menu** is a styled listbox that lists each sector with its latest change. `↑` and `↓` move, typing a letter jumps to a sector, `Enter` picks and `Esc` closes.
- **Legend swatches are filters.** Click one to show only that range, and click more to add ranges. A followed sector always stays visible.
- **Keyboard:** tab to the chart. `←` and `→` move through months while staying on the same sector, `Shift` with `←` or `→` jumps a year, and `↑` and `↓` walk the column. `Home` and `End` go to the first and last month, `Enter` follows the sector you're on, and `Esc` clears the filter and the followed sector. On a scrolled chart the column you move to is brought into view. Every move is read out through an `aria-live` region, and the chart carries a written summary of its widest falls and rises.
- **Replay** rebuilds the chart with its staggered build-in. Dots rise out of the zero line month by month.
- **A band can be a what-if.** Give a band `imagine: true` and its label becomes a button: click it and the chart briefly redraws those months as if every sector had grown, then snaps back to the record. It is off unless you ask for it, so a plain band never misstates your data.

The pointer is the system's own. Dots and controls use the ordinary pointer cursor.

With `prefers-reduced-motion: reduce`, the chart draws fully on the first frame, with no build-in, no drift and no thread drawing. A what-if band swaps values instantly.

## Sizing

- Year, axis and band labels are HTML at fixed pixel sizes laid over the dot layer, so text is the same size at every width. Only the dots scale.
- The chart runs from gutter to gutter. On a short stage the dots flatten by up to a quarter before the chart narrows.
- Below about 0.72 of its natural size (852px for 110 months) the chart scrolls sideways instead of shrinking further. The count axis stays pinned to the left edge, and the edges fade while there is more to scroll to.
- The narrow layout follows the component's own width (a container query at 640px), not the viewport's, so it also works in a sidebar or a card.
- Axes are sized from the data: a series that never has more than eight sectors on a side gets an axis of ten, not twenty empty rows. The flat row grows if many sectors are unchanged in one month.

## Props

| Prop | Default | |
|---|---|---|
| `data` | none | `(number \| null)[][]`, one row per month and one value per sector. Values are the change from the previous month, `0` means unchanged and `null` means missing. Ragged rows and non-numbers are treated as missing. |
| `sectors` | none | Names, in the same order as each row of `data`. Unnamed columns are called "Series n". |
| `start` | `"2006-01"` | First month of `data`, as `"YYYY-MM"`. |
| `bands` | none | `{ from, to, label, imagine? }[]`, with months as `"YYYY-MM"`. |
| `scale` | 10 colours | `{ thresholds: number[]; colors: string[] }`, where `colors` has `thresholds.length + 1` entries running from the steepest loss to the strongest gain. Any CSS colour works, including `color-mix()` against `var(--color-background)`. |
| `legendTicks` | every other threshold | Which thresholds to label under the legend. |
| `formatValue` | signed percentage | `(value: number) => string`, used in tooltips, the menu and announcements. |
| `defaultPinned` | `null` | The sector followed on load, by name. |
| `onPinChange` | none | `(sector: string \| null) => void` |
| `eyebrow`, `title`, `description`, `legendLabel`, `footnote` | none | Copy. Each is left out when not passed. |
| `labels` | `{ rising: "Sectors rising", falling: "Sectors falling", flat: "Flat" }` | Axis words. |
| `emptyMessage` | `"No data to chart yet"` | Shown when `data` is empty. |
| `height` | `"100svh"` | Height of the stage. Any CSS length. |
| `className`, `style` | none | Applied to the root. |

## Notes

- Colours come from the host's `--color-background`, `--color-foreground`, `--color-muted-foreground` and `--color-border`. Nothing else is assumed.
- Hovering reads no layout: every dot carries its month and sector. The only measurement is one clamp of the tooltip per change. The dots are memoised, so moving the pointer never re-renders them.
