# RGB Glitch Carousel

A full-bleed image carousel that cuts between pictures with a signal glitch:
for a split second the picture tears into horizontal bands and its red, green
and blue channels slide apart, then it snaps back as the next picture. Canvas
2D, no WebGL.

**No dependencies.** Slides without an `image` get a painted landscape (four
palettes, seeded), so it works with no assets at all.

```tsx
import RgbGlitchCarousel from "@/components/ui/rgb-glitch-carousel"

<RgbGlitchCarousel />
<RgbGlitchCarousel slides={[{ image: "/work/01.jpg", title: "North Facade", caption: "Steel and glass, 2024." }]} />
```

| Prop | Default | |
|---|---|---|
| `slides` | six painted landscapes | `{ image?, title?, caption?, alt?, palette?, seed? }` |
| `height` | `"100svh"` | Any CSS length |
| `intensity` | `1` | How hard the picture tears (0–2) |
| `duration` | `700` | ms for the cut |
| `autoplay` | `6000` | ms per slide, `0` = off |
| `ink` | `#fff` | Text, buttons and progress line |
| `onChange` | | `(index) => void` |
Tap the picture (the transition starts where you tap), arrows, swipe, ←/→ and
autoplay that pauses off-screen; every slide is preloaded so a tap starts at
once. Reduced motion swaps the transition for a short fade.
