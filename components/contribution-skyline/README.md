# Contribution Skyline

A year of activity as a GitHub-style heat map that folds up into an isometric skyline and back down again.

```tsx
<ContributionSkyline data={days} />
```

Both views are one scene. Every day is a box on a grid. The flat heat map is that grid seen from straight above, and the skyline is the same grid seen from the corner. Switching views swings a single camera between the two. At the same time the bars rise (or settle) in a wave that runs from the oldest week to the newest, and the card's height, labels and stats follow the same curve. Nothing is swapped out mid-way, so you can reverse the toggle mid-morph and it turns around from wherever it is.

**No dependencies.** React is the only import. The chart is a canvas and everything around it is Tailwind.

## Interaction

| | |
|---|---|
| Hover / tap a day | Tooltip with its count and date. In 3D the bar lifts |
| Arrow keys | Walk the grid a day (↑↓) or a week (←→). `Home`/`End` jump to the ends, `Esc` clears. Each move is announced |
| Hover a legend swatch | Every other level fades back so that level stands out. Click to keep it |
| Drag (3D) | Orbit the skyline. Double-click eases it back |
| View toggle | Morph between the flat map and the skyline |

## Props

| Prop | Default | |
|---|---|---|
| `data` | generated | `{ date: "YYYY-MM-DD", count }[]`. Repeated dates add up. Without it, a seeded sample year is drawn |
| `endDate` | latest date in `data`, or today | Last day shown. The grid starts on the week containing the day a year earlier |
| `view` / `defaultView` | — / `"3d"` | Controlled or uncontrolled view. A 3D start rises out of the flat map the first time it scrolls into view |
| `onViewChange` | — | `(view) => void` |
| `palette` | `"github"` | `github`, `halloween`, `ocean`, `ember`, `grape` or `mono`. You can also pass four colours, or `{ light, dark }` sets of four. Any CSS colour works |
| `title` | "{total} contributions in the last year" | Heading |
| `unit` / `unitPlural` | `"contribution"` / `unit + "s"` | What is being counted, e.g. `"commit"` |
| `heightScale` | `1` | Multiplies bar heights in 3D |
| `duration` | `1300` | Morph length, ms |
| `weekStart` | `0` | `0` puts Sunday on the top row, `1` puts Monday there |
| `orbit` | `true` | Drag to orbit in 3D |
| `showStats` / `showLegend` / `showToggle` | `true` | |
| `footer` | a hint | Replaces the hint under the chart. `null` renders none |
| `locale` | `"en-US"` | Month, weekday, date and number formatting |
| `seed` | `7` | Seed for the generated sample year |
| `onCellClick` | — | `({ date, count }) => void`. Also fires on `Enter` |
| `className` | `""` | Appended to the card |

## Levels and stats

The four colour levels split each active day by its share of a *busy* day, which is the 95th percentile of active days. That way one freak day can't wash the whole year out to the palest green. Bar height is linear in the day's count, so that freak day still stands tallest.

The four stats are the year's total, the busiest day, the longest streak and the current streak. The current streak survives an empty today, because today isn't over yet. On wide cards the stats sit in the skyline's empty corners, as in GitHub's isometric view. In the flat view, or on narrow cards, they fold into a row under the chart.

## Colours and theme

Surfaces and text use `--color-background`, `--color-foreground`, `--color-border` and `--color-muted-foreground`, each with a literal fallback. The canvas reads the resolved colours off the card, so `oklch()` tokens and `color-mix()` both work. Light or dark is decided from the card's own background, which picks between the palette's `light` and `dark` sets. The card follows the host's theme switch (a class, style or `data-theme` change on `<html>`, or the OS setting), and colours blend across the change instead of flipping.

## Motion

`prefers-reduced-motion` makes the morph, orbit, colour and hover changes instant, and turns off every CSS transition.
