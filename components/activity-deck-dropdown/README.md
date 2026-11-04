# Activity Deck Dropdown

A notification dropdown that starts as a tucked deck. The newest activity sits on top and the next two peek out underneath. Click the header or the deck and the cards fan out into a full list on a bouncy spring, one after another. Clicking a card marks it read and its glowing dot pops away. "Mark all as read" clears the lot, the bell's badge shrinks to nothing and the bell stops ringing.

```tsx
import ActivityDeckDropdown from "@/components/ui/activity-deck-dropdown"

<ActivityDeckDropdown
  activities={[
    { id: "a", title: "Maya left a comment", body: "Love the river shot", time: "now", image: "/maya.jpg", unread: true },
    { id: "b", title: "Payout sent", body: "€1,240.00 is on its way", time: "3h", tint: "#11785d" },
  ]}
  onOpenActivity={(a) => router.push("/activity/" + a.id)}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `activities` | required | `{ id, title, body, time, image?, tint?, unread? }[]`. Without `image`, the tile shows the title's first letter on `tint`. |
| `title` | "N new activities" | Header line. |
| `subtitle` | "What happened while you were away" | |
| `defaultOpen` | `false` | |
| `onOpenActivity` | none | Called when a card is clicked. |

## Notes

- React only. No other dependencies.
- The header is a disclosure button (`aria-expanded`, `aria-controls`). Tucked cards are `inert`. Escape folds the deck and returns focus.
- Card positions and the deck height come from the card count (76 px cards), so nothing is measured. Cards move by `transform` only.
- Reduced motion makes the fan-out instant and stops the bell.
