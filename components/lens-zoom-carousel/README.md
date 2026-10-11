# Lens Zoom Carousel

A full-bleed image carousel where the next picture lands like a fast zoom
pull: out of a soft, magnified blur with two fading ghost copies trailing it,
while the old picture falls back. Going back zooms out instead of in.

**No dependencies.** Slides without an `image` get a painted landscape (four
palettes, seeded), so it works with no assets at all.

```tsx
import LensZoomCarousel from "@/components/ui/lens-zoom-carousel"

<LensZoomCarousel />
<LensZoomCarousel slides={[{ image: "/work/01.jpg", title: "North Facade", caption: "Steel and glass, 2024." }]} />
```

| Prop | Default | |
|---|---|---|
| `slides` | six painted landscapes | `{ image?, title?, caption?, alt?, palette?, seed? }` |
| `height` | `"100svh"` | Any CSS length |
| `depth` | `1.35` | How far in the picture starts (scale) |
| `duration` | `1050` | ms for the zoom to land |
| `autoplay` | `6000` | ms per slide, `0` = off |
| `ink` | `#fff` | Text, buttons and progress line |
| `onChange` | | `(index) => void` |

Arrows, ←/→, swipe, autoplay that pauses off-screen, screen-reader
announcements; reduced motion swaps the transition for a fade.
