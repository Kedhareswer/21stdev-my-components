# Tiered Pricing Table

A SaaS pricing section on warm bone paper with a tangerine accent. The heading is set in a large serif, and a Monthly/Yearly switch has a sliding ink thumb and a −20 % badge. Below it sit three tier cards that rise in with a stagger.

- Prices roll digit by digit like an odometer when you switch billing or change seats. The full price shows struck through when yearly saves you money.
- The featured tier carries a gradient ring, a warm glow, a "Most popular" flag that pops in, and a filled CTA with a slow sheen.
- The Team tier has a seat stepper, and its price and yearly saving follow it.
- An ink Enterprise strip sits under the cards.
- "Compare all features" unfolds a grouped comparison table, with the featured column tinted.

Light or dark follows the host's `.dark` class.

No dependencies beyond React. Instrument Serif and Geist (Latin subset) are embedded.

```tsx
import TieredPricingTable from "@/components/ui/tiered-pricing-table"

<TieredPricingTable
  yearlyDiscount={0.2}
  onSelect={(tier, { billing, seats, total }) => router.push("/checkout?plan=" + tier + "&billing=" + billing + "&seats=" + seats)}
/>
```

## Props

| Prop | Default | What it does |
|---|---|---|
| `tiers` | Starter, Pro, Team | `{ id, name, blurb, monthly, perSeat?, featured?, cta, lead?, features }`. `monthly: null` shows "Let's talk". |
| `compare` | 10 rows in 4 groups | `{ group?, label, values }`. `values` holds one entry per tier: `true`, `false` or text. `[]` hides the comparison. |
| `yearlyDiscount` | `0.2` | Fraction off for yearly billing. |
| `currency` | `"$"` | Symbol. |
| `heading`, `sub` | – | Top copy. |
| `onSelect` | – | `(tierId, { billing, seats, total })`. `total` is the amount on the invoice (yearly is 12 × the monthly equivalent). |

## Accessibility

The billing switch is a `radiogroup` with a roving tabindex: Left and Right move it. Each tier is an `article` labelled by its name. The animated price is hidden from screen readers and replaced by one readable sentence ("$19 per month, billed yearly"). The seat input is labelled, clamped to 1–500, and has labelled − and + buttons. The comparison table has a caption and `scope`d headers, and check and dash cells say "Included" or "Not included". The fold uses `aria-expanded` and `aria-controls`. Once closed it turns `visibility:hidden`, so its contents leave the tab order. With `prefers-reduced-motion`, the rolls, staggers and sheen are off.
