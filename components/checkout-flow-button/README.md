# Checkout Flow Button

A whole payment in one black pill. "Pay $129.00" springs wider into a row of saved cards that deal in one after another; pick one and the pill settles around a mini card and "Confirm $129.00". Confirm and a lit bar fills the pill from the left with a sheen running through it while it reads "Authorizing". It finishes jade green with a check that draws itself and the receipt number, then returns to rest. A decline shakes the pill and offers another card.

Every step is a real button inside the pill, so it works by keyboard and screen reader, and focus follows the step as the contents swap. Under `prefers-reduced-motion` the width and contents change without travel.

```tsx
import CheckoutFlowButton from "@/components/ui/checkout-flow-button"

<CheckoutFlowButton
  amount="$129.00"
  cards={[{ id: "visa", name: "Personal", last4: "4242", from: "#3b3f46", to: "#0f1013" }]}
  onPay={(card) => api.charge(card.id)}   // a rejection shows the decline step
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `amount` | `"$129.00"` | Formatted amount shown on Pay and Confirm. |
| `cards` | three sample cards | `{ id, name, last4, from, to }[]`. Up to three are shown; `from`/`to` colour the chip. |
| `onPay` | none | `(card) => Promise \| void`. A rejection or throw shows the decline step. |
| `receipt` | `"Paid · Receipt A-2931"` | Success text. |
| `resetAfter` | `3200` | ms after done / decline before it returns to Pay. `0` stays put. |
| `minBusy` | `1900` | The authorizing bar always runs at least this long, and fills over exactly this time. |
| `font` | system sans stack | CSS `font-family`. |

The pill's width per step is fixed (214 / 356 / 306 / 260 px) and capped at the parent's width, so nothing is measured. No dependencies beyond React.
