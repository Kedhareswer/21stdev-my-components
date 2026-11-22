# Deck Rack Add To Cart

A skate-shop product picker. Five decks hang on a wall over a brush-painted wordmark.

- **Hover** a deck and it swings off the wall on its arm.
- **Click** it and the camera glides in; a frosted card fades up with the name, specs and price.
- **Add to cart** is a little deck of its own: it kickflips (trucks and wheels show mid-air) and lands as *In your cart*. The cart count in the corner rolls over as it lands. Press again to take it out (a heelflip the other way).
- **Back to the wall**, `Esc` or a click on the wall pulls the camera back.

The zoom never scales a layer with `transform`: sizes and positions come from registered CSS custom properties (`@property --dr-k`, `--dr-cx`, …) that transition on the scene, so the deck art stays sharp at every step. Portrait stages (aspect under 4 : 5) zoom higher and dock the card at the bottom.

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `decks` | `Deck[]` (`id, name, tagline, price, image, specs, x`) | five sample decks |
| `wordmarkSrc` | transparent image, about 2.4 : 1 | the sample "SLAB" brush mark |
| `shopName` | `string` | `"Slab Skate Co."` |
| `currency` | `string` | `"$"` |
| `defaultCart` | `string[]` | `[]` |
| `onCartChange` | `(ids: string[]) => void` | — |
| `height` | CSS length | `"100svh"` |

`x` places a deck on the wall in wall units; the wordmark spans roughly −31 … 31.

## Notes

- The stage is `width: 100%` by `height` and has no intrinsic size (everything in it is positioned), so it fills whatever width its parent gives it, including a centring flex parent such as the 21st preview. Below about 820px wide the card keeps a 19.5rem floor, and under about 580px the add-to-cart button drops below the price.
- Publishing: `21st render` builds this but cannot photograph it (the capture sandbox blocks the hosted images: `Capture request left its allowed origin`), so publish with `--preview`.
- No dependencies beyond React. Images load from `kedhar-components.pages.dev/deck-rack-add-to-cart/` (generated decks and wordmark); pass your own.
- Uses only the semantic tokens (`--color-background`, `--color-foreground`, `--color-muted-foreground`), so the wall and glass follow light and dark themes.
- `prefers-reduced-motion`: the camera and card switch without travel, the flip is skipped and the label changes in place.
- Registered custom properties need Chrome 85+, Safari 16.4+ or Firefox 128+; older browsers jump between states instead of gliding.
