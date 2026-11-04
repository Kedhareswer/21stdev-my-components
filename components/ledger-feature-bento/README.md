# Ledger Feature Bento

A four-card bento for a product's feature section, where every card runs a small live loop instead of a static illustration. Receipts drop into an inbox with a spring and push the older ones back. A glowing ring fills to the matched percentage. Approval rows tick green one after another. A month-end summary types itself out beside a chart line that draws in. The cards rise in with a stagger when the bento scrolls into view, and every loop pauses when it leaves.

Dark green-black cards with glass panels and a lime accent, so it reads on light and dark pages alike.

```tsx
import LedgerFeatureBento from "@/components/ui/ledger-feature-bento"

<LedgerFeatureBento
  heading="Bookkeeping that"
  headingAccent="keeps itself."
  matched={1284}
  total={1290}
  receipts={[{ merchant: "Figma", amount: "€45.00", category: "Software", color: "#a259ff" }]}
  approvals={[{ who: "MK", what: "Offsite venue", amount: "€2,400", approver: "Finance" }]}
  summary={["Revenue up 12% on September.", "Three invoices past 30 days."]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `eyebrow`, `heading`, `headingAccent`, `description` | Ledgerline copy | Section header; `headingAccent` gets the green gradient. |
| `features` | four entries | `{ title, body }[]` for the four cards, in order. |
| `receipts` | five receipts | `{ merchant, amount, category, color? }[]`; cycles through the inbox card. |
| `matched` / `total` | `1284` / `1290` | Drives the ring percentage and the two chips. |
| `approvals` | three rows | `{ who, what, amount, approver }[]`; the first three show. |
| `summary` | three lines | Lines that type out in the month-end card. |
| `height` | `"100svh"` | Minimum height of the section. |
| `className` | `""` | On the section. |

## Notes

- The loops are CSS keyframes started by an `IntersectionObserver`; the receipt inbox is one interval that only runs while the bento is on screen. Nothing is measured.
- Reduced motion: no entrance, no loops, no new receipts. Every card shows its finished state.
- No images and no dependencies beyond React.
