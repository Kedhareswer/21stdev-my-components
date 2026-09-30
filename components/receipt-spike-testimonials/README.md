# Receipt Spike Testimonials

Client reviews stuck on a receipt spike.

Each testimonial is a **torn slip**, punched through near the top and stacked
on a steel spike, every slip at its own careless angle. The top slip is the
one you read: a review number, a row of **pixel stars**, the quote, and the
customer's details on dot leaders, closed with a barcode.

- **Click the slip**, press **NEXT** or **→**: it is lifted up the spike, pulled off to the side, and filed at the bottom of the pile.
- **PREV** or **←**: the last slip comes back and drops onto the spike.
- Optional **autoplay**, paused while the pointer or focus is on it.

Part of the receipt family with [`receipt-portfolio`](../receipt-portfolio),
[`receipt-work-ledger`](../receipt-work-ledger) and
[`receipt-order-form`](../receipt-order-form).

**No dependencies.** React is the only import. The headline and stars are
5 × 7 bitmaps, the spike is SVG gradients, the hole is a CSS mask (you see
the slip underneath through it), and the angles are seeded from each slip so
the pile looks the same every visit.

## Usage

```tsx
import ReceiptSpikeTestimonials from "@/components/ui/receipt-spike-testimonials"

<ReceiptSpikeTestimonials
  testimonials={[
    { quote: "Clear estimates, clearer commits.", name: "Ada Mensah", role: "Founder, Tern", project: "Landing page", date: "01.2026", rating: 4 },
  ]}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `title` | `"Kind words"` | Pixel headline. `""` hides the header. |
| `testimonials` | six reviews | `{ quote, name, role?, project?, date?, rating? }[]`. `rating` is 0–5, default 5. |
| `startNo` | `1` | Number of the first review (`REVIEW №001`). |
| `autoplay` | `0` | ms between slips; `0` is off, minimum 1500. |
| `width` | `380` | Slip width in px; shrinks to fit. |
| `height` | `"100svh"` | Minimum scene height. **Must be a definite length.** |
| `wall` / `paper` / `ink` | family palette | |
| `labelInk` | `ink` | Headline, counter and hint, which sit on the wall. Set it light on a dark wall. |
| `fontMono` | Courier stack | No font is loaded. |
| `onChange` | none | `(index)` of the testimonial now on top. |
| `className` | `""` | Appended to the root. |

## Notes

- Only the top five slips are drawn; the rest stay hidden under them.
- Only the top slip is exposed to assistive tech; changes are announced politely.
- `prefers-reduced-motion`: slips swap instantly, no lift or throw.
