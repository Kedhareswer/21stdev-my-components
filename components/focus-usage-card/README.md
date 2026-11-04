# Focus Usage Card

A usage-analytics card on warm paper: a big total, a change chip, and a stacked bar chart split by category. The bars grow from the baseline on a spring with a left-to-right stagger. Hovering or focusing a bar dims the rest and pops a dark tooltip with that slot's breakdown. A segmented control swaps between views (say Day and Week); its pill slides across, the total blurs in, and the new bars grow. Under the chart, each category shows its time and a meter that fills to its share.

```tsx
import FocusUsageCard from "@/components/ui/focus-usage-card"

<FocusUsageCard
  title="Focus report"
  categories={[
    { name: "Deep work", color: "#3d5afe" },
    { name: "Meetings", color: "#ff6b4a" },
    { name: "Messages", color: "#ffbe2e" },
  ]}
  views={[
    { id: "week", label: "Week", caption: "3 – 9 November", delta: 6, axis: ["M", "T", "W", "T", "F", "S", "S"],
      bars: [{ label: "Monday", values: [260, 120, 70] }, { label: "Tuesday", values: [276, 160, 112] }] },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `categories` | required | `{ name, color }[]`, the stack order from the bottom. |
| `views` | required | `{ id, label, bars, caption?, delta?, axis? }[]`. Each bar is `{ label, values }` with minutes per category. A negative `delta` reads as good (green). |
| `title` | `"Screen time"` | Small label top left. |
| `height` | `"100svh"` | Minimum height of the stage. |
| `className` | `""` | On the stage. |

## Notes

- Bar heights are percentages of a rounded y-axis top (`niceMax`), and the tooltip sits at a percentage across the plot, so nothing is measured.
- Every bar is a button with an `aria-label`, and the tooltip follows keyboard focus.
- Reduced motion: no growth, pop-in or slide; the chart just appears.
- No images and no dependencies beyond React.
