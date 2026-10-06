# Split Pane Carousel

A full-bleed image carousel where a glowing hairline seam draws across the
picture, then the two halves slide apart like doors to reveal the next picture
settling in underneath.

**No dependencies.** Slides without an `image` get a painted landscape (four
palettes, seeded), so it works with no assets at all.

```tsx
import SplitPaneCarousel from "@/components/ui/split-pane-carousel"

<SplitPaneCarousel />
<SplitPaneCarousel slides={[{ image: "/work/01.jpg", title: "North Facade", caption: "Steel and glass, 2024." }]} />
```

| Prop | Default | |
|---|---|---|
| `slides` | six painted landscapes | `{ image?, title?, caption?, alt?, palette?, seed? }` |
| `height` | `"100svh"` | Any CSS length |
| `axis` | `"vertical"` | Split down the middle or `"horizontal"` across it |
| `duration` | `1250` | ms for the seam and the parting |
| `autoplay` | `6000` | ms per slide, `0` = off |
| `ink` | `#fff` | Seam, text, buttons and progress line |
| `onChange` | | `(index) => void` |

Arrows, ←/→, swipe, autoplay that pauses off-screen, screen-reader
announcements; reduced motion swaps the transition for a fade.
