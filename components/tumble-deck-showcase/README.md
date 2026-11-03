# Tumble Deck Showcase

A stack of website screenshots standing on edge, one behind the other. The
front card tips forward on its bottom edge and lands flat on the floor, the deck
slides up, and the next one falls. It's scroll-driven: the wheel, a trackpad
or a drag scrubs the deck, so the cards tip as fast as you scroll. It never runs
out, because the first card is already standing behind the last one, in both
directions. Use it for a portfolio, a template gallery or
a "sites we built" strip.

Requires `gsap`. It's pure CSS 3D: one perspective, with every card hinged on
the same floor line. GSAP drives a single deck position, and each card's pose
is worked out from it. A small pool of card elements is recycled along the
deck, so the DOM stays the same size however many cards you pass.

```tsx
import TumbleDeckShowcase from "@/components/ui/tumble-deck-showcase"

<TumbleDeckShowcase
  cards={[
    { src: "/shots/studio.webp", alt: "Studio site" },
    { src: "/shots/shop.webp", alt: "Shop site" },
    // …
  ]}
/>
```

| Prop | Default | |
|---|---|---|
| `cards` | (required) | `{ src, alt? }[]`, cropped to the card from the top |
| `height` | `"100svh"` | Any CSS length |
| `aspect` | `2.06` | Card width ÷ height |
| `scrollPerCard` | `240` | Wheel / trackpad travel (px) that tips one card |
| `depth` | `5` | Upright cards visible behind the front one |
| `background` | `var(--color-background)` | Page colour |

Scroll or drag up to tip the next card and down to lift the last one back up.
When you stop, the deck settles on the nearest whole card. A click, Space, Enter
or → steps forward, and ← steps back. There's no autoplay.

The deck takes the wheel and touch while the pointer is over it (`touch-action:
none`), so on a full-height page it holds the scroll until you leave it. With
reduced motion turned on there's no scrubbing: each step jumps straight to the
next whole card.

Demo images are covers of my own templates, inlined as WebP.
