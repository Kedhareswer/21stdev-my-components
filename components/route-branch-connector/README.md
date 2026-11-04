# Route Branch Connector

An animated branch diagram: one source node fans out to several targets through rounded elbow wires. The chosen route draws itself in its own colour and glows, a bright packet runs along it to the target, and the previous route retracts. The source node shows the request that took the route, and a line under the diagram says why. On its own it steps through the routes like a live feed; hovering pauses it, and clicking or tabbing to a target picks that route. The card's glow takes on the active route's colour.

The demo is a model router (fast, balanced, deep and vision models), but it fits any "one input, many outcomes" story: plan selection, support triage, deploy targets.

```tsx
import RouteBranchConnector from "@/components/ui/route-branch-connector"

<RouteBranchConnector
  heading="Every request finds its route"
  targets={[
    { name: "Swift", meta: "p95 · 140 ms", example: "What's the capital of Portugal?", reason: "A short factual question.", color: "#38bdf8" },
    { name: "Deep reasoning", meta: "p95 · 6.2 s", example: "Why does this migration deadlock?", reason: "Multi-step debugging.", color: "#fbbf24" },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `targets` | required | `{ name, meta?, example?, reason?, color? }[]`. Three to five read best. |
| `eyebrow` | `"Model router"` | Mono label. |
| `heading` | `"Every request finds its route"` | Title. |
| `source` | `"Incoming"` | Label on the source node. |
| `interval` | `2800` | Milliseconds per automatic step; `0` turns it off (and hides the Live toggle). |
| `height` | `"100svh"` | Minimum height of the stage. |
| `className` | `""` | On the stage. |

## Notes

- Wires are drawn in real pixels from a width a `ResizeObserver` reports on resize; nothing is measured while it animates. The draw-in and packet use `pathLength`, so their timing is the same on every route.
- Auto-play runs only while the card is on screen and not hovered; each step gets a full interval after a manual pick.
- Reduced motion: no auto-play, packet or draw-in; picking a route switches instantly.
- No images and no dependencies beyond React.
