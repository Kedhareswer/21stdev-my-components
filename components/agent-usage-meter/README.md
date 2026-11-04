# Agent Usage Meter

A usage card for an AI agent's monthly allowance. A row of pill segments fills from the left when the card scrolls in, and a tick marks the soft cap. Press play and the agent goes live. A green status dot pings, the leading segment breathes, and every second the hours tick up and the next segment pops in. The cost breakdown drawer slides open under the card. Its lines drop in one after another, and each cost bar grows in turn. The cycle total includes the hours added while live.

```tsx
import AgentUsageMeter from "@/components/ui/agent-usage-meter"

<AgentUsageMeter
  name="Iris · Support Agent"
  badge="Ir"
  used={162}
  limit={320}
  rate={1.26}
  resetsIn="12 days"
  breakdown={[{ label: "Model tokens", amount: 118.4, hint: "41.2M in · 6.8M out" }]}
  live
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `name` / `description` / `badge` | `"Support Agent"` / `"Monthly active processing time"` / `"SA"` | Header. The badge sits in a gradient tile. |
| `used` / `limit` / `unit` | `162` / `320` / `"h"` | Starting usage. |
| `softCap` | `0.8` | Fraction of `limit` marked with a tick. `0` hides it. |
| `resetsIn` | `"12 days"` | Right-hand note under the meter. |
| `rate` | `1.26` | Cost per unit, shown in the footer and added to the total while live. |
| `breakdown` | four sample lines | `{ label, amount, hint? }[]`. Bars are scaled to the largest line. |
| `segments` | `40` | Pills in the meter. |
| `live` / `step` | `false` / `2` | Start running, and the units added per tick. It stops at the limit. |
| `accent` | `#6a4cff` | Meter, badge and bar colour. |

## Notes

- React only. Live mode is a one-second interval, not a frame loop. The drawer animates `grid-template-rows` from `0fr` to `1fr`, so nothing is measured.
- The meter is `role="meter"` with live values. The play button is `aria-pressed` and the drawer toggle is `aria-expanded`.
- `prefers-reduced-motion` removes every animation and slows the tick.
