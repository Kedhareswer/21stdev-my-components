# Drifting Interest Picker

An onboarding step for choosing interests. Rows of glassy chips drift slowly sideways, alternating direction, and fade out at both edges. Hover or focus a row and it stops. Picking a chip floods it with its own colour, swaps its dot for a tick and sends a ring out from it. In the tray below, an odometer rolls to the new count, a trail of colour dots shows what you've picked, and "Continue" unlocks once you've picked enough.

```tsx
import DriftingInterestPicker from "@/components/ui/drifting-interest-picker"

<DriftingInterestPicker
  interests={[{ id: "film", label: "Film" }, { id: "jazz", label: "Jazz", color: "#ffb547" }]}
  min={3}
  onContinue={(ids) => saveInterests(ids)}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `interests` | required | `{ id, label, color?, icon? }[]`. Without `color`, each chip gets a hue from its position. `icon` (an emoji or node) shows in the dot. |
| `rows` | `4` | Items are dealt across the rows in turn. |
| `speed` | `48` | Seconds per lap. Each row runs a little slower than the one above. |
| `defaultValue` | `[]` | |
| `min` | `3` | Picks needed before Continue is enabled. |
| `title` / `subtitle` / `action` | "What are you into?" / … / "Continue" | |
| `onChange` / `onContinue` | none | Called with the picked ids. |

## Notes

- React only. No other dependencies.
- The drift is a pure CSS animation. Each row is drawn twice for a seamless loop, and the copy is `aria-hidden` with its chips out of the tab order.
- Chips are toggle buttons (`aria-pressed`) in a labelled group. The count is read out politely.
- Reduced motion stops the drift, drops the copy and lets the chips wrap.
- Give each row more chips than fit across the card, or the loop shows a gap.
