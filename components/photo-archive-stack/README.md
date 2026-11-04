# Photo Archive Stack

A pile of photo cards that unfolds into a list. Closed, the cards sit in a tight stack, and hovering it fans the edges apart. A click deals the cards out top to bottom with a soft overshoot. Picking a row opens it in place: the clip slides down to show the photo, which settles from a slight zoom, and the rows below make room. Collapse (or Escape) gathers them back bottom-up.

The palette is a warm darkroom: deep brown-black, a safelight-red glow, a serif title and mono dates. It sits on your page's `--color-background`.

```tsx
import PhotoArchiveStack from "@/components/ui/photo-archive-stack"

<PhotoArchiveStack
  heading="Field notes, summer"
  items={[
    { title: "Wildflower Meadow", date: "Jun 02 · 06:12", image: "/meadow.webp", caption: "Poppies along the old rail cut.", tag: "35 mm" },
    { title: "Lake at Still Water", date: "Jun 09 · 07:40", image: "/lake.webp" },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `items` | required | `{ title, date, image, alt?, caption?, tag? }[]`. Landscape photos work best. |
| `eyebrow` | `"Archive"` | Small label; the frame count is added after it. |
| `heading` | `"Selected studies"` | Serif title. |
| `description` | short line | Under the title. |
| `previewHeight` | `250` | Height in px of an opened photo. |
| `height` | `"100svh"` | Minimum height of the stage. Always a definite length. |
| `className` | `""` | On the stage. |

## Notes

- Every card position comes from `layoutStack()`, plain numbers from the item count and state, so nothing is measured while it moves. The list height is set once per change, not tweened.
- Uses `gsap` (in the root `package.json`).
- Reduced motion: the cards jump to place and the CSS transitions are off.
- The demo inlines seven free Unsplash photos as small WebP so it makes no off-origin requests.
