# Comet Orbit Button

An obsidian action button that shows its own progress. Click it and a champagne comet starts circling the border, trailing a soft blurred glow, while the label slides up into a shimmering "Processing". When the action settles the comet's tail closes into a full ring: jade with a check that draws itself and a ripple for success, coral with a shake for failure. Then it slides back to rest.

Hovering at rest sets a faint comet drifting round, so it reads as live before it's pressed. It eases in on mount. Under `prefers-reduced-motion` the ring is static and the labels swap without movement.

```tsx
import CometOrbitButton from "@/components/ui/comet-orbit-button"

<CometOrbitButton
  label="Withdraw $1,240.00"
  doneLabel="Sent to •• 4021"
  onAction={() => api.withdraw(1240)}   // a promise holds the orbit; a rejection shows the error ring
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `label` | `"Withdraw $1,240.00"` | Resting label. |
| `busyLabel` | `"Processing"` | Label while the comet orbits. |
| `doneLabel` | `"Sent to •• 4021"` | Label on success. |
| `errorLabel` | `"Declined — try again"` | Label on failure. |
| `onAction` | none | Runs on click. Return a promise to hold the orbit until it settles. A throw or rejection shows the error state. Without it the button plays the success path. |
| `minBusy` | `1800` | The orbit always runs at least this many ms so it reads, even if the action is instant. |
| `resetAfter` | `2800` | ms after done / error before it returns to rest. `0` stays put. |
| `accent` | `#f2d6a2` | Comet colour. |
| `success` | `#63e2ae` | Success ring colour. |
| `width` | `320` | Any CSS width. Capped at 100% of the parent. |
| `font` | system sans stack | CSS `font-family`. |

Clicks are ignored while busy (`aria-disabled`), and each state change is announced through a polite live region. The comet is a CSS `@property` angle animation, so no JavaScript runs per frame. No dependencies beyond React.
