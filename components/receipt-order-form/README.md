# Receipt Order Form

A contact form filled in on an order slip, which the printer takes back and
answers with a receipt.

The slip hangs from the same chrome slot as the rest of the receipt family.
Name and email are typed on **dotted lines**, services are **line items with
− / + quantity keys**, budget and timeline are **bracketed options**, the
message is a **ruled box**. A running tally counts items and estimates weeks.

Press **PRINT ORDER**:

- missing or malformed fields print as inverted `ERR:` lines, and focus jumps to the first one;
- a valid order is **pulled up into the slot** in steps, then a **confirmation receipt** feeds out: order number, the lines you picked, budget, timeline, the estimate, a barcode, and `NEW ORDER`.

Part of the receipt family with [`receipt-portfolio`](../receipt-portfolio),
[`receipt-work-ledger`](../receipt-work-ledger) and
[`receipt-spike-testimonials`](../receipt-spike-testimonials).

**No dependencies.** React is the only import; nothing is loaded.

## Usage

```tsx
import ReceiptOrderForm from "@/components/ui/receipt-order-form"

<ReceiptOrderForm
  onSubmit={async (order) => {
    await fetch("/api/contact", { method: "POST", body: JSON.stringify(order) })
  }}
/>
```

`onSubmit` receives `{ name, email, company, services: { label, qty }[], budget, timeline, message, weeks, orderNo }`.
Return a promise and the printer **waits for it** before printing the
confirmation; throw and the slip comes back with your error message printed on it.

## Props

| Prop | Default | Notes |
|---|---|---|
| `title` / `confirmTitle` | `"Order"` / `"Thanks!"` | Pixel headlines on the slip and on the confirmation. |
| `series` / `startNo` | `"A"` / `1` | Order number `A-001`; each new order adds one. |
| `services` | logo, identity, packaging, font | `{ label, weeks?, max? }[]`. `weeks` per unit feeds the estimate; `max` caps the quantity (default 9). |
| `budgets` / `timelines` | three / three | Option labels. |
| `reply` | `"We reply within one working day"` | Small print on the confirmation. |
| `onSubmit` | none | See above. |
| `width` | `460` | Slip width in px; shrinks to fit. |
| `height` | `"100svh"` | Minimum wall height. **Must be a definite length.** |
| `wall` / `paper` / `ink` / `fontMono` | family palette | |
| `className` | `""` | Appended to the root. |

## Notes

- The estimate counts the longest line in full and every other week at half, rounded up: parallel work overlaps.
- An order is valid with a name, a well-formed email, and either one service or a message.
- Options are real radio groups (arrow keys move and select); quantities are `<output>`s announced politely.
- `prefers-reduced-motion`: no feed in or out; the confirmation simply replaces the slip.
