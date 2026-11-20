# Glass Fit Try-On

A virtual fitting room. Frosted product cards orbit a model on a ring. Pick a garment by clicking it, dragging or swiping the ring, using the arrow keys or the prev/next buttons. A scan line then sweeps down the figure and dresses him in it. Colour swatches recolour the garment on the model, the card and the thumbnail together. Size and add-to-bag report back through callbacks.

```tsx
import { GlassFitTryOn } from "@/components/ui/glass-fit-try-on"

<GlassFitTryOn onAddToBag={({ item, size, color }) => cart.add(item.id, size, color.name)} />
```

## Props

| Prop | Default | |
|---|---|---|
| `items` | five white tops | `{ id, name, price, look, mask, garment, colors?, sizes? }[]` |
| `backdrop` | sunlit room | Room photo behind the scene |
| `wordmark` | `"FIT"` | Ghost word behind the model |
| `eyebrow` | `"Virtual fitting room"` | Top-left chip (hidden on phones) |
| `addLabel` / `addedLabel` | `"Add to bag"` / `"Added"` | |
| `initialIndex` | `0` | |
| `ink`, `glass`, `accent`, `accentInk`, `scanColor`, `background` | warm neutrals | Scene colours |
| `height` | `"100svh"` | Any definite length |
| `onChange`, `onAddToBag` | | Receive `{ item, size, color }` |

## Your own garments

Every `look` must share one framing: same canvas size, the head at the same height and the figure centred. The scan wipes one look over the next, so a mismatch shows as a jump. The `mask` is the same size as the look and opaque only where the garment is. Shoot or generate garments in white or off-white. Colours are applied as a multiply tint, so the photographed shading survives, and the first colour should be `#ffffff`, which leaves the garment as shot. `garment` is a transparent cut-out, and the card tints it through its own alpha.

## Behaviour

- The try-on starts as soon as the selection changes. If you move on mid-scan, the next scan waits for the current one to finish and goes straight to your latest pick.
- Only sideways or shift+wheel scrolling turns the ring; vertical scrolling stays with the page. On touch, horizontal swipes turn the ring and vertical ones scroll the page.
- Keyboard: Tab reaches the visible cards, the prev/next buttons and the controls. Left/Right step the ring and Home/End jump. Sizes and colours are native radio groups. Changes are announced through a polite live region.
- `prefers-reduced-motion`: no scan, no parallax, and the ring jumps straight to the new position.
- Below 700 px wide the layout compacts: one control panel, a nav pill with the item name, and only the two side cards.

No dependencies beyond React. The pictures are hosted on kedhar-components.pages.dev and were generated in ChatGPT.
