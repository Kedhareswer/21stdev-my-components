# Journal Spread Carousel

A 3D page-flip carousel for a scrapbook or travel journal. The current double page lies open in the middle with a slight fold at the spine. Earlier and later pages stand edge-on in two stacks that step back into the distance. Turning a page swings the next spread in from its stack: its folded page opens while the old spread closes and joins the other stack. Each photo runs across both pages and creases at the spine, and so do the polaroids, taped prints and handwritten notes on it.

Drag or swipe sideways to turn pages. A flick carries further, and the turn snaps to the nearest spread. You can also click a page in either stack, swipe sideways on a trackpad, or use the arrow keys, Home and End. The carousel turns pages on its own every 2.6 s until someone touches it, and it pauses when it is off-screen or the tab is hidden.

```tsx
import JournalSpreadCarousel from "@/components/ui/journal-spread-carousel"

<JournalSpreadCarousel
  title="Summer Journal"
  spreads={[
    {
      label: "Lisbon, day one",
      image: "/journal/tram.jpg",
      alt: "A yellow tram climbing a cobbled street",
      prints: [{ src: "/journal/selfie.jpg", x: 5, y: 9, w: 21, rotate: -7, caption: "tram 28 :)" }],
      notes: [{ x: 28, y: 63, w: 22, title: "Day one", body: "Missed our stop twice." }],
    },
    { label: "Last page", paper: "#efe8da", prints: [/* … */] },
  ]}
  onAction={(action, index) => console.log(action, index)}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `spreads` | required | `JournalSpread[]`, one per open double page (see below). |
| `title` | `"Journal"` | Heading above the spreads. |
| `meta` | `"<n × 2> Pages"` | The small line under the title. |
| `initialIndex` | `0` | The spread that starts open. |
| `autoPlay` | `2600` | Milliseconds between automatic turns, or `false`. It stops for good on the first touch, key or swipe. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |
| `onIndexChange` | none | `(index)` when the open spread changes. |
| `onAction` | none | `(action, index)` from the round buttons: `"more"`, `"share"`, `"delete"` or `"add"`. |
| `className` | none | Added to the root. |

**`JournalSpread`:** `{ id?, label?, image?, alt?, imagePosition?, paper?, prints?, notes? }`. `image` covers both pages. It is a 5:4 spread on wide screens and taller on phones, so keep the subject away from the left and right edges. Without an image the pages are plain `paper` colour (default `#efebe3`).

**`prints`:** `{ src, x, y, w, rotate?, caption?, tape?, alt? }`. `x`, `y` and `w` are percentages of the whole spread. Prints are cropped to 4:5 and get a polaroid border, or a strip of tape with `tape`.

**`notes`:** `{ x, y, w, title?, body?, rotate?, style? }`. They are handwritten. `style: "card"` (the default) puts the note on a torn paper slip, and `"ink"` writes white straight onto the photo.

## Notes

- **No dependencies** beyond React. The 3D is CSS transforms. A requestAnimationFrame tween writes only `transform`, `opacity` and one shade variable per page. The spread size is measured by a `ResizeObserver` and cached, so no frame reads layout.
- **Font:** The handwriting is Caveat SemiBold (SIL Open Font License). It is subset to Basic Latin plus a few punctuation marks, embedded as woff2 (15 KB), and falls back to the system `cursive` font for other characters. The rest of the UI uses the system rounded sans.
- **Colours:** The stage is its own slate-navy art direction, with white buttons and paper pages. It looks the same in light and dark mode and uses no theme tokens.
- **Reduced motion:** Pages jump instead of turning, and nothing turns on its own.
- **Demo photos:** These are free Unsplash photos of Lisbon, Sintra, Aveiro and the Algarve (IDs in `demo.tsx`). They are packed into two AVIF sheets and cut back into separate images on load, so the demo fetches nothing off-origin. In your app, pass ordinary image URLs.
