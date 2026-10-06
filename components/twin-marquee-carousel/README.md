# Twin Marquee Carousel

Two rows of photos drifting in opposite directions, endlessly. Hover the band
and both rows stop; the photo under the pointer lifts while the rest fade back.
Click (or Enter) opens it full size in a lightbox; ←/→ step, Esc or a click
closes. Page colours follow the theme tokens.

**No dependencies.** Slides without an `image` get a painted landscape (four
palettes, seeded), so it works with no assets at all.

```tsx
import TwinMarqueeCarousel from "@/components/ui/twin-marquee-carousel"

<TwinMarqueeCarousel />
<TwinMarqueeCarousel slides={[{ image: "/work/01.jpg", title: "North Facade", caption: "Steel and glass, 2024." }]} />
```

| Prop | Default | |
|---|---|---|
| `slides` | six painted landscapes | `{ image?, title?, caption?, alt?, palette?, seed? }` |
| `height` | `"100svh"` | Any CSS length |
| `cardHeight` | `"min(28vh, 260px)"` | Photo height |
| `speed` | `7` | Seconds per photo of drift; higher is slower |
| `background` / `ink` | theme tokens | Page colours |
| `onOpen` | | `(index) => void` when the lightbox opens |
Pauses off-screen. Reduced motion stops the drift and lets the rows scroll by hand.
