# Scrubber Carousel

A full-bleed picture with a video-style timeline. Move across it (or drag on
touch) and the photos flick past like scrubbing through footage, with a
playhead, frame marks, a ticking timecode and the frame's title. Left alone it
plays slowly on its own.

**No dependencies.** Slides without an `image` get a painted landscape (four
palettes, seeded), so it works with no assets at all.

```tsx
import ScrubberCarousel from "@/components/ui/scrubber-carousel"

<ScrubberCarousel />
<ScrubberCarousel slides={[{ image: "/work/01.jpg", title: "North Facade", caption: "Steel and glass, 2024." }]} />
```

| Prop | Default | |
|---|---|---|
| `slides` | six painted landscapes | `{ image?, title?, caption?, alt?, palette?, seed? }` |
| `height` | `"100svh"` | Any CSS length |
| `autoplay` | `3200` | ms each photo plays for when idle, `0` = off |
| `fps` | `24` | Frame rate of the timecode |
| `ink` | `#fff` | Timeline, timecode and text |
| `onChange` | | `(index) => void` |
Hover or drag to scrub, ←/→ to step a frame. Reduced motion steps photo by photo instead of sweeping.
