# Tumble Deck Showcase

A stack of website screenshots standing on edge, one behind the other. The
front card tips forward on its bottom edge and lands flat on the floor, the deck
slides up, and the next one falls. After the last card the pile rewinds, with
the cards swinging back up faster. Use it for a portfolio, a template gallery or
a "sites we built" strip.

Requires `gsap`. It's pure CSS 3D: one perspective, with every card hinged on
the same floor line. GSAP drives a single deck position, and each card's pose
is worked out from it.

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
| `dwell` | `0.26` | Seconds a card stands at the front |
| `fall` | `0.42` | Seconds for one fall |
| `rewind` | `0.32` | Seconds per card on the way back up |
| `autoplay` | `true` | `false` steps only on click / keys |
| `depth` | `5` | Upright cards visible behind the front one |
| `background` | `var(--color-background)` | Page colour |

Click or press Space, Enter or → for the next card, and ← for the previous one.
Autoplay pauses on hover and while the deck is off screen. With reduced motion
turned on there's no autoplay, and a step jumps straight to the next card.

Demo images are covers of my own templates, inlined as WebP.
