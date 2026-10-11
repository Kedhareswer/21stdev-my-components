# Water Ripple Carousel

A full-bleed image carousel where tapping drops a ripple: a ring of bending
water spreads from the tap, refracting the old picture at its edge, with the
next picture inside it. One WebGL fragment shader. Off-origin images need
CORS; without WebGL (or CORS) it simply cuts.

**No dependencies.** Slides without an `image` get a painted landscape (four
palettes, seeded), so it works with no assets at all.

```tsx
import WaterRippleCarousel from "@/components/ui/water-ripple-carousel"

<WaterRippleCarousel />
<WaterRippleCarousel slides={[{ image: "/work/01.jpg", title: "North Facade", caption: "Steel and glass, 2024." }]} />
```

| Prop | Default | |
|---|---|---|
| `slides` | six painted landscapes | `{ image?, title?, caption?, alt?, palette?, seed? }` |
| `height` | `"100svh"` | Any CSS length |
| `strength` | `1` | How strongly the ring bends the picture (0–2) |
| `duration` | `1900` | ms for the ring to cross the stage |
| `autoplay` | `6000` | ms per slide, `0` = off |
| `ink` | `#fff` | Text, buttons and progress line |
| `onChange` | | `(index) => void` |
Tap the picture (the transition starts where you tap), arrows, swipe, ←/→ and
autoplay that pauses off-screen; every slide is preloaded so a tap starts at
once. Reduced motion swaps the transition for a short fade.
