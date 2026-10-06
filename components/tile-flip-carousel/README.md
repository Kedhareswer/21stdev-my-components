# Tile Flip Carousel

A full-bleed image carousel where the picture breaks into a grid of tiles that
flip over in a wave spreading from where you tap, each tile carrying its piece
of the next picture on its back.

**No dependencies.** Slides without an `image` get a painted landscape (four
palettes, seeded), so it works with no assets at all.

```tsx
import TileFlipCarousel from "@/components/ui/tile-flip-carousel"

<TileFlipCarousel />
<TileFlipCarousel slides={[{ image: "/work/01.jpg", title: "North Facade", caption: "Steel and glass, 2024." }]} />
```

| Prop | Default | |
|---|---|---|
| `slides` | six painted landscapes | `{ image?, title?, caption?, alt?, palette?, seed? }` |
| `height` | `"100svh"` | Any CSS length |
| `cols` / `rows` | `10` / `6` | Tile grid |
| `duration` | `1500` | ms for the whole wave |
| `autoplay` | `6000` | ms per slide, `0` = off |
| `ink` | `#fff` | Text, buttons and progress line |
| `onChange` | | `(index) => void` |
Tap the picture (the transition starts where you tap), arrows, swipe, ←/→ and
autoplay that pauses off-screen; every slide is preloaded so a tap starts at
once. Reduced motion swaps the transition for a short fade.
