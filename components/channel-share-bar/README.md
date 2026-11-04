# Channel Share Bar

A stacked share bar for "where does it come from" numbers: support tickets by channel, traffic by source, revenue by plan. A Week / Month / Quarter switch slides a pill between periods. The segments re-flow to the new shares, and the percentages and total count over to their new values.

- Wide slices carry their label inside the bar. Medium ones show just their percentage, and thin ones (under `inlineMin`, default 7%) get a callout row under the bar tail.
- Hover or focus a segment to dim the rest of the bar and the legend.
- The shares are rounded to one decimal and always add up to exactly 100.0%.
- Arrow keys move between periods.
- Reduced motion swaps every tween for an instant change.

No dependencies beyond React. Styles are scoped under `.csb-` and use the semantic colour tokens.

```tsx
<ChannelShareBar
  title="Signups by source"
  subtitle="Last 90 days"
  unit="signups"
  periods={[{ label: "Q3", slices: [{ label: "Organic", value: 4200, color: "#2f8a68" }, /* … */] }]}
/>
```

| Prop | Default | |
|---|---|---|
| `title` / `subtitle` | support-desk copy | heading text |
| `unit` | `"tickets"` | word after the total |
| `periods` | three demo periods | `{ label, slices: { label, value, color }[] }[]` |
| `defaultPeriod` | last period | index shown first |
| `inlineMin` | `7` | share (%) at which the percentage moves inside the bar; thinner slices get a callout |
| `labelMin` | `20` | share (%) at which the name also shows inside the bar |
