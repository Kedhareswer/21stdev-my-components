# Contact Sheet Carousel

Every picture laid out like a photographer's contact sheet: numbered frames on
a quiet page. Pick one and it grows out of its frame into a full viewer while
the sheet fades; step through with the arrows, then "Index" (or Esc) folds the
picture back into its frame. Page colours follow the theme tokens.

**No dependencies.** Slides without an `image` get a painted landscape (four
palettes, seeded), so it works with no assets at all.

```tsx
import ContactSheetCarousel from "@/components/ui/contact-sheet-carousel"

<ContactSheetCarousel />
<ContactSheetCarousel slides={[{ image: "/work/01.jpg", title: "North Facade", caption: "Steel and glass, 2024." }]} />
```

| Prop | Default | |
|---|---|---|
| `slides` | six painted landscapes | `{ image?, title?, caption?, alt?, palette?, seed? }` |
| `height` | `"100svh"` | Any CSS length |
| `frameWidth` | `380` | Smallest frame width on the sheet, px |
| `startOpen` | | Open on this frame instead of the sheet |
| `autoplay` | `5000` | ms per slide while viewing, `0` = off |
| `label` | `"Contact sheet"` | Sheet header |
| `background` / `ink` | theme tokens | Page colours |
| `onChange` | | `(index) => void` |

Arrows, ←/→, swipe, autoplay that pauses off-screen, screen-reader
announcements; reduced motion swaps the transition for a fade.
