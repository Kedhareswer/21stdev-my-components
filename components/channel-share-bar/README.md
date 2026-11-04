# Channel Share Bar

A stacked share bar for "where does it come from" numbers: support tickets by channel, signups by source, revenue by plan.

- **Entrance:** the card rises in and the segments grow one after another.
- **Totals:** the total rolls in like an odometer.
- **Period switch:** a sprung pill moves between periods. A sheen sweeps the bar, the segments re-flow, every percentage counts to its new value, and a delta chip shows the change against the period you came from.
- **Labels:** wide slices carry their name and share. Medium ones carry the share. Thin ones (under `inlineMin`) drop a coloured leader line to a staggered callout.
- **Hover or focus:** a segment or legend chip lifts it, dims the rest and shows a tooltip with its share and volume.
- **Tones:** `dark` (the default ink panel) and `light` (paper).
- **Maths:** the shares are rounded to one decimal and always add up to exactly 100.0%.
- **Accessibility:** arrow keys move between periods, and reduced motion turns every tween and sweep off.

No dependencies beyond React. Styles are scoped under `.csb-`, and the component never reads layout. Positions come from the data.

```tsx
<ChannelShareBar
  tone="light"
  title="Signups by source"
  unit="signups"
  periods={[{ label: "30 days", slices: [{ label: "Organic", value: 4210, color: "#2f8a68" } /* … */] }]}
/>
```

| Prop | Default | |
|---|---|---|
| `title` / `subtitle` / `eyebrow` | support-desk copy | heading text |
| `unit` | `"tickets"` | word after the total |
| `periods` | Week / Month / Quarter | `{ label, slices: { label, value, color }[] }[]` |
| `defaultPeriod` | last period | index shown first |
| `inlineMin` | `7` | share (%) at which the percentage moves inside the bar |
| `labelMin` | `20` | share (%) at which the name also shows inside the bar |
| `tone` | `"dark"` | `"dark"` or `"light"` |
