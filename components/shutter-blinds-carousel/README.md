# Shutter Blinds Carousel

A full-bleed image carousel where the next picture swings in on horizontal
slats, like blinds tilting open one after another, while the old picture dims
behind them. Forward runs the slats top to bottom, back runs them bottom to top.

**No dependencies.** Slides without an `image` get a painted landscape (four
palettes, seeded), so it works with no assets at all.

```tsx
import ShutterBlindsCarousel from "@/components/ui/shutter-blinds-carousel"

<ShutterBlindsCarousel />
<ShutterBlindsCarousel slides={[{ image: "/work/01.jpg", title: "North Facade", caption: "Steel and glass, 2024." }]} />
```

| Prop | Default | |
|---|---|---|
| `slides` | six painted landscapes | `{ image?, title?, caption?, alt?, palette?, seed? }` |
| `height` | `"100svh"` | Any CSS length |
| `slats` | `9` | Number of slats |
| `duration` / `stagger` | `760` / `55` | ms per slat, ms between slats |
| `autoplay` | `6000` | ms per slide, `0` = off |
| `ink` | `#fff` | Text, buttons and progress line |
| `onChange` | | `(index) => void` |

Arrows, ←/→, swipe, autoplay that pauses off-screen, screen-reader
announcements; reduced motion swaps the transition for a fade.
