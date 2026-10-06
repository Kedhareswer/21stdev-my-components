# Aperture Carousel

A full-bleed image carousel where the next picture opens through a circular
iris that grows from wherever you click, with a hairline ring riding its edge.
Titles rise out of a mask, a hairline fills toward the next slide, and the
cursor becomes a small "Next / Prev" lens.

Click the right half for next and the left half for previous, swipe, or use ←/→.
Autoplay runs on the progress line and pauses off-screen.

**No dependencies.** Slides without an `image` get a painted landscape (four
palettes, seeded), so it works with no assets at all.

```tsx
import ApertureCarousel from "@/components/ui/aperture-carousel"

<ApertureCarousel />
<ApertureCarousel
  height={640}
  autoplay={0}
  slides={[
    { image: "/work/01.jpg", title: "North Facade", caption: "Steel and glass, 2024." },
    { title: "Painted", palette: "dusk", seed: 7 },
  ]}
/>
```

| Prop | Default | |
|---|---|---|
| `slides` | six painted landscapes | `{ image?, title?, caption?, alt?, palette?, seed? }` |
| `height` | `"100svh"` | Any CSS length |
| `autoplay` | `6000` | ms per slide, `0` = off |
| `duration` | `1100` | ms for the iris to open |
| `ink` | `#fff` | Ring, text, counter and cursor lens |
| `plainCursor` | `false` | Keep the normal cursor |
| `onChange` | | `(index) => void` |

Reduced motion swaps the iris for a short fade.
