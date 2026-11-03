# Sneaker Product Hero

A product-detail section for one shoe in several colourways, with no site
header of its own, so it drops under yours. The name and copy
sit on the left, the shoe floats in the middle, and the buy column is on the
right: sizes, rating, price, colour swatches, add to cart and a like button.

- **Colour swatch:** the shoe on show tilts up and out through the top while
  the new colourway rises in from below. The backdrop washes into that
  colourway's tint, and its name slides by in huge type behind the shoe.
- **Size:** each size carries its own price, star rating and review count.
  The price and count roll to their new values and the stars refill.
- **Photos:** the thumbnails and the "+N" chip open a gallery of every view,
  with arrows, a strip of all the photos, arrow keys and Escape.
- **Like:** the heart pops, throws a few small hearts and a pill says
  "Saved to favourites" (or "Removed from favourites").
- **Add to cart:** the button spins, turns green with a drawn tick and
  "ADDED", and a toast rises under the shoe naming the colour and size.
- **Stock:** tracked per size and per colour. A line under the sizes says
  "In stock", "Only N left in size 37" or "Sold out in this colour"; sizes a
  colour is out of are disabled, and switching colour moves off them.
- **Depth:** the shoe leans towards the pointer over a glossy floor
  reflection, the glow follows, and a band of light sweeps across it on every
  colour change. It floats slowly while the section is on screen.
- **Loupe:** hold the mouse on the shoe for a magnifier that follows the
  pointer. On touch, tapping the shoe opens the photos instead. In the photo
  viewer, click to zoom in and move to pan.

Below 760 px of width it stacks: title, shoe, buy column, then copy and
thumbnails. With reduced motion, everything changes in place.

```tsx
import SneakerProductHero from "@/components/ui/sneaker-product-hero"

<SneakerProductHero variants={colourways} />
<SneakerProductHero
  variants={colourways}
  sizes={[
    { label: "36", price: 240, rating: 4.2, reviews: 86 },
    { label: "37", price: 250, rating: 4.6, reviews: 142 },
    { label: "38", soldOut: true },
  ]}
  onAddToCart={({ variant, size, price }) => addToBag(variant.name, size, price)}
/>
```

```ts
type SneakerVariant = {
  name: string           // "Cobalt": swatch label, alt text, the word behind the shoe
  swatch: string         // any CSS colour
  tint?: string          // the backdrop's tint; defaults to swatch
  src: string            // side profile, toe left, transparent background
  gallery?: SneakerView[] // all photos; first 3 are thumbnails, the rest "+N"
  soldOut?: string[]     // size labels this colour is out of
  stock?: Record<string, number> // pairs left per size, for this colour
}
type SneakerView = { src: string; label?: string; focus?: [number, number]; zoom?: number; mirror?: boolean }
type SneakerSize = { label: string; soldOut?: boolean; price?: number; rating?: number; reviews?: number; stock?: number }
```

Without a `gallery`, a colourway gets seven framings of its one photo (side,
inside, heel, toe box, laces, midsole, collar). Pass real photos for real angles.

**Dependency: `gsap`** (declared in the root `package.json`).

## Props

| Prop | Default | Notes |
|---|---|---|
| `variants` | — | Required. One per colourway, all the same framing so the swap lines up. |
| `defaultVariant` | `0` | The colourway shown first. |
| `eyebrow`, `title`, `description` | demo copy | |
| `sizes` | 36–39, 38 sold out | Each may set `price`, `rating`, `reviews`; `soldOut` disables it. |
| `price`, `rating`, `reviews` | `250`, `4.5`, `120` | Used where a size doesn't set its own. |
| `currency` | `"$"` | Put before the price. |
| `lowStock` | `3` | At or below this many pairs the stock line warns "Only N left". |
| `toast` | `"Shopping Cart Updated"` | |
| `likeColor` | `#e11d48` | The liked heart and its burst. |
| `onAddToCart` | — | Called with the colourway, size and price. |
| `onLikeChange` | — | Called with the new liked state. |
| `height` | `"100svh"` | Minimum height. **Must be a definite length.** |

Colours come from the semantic tokens (`--color-background`,
`--color-foreground`, `--color-muted-foreground`) mixed with each colourway's
tint, so it follows light and dark. Product images need a transparent background to sit on both.

With reduced motion nothing floats, tilts or sweeps, and the cart button
skips its spinner.

The demo gives each colour two real angles (side and front three-quarter)
plus three close-ups framed from the side shot. Onyx's three-quarter shot is
recoloured from Cobalt's. The demo's shoe images are AI-generated for this component, show no real
brand, and are inlined as WebP.
