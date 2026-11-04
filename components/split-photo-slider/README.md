# Split Photo Slider

A scroll-driven split-panel product slider. A photo fills the left half and the copy sits on the right, with round thumbnails riding the seam between them. The stage sticks while the page scrolls, and each scroll step plays the whole change. The old copy lifts out line by line and the new copy rises in. Then the next photo slides over the last one from the top, turning square as it lands. Scrolling back reverses it. Letting go snaps to the nearest slide, and by default it loops endlessly both ways.

Dots, the up and down arrows and the arrow keys jump straight to a slide, and the scroll moves to match. There is no autoplay.

```tsx
import SplitPhotoSlider from "@/components/ui/split-photo-slider"

<SplitPhotoSlider
  brand="ember & oat"
  credit="© Ember & Oat Roasters"
  socials={[{ label: "Instagram", href: "https://instagram.com/…", icon: "instagram" }]}
  slides={[
    { title: "Latte", description: "A long pour of steamed milk…", image: "/latte.webp", thumb: "/latte-dot.webp" },
    { title: "Macchiato", description: "A single espresso marked…", image: "/macchiato.webp" },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `slides` | required | `{ title, description, image, thumb?, alt?, cta?, href? }[]`. Portrait photos (about 4:5) work best. `thumb` is the round seam thumbnail and falls back to `image`. |
| `brand` | none | Wordmark over the photo, top left (string or node). |
| `socials` | `[]` | `{ label, href, icon: "facebook" \| "instagram" \| "youtube" }[]`, top right. |
| `credit` | none | Small vertical line, bottom left. |
| `ctaLabel` | `"Order now"` | Button label when a slide has no `cta`. A slide with `href` renders a link. |
| `accent` | `#c4a27a` | Button colour, counter rule and a warm tint in the copy panel. |
| `titleFont` | embedded Playfair Display | CSS `font-family` for the titles. |
| `scrollPerSlide` | `0.7` | Page scroll per slide, as a fraction of `height`. |
| `loop` | `true` | Scroll past the last slide to come round to the first, both ways. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |
| `onChange` / `onCta` | none | `(index)` and `(slide, index)`. |

Below 640 px of container width it stacks: photo on top, thumbnails in a row on the seam, copy below.

With `prefers-reduced-motion`, slides swap with a short fade and the scroll doesn't snap.

## Notes

- **Dependencies:** `gsap` (with `ScrollTrigger`), already in the root `package.json`.
- **Font:** The title font is Playfair Display Bold (SIL Open Font License). It is subset to Latin letters, embedded as woff2 (8 KB), and falls back to Georgia for other characters.
- **Colours:** Only the semantic tokens are used (`--color-background`, `--color-foreground`, `--color-muted-foreground`), so it follows light and dark. Text over the photo is dark by design; use light photos or restyle `.sps-brand`.
- **Loop:** With `loop`, the track never ends, so content after it can't be reached by scrolling. Set `loop={false}` when the slider sits mid-page.
- **Demo photos:** free Unsplash photos (IDs in `demo.tsx`). The cups were cut out and set on tinted concrete from two other Unsplash shots, then inlined as WebP so the demo fetches nothing off-origin.
