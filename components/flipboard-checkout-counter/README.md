# Flipboard Checkout Counter

The checkout step of a skate shop, staged as a counter.

- The decks in the cart **drop onto the wood top** one after another, and a **split-flap board** lists them character by character, with the total flapping over last.
- **Quantities**: the brass `−` / `+` keys on each row change the count. Extra copies stack on the counter (up to three per deck) and the row and total re-flap.
- **Remove**: click a deck on the counter, or take its quantity to zero. It tips onto its edge and tumbles off the front.
- **Checkout** (the plaque) slides a frosted drawer out of the counter: email, shipping address, card, expiry and CVC.
- **Pay** is a little deck that kickflips. If a field is wrong it bails (a wobble) and the field turns red. Otherwise the drawer slides home and the board flaps to *Thank you · Order · Ships in 48 h*. The plaque becomes *New order*.

Only the counter top is 3D (a perspective plane); the board, plaque and drawer stay flat so the text renders crisp. Portrait stages (aspect under 4 : 5) hang the board on the wall above the counter and dock the drawer at the bottom.

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `products` | `{ id, name, price, image }[]` | five sample decks |
| `defaultItems` | `{ id, qty }[]` | Onyx and Garnet |
| `shopName` | `string` | `"Slab Skate Co."` |
| `backdropSrc` | wall art behind the counter | the sample brush wordmark |
| `currency` | `string` | `"$"` |
| `defaultDetails` | prefilled checkout fields | empty |
| `onCartChange` | `(lines) => void` | — |
| `onPay` | `({ id, lines, total, details }) => void` | — |
| `height` | CSS length | `"100svh"` |

## Notes

- No dependencies beyond React. Images load from `kedhar-components.pages.dev/flipboard-checkout-counter/`; pass your own. `onPay` only reports the order: wire it to your payment provider.
- The counter, board and drawer keep their own materials; the wall and floor follow `--color-background`, so light and dark themes both work.
- `prefers-reduced-motion`: decks appear without the drop or tumble, flaps land without cycling and the drawer switches without travel.
