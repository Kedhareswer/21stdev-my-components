# Hanger Rail Try-On

A virtual fitting room. Garments hang on a clothes rail above a model. Slide the rail by dragging, swiping, using the arrow keys or the prev/next buttons, or click a hanger. The garment in the middle lifts off its hanger, and a scan line sweeps down the figure and dresses him in it. The empty hanger stays on the rail above his head. Hangers sway as the rail moves and settle on a damped spring. Colour swatches recolour the garment on the model, on its hanger and in the thumbnail. Size and add-to-bag report back through callbacks.

The panels are solid paper with hairline borders and serif names, with no blur. Each rail label is a paper swing tag, so it stays readable over any backdrop.

```tsx
import { HangerRailTryOn } from "@/components/ui/hanger-rail-try-on"

<HangerRailTryOn onAddToBag={({ item, size, color }) => cart.add(item.id, size, color.name)} />
```

## Props

| Prop | Default | |
|---|---|---|
| `items` | five white tops | `{ id, name, price, kind?, look, mask, garment, colors?, sizes? }[]` |
| `backdrop` | sunlit room | Room photo behind the scene |
| `eyebrow` | `"Virtual fitting room"` | Top-left label (hidden on phones) |
| `addLabel` / `addedLabel` | `"Add to bag"` / `"Added"` | |
| `initialIndex` | `0` | |
| `ink`, `paper`, `line`, `rail`, `scanColor`, `background` | warm neutrals, brass rail | Scene colours |
| `height` | `"100svh"` | Any definite length |
| `onChange`, `onAddToBag` | | Receive `{ item, size, color }` |

## Your own garments

Every `look` must share one framing: same canvas size, the head at the same height and the figure centred. The scan wipes one look over the next, so a mismatch shows as a jump. The `mask` is the same size as the look and opaque only where the garment is. Shoot or generate garments in white or off-white. Colours are applied as a multiply tint, so the photographed shading survives, and the first colour should be `#ffffff`, which leaves the garment as shot.

`garment` is a square transparent cut-out with the collar near the top edge, because it hangs from there. The hanger and the thumbnail tint it through its own alpha.

## Behaviour

- The try-on starts as soon as the selection changes. If you move on mid-scan, the next scan waits for the current one to finish and goes straight to your latest pick.
- The rail follows a drag one-to-one and snaps with a little momentum. Only sideways or shift+wheel scrolling moves it; vertical scrolling stays with the page. On touch, horizontal swipes move the rail and vertical ones scroll the page.
- Keyboard: Tab reaches the visible hangers, the prev/next buttons and the controls. Left/Right step the rail and Home/End jump. Sizes and colours are native radio groups. Changes are announced through a polite live region.
- `prefers-reduced-motion`: no scan, no sway, no parallax, and the rail jumps straight to the new position.
- Below 700 px wide the layout compacts: one control panel, one neighbour on each side of the rail, and a figure that fades out above the panel.

No dependencies beyond React. The pictures are hosted on kedhar-components.pages.dev and were generated in ChatGPT.
