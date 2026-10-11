# Card Deck Carousel

Photos stacked like a loose deck of prints. Throw the top card in any direction
(drag and let go, or flick) and it flies off, then slides back in at the bottom
of the pile while the next one waits on top. The buttons, ←/→ and autoplay
throw it for you; "previous" pulls the last card back on top.

**No dependencies.** Slides without an `image` get a painted landscape. The
page colours follow `--color-background` / `--color-foreground`.

```tsx
import CardDeckCarousel from "@/components/ui/card-deck-carousel"

<CardDeckCarousel />
<CardDeckCarousel aspect="3 / 4" scatter={9} autoplay={0} slides={photos} />
```

| Prop | Default | |
|---|---|---|
| `slides` | six painted landscapes | `{ image?, title?, caption?, alt?, palette?, seed? }` |
| `height` | `"100svh"` | Any CSS length |
| `cardWidth` | `"min(78vw, 440px)"` | Width of a card |
| `aspect` | `"4 / 5"` | CSS aspect-ratio of a card |
| `scatter` | `6` | Largest tilt (deg) of the cards behind |
| `autoplay` | `4200` | ms per card, `0` = off; waits while someone interacts |
| `background` / `ink` | theme tokens | Page colours |
| `onChange` | | `(index) => void` |

Reduced motion squares the pile and swaps the throw for a fade.
