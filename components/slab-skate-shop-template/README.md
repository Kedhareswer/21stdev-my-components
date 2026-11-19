# Slab Skate Shop Template

A one-page skate shop. A preloader kickflips a deck while the brush wordmark paints in, then the wordmark flies into place on a plaster wall of decks. Pick a deck and the camera glides in to a frosted spec card; add it with a button that kickflips. The cart button tilts the camera down to the shop counter. The decks drop onto the wood, a split-flap board spells out the order, and the checkout drawer slides out of the counter. Below the wall are the lineup, the workshop, a lookbook, an about section on Kedhareswer, and the footer.

```tsx
import SlabSkateShopTemplate from "@/components/ui/slab-skate-shop-template"

export default function Page() {
  return <SlabSkateShopTemplate />
}
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | Height of the wall and the counter. Use a definite length, never a percentage. |
| `email` | `kedhareswer.12110626@gmail.com` | The about link and the footer. |
| `className`, `style` | | Passed to the root. |

## Built from two components

The wall and the counter are pasted copies of [`deck-rack-add-to-cart`](../deck-rack-add-to-cart) and [`flipboard-checkout-counter`](../flipboard-checkout-counter). They keep the same design and the same motion. A 21st file has to stand alone, so the code is copied rather than imported.

The copies differ from the originals only in these ways:
- Class names are re-scoped to `skr-` and `skc-`.
- The pictures load from this template's folder.
- There is one cart that lives in the page. The wall's button toggles a deck, and the counter changes quantities.
- The counter comes alive only when the camera reaches it.
- Both components' own top bars give way to the page nav.

If either component changes, re-run the paste rather than editing the copy by hand.

## Motion

- **Preloader:**
  - Progress follows the real image loads, with a 2.1 s minimum.
  - A deck kickflips in a loop and finishes its rotation before it lands.
  - The wordmark fills left to right.
  - On the way out the two halves of the curtain part. The loading wordmark flies into the wall wordmark's exact box (the same picture), then hands over to it. The decks drop onto their arms one by one with a swing.
- **Wall:** the deck rack's own camera zoom, frosted card and kickflip add button. After a deck is added, a small deck flies from the button into the nav cart. The count rolls over as it lands, and a toast offers **Checkout →**. The card shows the same link.
- **Wall to counter:**
  1. The card lets go and the page glides to the top.
  2. The camera tilts down while the wall pulls back and the counter rises into frame.
  3. The decks drop onto the wood and the board flaps in.
  4. Coming back reverses it.
- **Counter:** the counter's own drop, tumble-off and split-flap board. The checkout plaque glows and pulses while the cart has decks, and a **Checkout** pill sits in the header. Pay kickflips, the drawer slides home, and the board flaps to a thank-you. **New order** clears the counter and returns to the wall.
- **Sections:** fade up out of a blur as they arrive. The lookbook photo drifts against the scroll on an eased value, so it never snaps.

`prefers-reduced-motion` collapses every transition and animation to an instant and stops the kickflip loop.

## Notes

- **No dependencies beyond React.** No fonts are embedded: type follows the two components (Archivo Black or Arial Black, and Inter or Helvetica).
- **Pictures:** the five decks and the wordmark are shared with the two components. The workshop, lookbook and rack photos are ChatGPT-generated. All are served from `kedhar-components.pages.dev/slab-skate-shop-template/`.
- **Theme:** the wall and sections follow `--color-background` and `--color-foreground`, so a `.dark` host turns the room dark.
- **Layout:** below 760 px the nav drops its links, the wall and card stack (the components' portrait layout), the drawer becomes a full-width sheet, and the sections stack.
- **Copy:** the shop, decks and prices are placeholders. The about section is about Kedhareswer, and clients are Client 1, 2 and 3.
