# Serum Product Card

A dark teal buy section for a single product. The card pairs a moody product photograph with:

- the name and a one-line promise;
- the price, beside the size pills;
- a wide pale "Add to bag" pill that carries the price;
- the shipping and returns lines;
- an ingredients accordion.

**No dependencies.** React is the only import.

## Motion

| What | How |
|---|---|
| Entry | The card rises 44 px and fades in (0.8 s, `cubic-bezier(.2,.7,.2,1)`) when a quarter of the section is on screen. A card that is already on screen at load never hides itself. |
| Size | The selected pill turns blush. The price rolls up to the new amount in both places it shows (0.38 s). |
| Add to bag | The label slides up and out, "✓ Added to bag" slides in, and after 1.6 s it settles back. |
| Ingredients | The panel opens on a `grid-template-rows` transition, and the plus turns into a cross. |
| Reduced motion | Everything is instant. The card never starts hidden. |

## Layout

- The photo takes 46% of the card and the details take 54%. Below 720 px the card stacks, with a square photo on top.
- The section is a centred grid with equal gutters (`clamp(16px, 4.4vw, 72px)`). The card is at most 920 px wide.
- The sizes are a radio group: arrow keys move the selection, and only the selected pill is in the tab order.

## Usage

```tsx
import SerumProductCard from "@/components/ui/serum-product-card"

<SerumProductCard />
<SerumProductCard
  name="Barrier Cream"
  sizes={[{ label: "50 ml", price: 38 }, { label: "100 ml", price: 62 }]}
  onAddToBag={(size) => addToCart(size)}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `name` | `"Hyaluronic Serum"` | |
| `tagline` | `"Soft, calm skin from the first week."` | |
| `sizes` | 30 ml $64, 50 ml $86 | `{ label, price }[]`. |
| `currency` | `"$"` | Put before the price. Whole numbers show without decimals. |
| `notes` | shipping and returns | Lines under the button. |
| `ingredients` | eleven | Listed in the accordion. Their count goes into its label. |
| `imageSrc` / `imageAlt` | the catalog photo | |
| `addLabel` / `addedLabel` | `"Add to bag"` / `"Added to bag"` | |
| `onAddToBag` | — | Receives the selected size. |
| `height` | `100svh` | Minimum height of the section. Must be a definite length. |
| `fontHref` | Google Fonts (Instrument Sans) | Pass `null` to bring your own. |

## Notes

- The photograph was generated with ChatGPT and is served from the catalog site.
- It assumes no theme tokens. The dark teal is its own palette, so it looks the same in light and dark.
