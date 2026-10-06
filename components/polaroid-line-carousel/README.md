# Polaroid Line Carousel

Instant photos pegged to a sagging string. Drag the line and the prints slide
along it, swinging on their pegs with the speed you give them and settling
back; at rest they sway in a light breeze. Click a print to bring it to the
middle. Page colours follow the theme tokens.

**No dependencies.** Slides without an `image` get a painted landscape (four
palettes, seeded), so it works with no assets at all.

```tsx
import PolaroidLineCarousel from "@/components/ui/polaroid-line-carousel"

<PolaroidLineCarousel />
<PolaroidLineCarousel slides={[{ image: "/work/01.jpg", title: "North Facade", caption: "Steel and glass, 2024." }]} />
```

| Prop | Default | |
|---|---|---|
| `slides` | six painted landscapes | `{ image?, title?, caption?, alt?, palette?, seed? }` |
| `height` | `"100svh"` | Any CSS length |
| `cardWidth` | `300` | Print width, px (shrinks to fit) |
| `sag` / `swing` | `46` / `1` | String sag in px; swing strength, `0` = still |
| `autoplay` | `4500` | ms per print, `0` = off; waits while someone interacts |
| `string` | `#8a7f72` | String colour |
| `background` / `ink` | theme tokens | Page colours |
| `onChange` | | `(index) => void` |

Arrows, ←/→, swipe, autoplay that pauses off-screen, screen-reader
announcements; reduced motion swaps the transition for a fade.
