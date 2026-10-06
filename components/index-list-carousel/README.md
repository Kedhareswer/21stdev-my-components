# Index List Carousel

A typographic index: big numbered titles on one side, one picture on the
other. Hover or tap a title and its picture wipes in over the last one — from
the right going down the list, from the left going up — and the active row
opens to show its caption. Stacks on small screens. Page colours follow the
theme tokens.

**No dependencies.** Slides without an `image` get a painted landscape (four
palettes, seeded), so it works with no assets at all.

```tsx
import IndexListCarousel from "@/components/ui/index-list-carousel"

<IndexListCarousel />
<IndexListCarousel slides={[{ image: "/work/01.jpg", title: "North Facade", caption: "Steel and glass, 2024." }]} />
```

| Prop | Default | |
|---|---|---|
| `slides` | six painted landscapes | `{ image?, title?, caption?, alt?, palette?, seed? }` |
| `height` | `"100svh"` | Any CSS length |
| `label` | `"Index"` | Small label above the list |
| `imageSide` | `"right"` | Put the picture on the `"left"` |
| `autoplay` | `4500` | ms per row, `0` = off; waits while the pointer is inside |
| `background` / `ink` | theme tokens | Page colours |
| `onChange` | | `(index) => void` |
Hover, tap, ↑/↓ or ←/→. Reduced motion swaps the wipe for a cut.
