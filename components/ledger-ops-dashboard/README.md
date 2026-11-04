# Ledger Ops Dashboard

A full admin dashboard for a studio or agency, set like a printed ledger: stone paper, an ink sidebar, a vermilion accent and serif figures. A built-in switch turns it to a deep-green night theme, and everything re-tints smoothly.

- **Sidebar.** A lit marker slides to the active section on a spring.
- **Header.** A 7d / 30d / 12m range pill slides between options.
- **KPI tiles.** Figures count up while each sparkline draws itself.
- **Delivery output.** The bars rise one after another and re-grow when the range changes. Hover or focus a bar for its value. The latest period is inked.
- **Team rhythm.** A weekday × week heatmap washes in cell by cell and names the busiest day.
- **Accounts.** Filter tabs (All / Active / Planning / Review / At risk) with counts, an underline that springs in, and rows that fade through on every switch. Health chips carry an icon and a label, never colour alone.

```tsx
import LedgerOpsDashboard from "@/components/ui/ledger-ops-dashboard"

<LedgerOpsDashboard
  studio="Halden Studio"
  title="Studio overview"
  accounts={[{ name: "Aster & Field", owner: "Nia Bennett", stage: "Active", health: "On track", updated: "Sep 03", value: 8400 }]}
  output={{ "7d": { labels: [...], values: [...] }, "30d": {...}, "12m": {...} }}
  height="100svh"
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `studio` / `title` | `"Halden Studio"` / `"Studio overview"` | Brand and page title. |
| `accounts` | 7 samples | `{ name, owner, stage: "Active" \| "Planning" \| "Review", health: "On track" \| "Needs input" \| "At risk" \| "Complete", updated, value }[]`. The KPI tiles are derived from it. |
| `output` | samples | `{ "7d" \| "30d" \| "12m": { labels, values } }` for the bar chart. |
| `rhythm` | 12 sample weeks | `number[7][weeks]`, values 0–4. |
| `theme` | light, or dark inside a `.dark` host | Forces the starting theme. The sidebar switch still toggles it. |
| `height` | `"100svh"` | A definite height. The main column scrolls inside it. |

## Notes

- React only. Count-ups are 1.3 s of `requestAnimationFrame` that only set state. Bars, cells, the marker and the pill use CSS transforms with percentage or `calc(var())` positions. Nothing reads layout.
- Below 1100 px the grid goes to two columns. Below 760 px the sidebar collapses to a top bar and the table scrolls sideways.
- The theme switch is `role="switch"`, the filters are a `tablist`, and bars are focusable with labels. `prefers-reduced-motion` removes every animation.
