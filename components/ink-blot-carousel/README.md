# Ink Blot Carousel

A full-bleed image carousel where the next picture spreads in like ink soaking
into paper: a ragged blot blooms from where you tap, throws satellite drops and
runs together until it fills the frame. An SVG mask with a turbulence filter,
no WebGL.

**No dependencies.** Slides without an `image` get a painted landscape (four
palettes, seeded), so it works with no assets at all.

```tsx
import InkBlotCarousel from "@/components/ui/ink-blot-carousel"

<InkBlotCarousel />
<InkBlotCarousel slides={[{ image: "/work/01.jpg", title: "North Facade", caption: "Steel and glass, 2024." }]} />
```

| Prop | Default | |
|---|---|---|
| `slides` | six painted landscapes | `{ image?, title?, caption?, alt?, palette?, seed? }` |
| `height` | `"100svh"` | Any CSS length |
| `bleed` | `90` | How ragged the ink edge is (px of displacement) |
| `duration` | `2400` | ms for the blot to fill the frame |
| `autoplay` | `6000` | ms per slide, `0` = off |
| `ink` | `#fff` | Text, buttons and progress line |
| `onChange` | | `(index) => void` |
Tap the picture (the transition starts where you tap), arrows, swipe, ←/→ and
autoplay that pauses off-screen; every slide is preloaded so a tap starts at
once. Reduced motion swaps the transition for a short fade.
