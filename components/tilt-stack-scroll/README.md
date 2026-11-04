# Tilt Stack Scroll

Full-bleed photo cards that stack as the page scrolls. The stage sticks, and each scroll step brings the next card up from below: it arrives tilted back and slightly turned, then lands flat. The cards underneath tip away, shrink and darken, so the pile reads as real depth. A counter and progress rail track the position, and by default the scroll settles on the nearest card.

Each card carries a big serif index, a kicker chip, title, copy, tag chips, a price and a call to action tinted with the card's own accent.

```tsx
import TiltStackScroll from "@/components/ui/tilt-stack-scroll"

<TiltStackScroll
  eyebrow="Summer routes"
  heading="Five ways up the mountain"
  cards={[
    { title: "Above the Cloud Sea", kicker: "7 days · Valais", description: "Hut to hut…", image: "/sea.webp", tags: ["Guide"], price: "€1,840", priceNote: "per person", accent: "#f6c177" },
    { title: "Meadow at First Light", description: "An easy start…", image: "/dawn.webp", href: "/routes/meadow" },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `cards` | required | `{ title, description, image, kicker?, alt?, tags?, price?, priceNote?, cta?, href?, accent? }[]`. Landscape photos. |
| `eyebrow` | `"Routes"` | Mono label over the heading. |
| `heading` | `"Five ways up the mountain"` | Serif heading; its words rise in on load. |
| `height` | `"100svh"` | Height of the sticky stage. The section is `height × cards` tall. |
| `snap` | `true` | Settle on the nearest card when scrolling stops. |
| `className` | `""` | On the scroll track. |

## Notes

- Every card's transform comes from `pose(progress, index)`. The translate is a percentage of the card's own height, so nothing is measured while scrolling; the scroll position comes from ScrollTrigger.
- Uses `gsap` and `gsap/ScrollTrigger` (in the root `package.json`).
- Reduced motion: no tilt, slide or snap. Cards crossfade in place and the ones underneath dim.
- The demo inlines five free Unsplash photos as small WebP so it makes no off-origin requests.
