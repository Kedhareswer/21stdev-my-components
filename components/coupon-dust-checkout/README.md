# Coupon Dust Checkout

A dark checkout sheet where applying a coupon is a small piece of physics. Tap a holographic coupon and it dissolves from left to right behind a ragged edge, into iridescent dust that hangs and twinkles for a beat. The dust then streams off in one ribbon. It rises over the next coupon, swoops down the right side of the sheet and curls back into a slot that opens beside the order total. There it rebuilds as a miniature of the same coupon, left to right, and comes into focus. The total lifts to make room for a green *You save* line, and its digits blur and tumble into the new amount. Last, the coupon row fades out and an *applied* banner fades in where it was. The banner's close button puts everything back and rolls the total up again.

**Place order** finishes the story. The button folds into a circle with a spinner, turns green with a drawn check, and the sheet blurs away. In its place an *Order placed* view rises in: a scalloped badge pops in with a ring of the same iridescent dust, then the order number and amount paid, what the coupon saved, and the delivery estimate. *Back to checkout* fades the sheet back in, fresh. The receipt is frozen at the moment of the press, so nothing on it changes while it fades out.

Every grain of dust leaves from a point on the coupon and lands on the matching point of the miniature, tinted from the same gradient. The thing that arrives is the thing that left.

It needs nothing beyond React. The coupons are CSS gradients, so there are no images to host.

```tsx
import CouponDustCheckout from "@/components/ui/coupon-dust-checkout"

<CouponDustCheckout
  subtotal={89}
  currency="€"
  address="Kastanienallee 12, 10435 Berlin"
  coupons={[
    { code: "WELCOME20", percent: 20 },
    { code: "SPRING35", percent: 35, tint: [[0, "#ffe2c7"], [0.5, "#ffd0e8"], [1, "#e4ddff"]] },
  ]}
  onApply={(code, saving) => console.log(code, saving)}
  onPlaceOrder={(total) => console.log(total)}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `coupons` | three demo coupons | `{ code, percent, tint? }`. `tint` is a list of gradient stops `[position 0–1, hex]`, shared by the ticket and its dust. |
| `subtotal` | `134` | Items total before any discount. The discount applies to this, shipping is added on top. |
| `currency` | `"$"` | Prefix for every amount. |
| `address` | made-up street | One line, cut with an ellipsis if it runs long. |
| `shipping` | Standard free / Express 12 | `[label, eta, price][]`. Changing it re-rolls the total. |
| `height` | `"100svh"` | Height of the stage the card is centred in. |
| `onApply`, `onPlaceOrder` | — | Fired with the code and saving, and with the final total at the press. |

## Timing

Measured frame by frame off a 60 fps reference, from the tap:

| | |
|---|---|
| 0.13–0.45 s | the coupon dissolves left to right |
| 0.5–0.92 s | dust leaves in the same order, ~0.48 s each along the curve |
| 0.85 s | the slot beside the total opens |
| ~1.0–1.45 s | dust lands and the chip rebuilds, then sharpens |
| 1.45 s | the *You save* line opens and the digits roll (~0.38 s) |
| 1.8 s | coupons fade out, then the banner fades in |

Place order, from the press: spinner at once, check at 1.15 s, the order view at 1.55 s, and the dust burst as the badge lands. The order flow is not in the reference; it is designed to match it.

## Notes

- The card has a fixed height (438 px) and fixed block heights, so the stage never re-centres while the dust is flying. Its width follows the container up to 420 px.
- The coupon row scrolls sideways and fades at the card edges, so a coupon that runs past the edge reads as "more this way" rather than cut off.
- The dust paths are computed from that fixed geometry and the coupon row's scroll position. Nothing reads layout.
- The card is always dark, like the instrument it imitates. The stage behind it uses `--color-background`.
- Coupons, the close button, *Place order* and *Back to checkout* are real buttons. *Place order* is disabled while dust is in flight. Delivery speed is a radio group. The applied state and the placed order are announced through an `aria-live` region.
- With `prefers-reduced-motion: reduce` there is no dust, no roll, no spinner rotation and no burst. The coupon is applied in one step, and the order view arrives after 0.8 s, with short fades throughout.
