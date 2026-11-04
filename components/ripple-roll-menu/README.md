# Ripple Roll Menu

A full-screen menu of tall condensed words. Point at a word and its letters roll over to an accent copy in a ripple. It starts from the letter under the pointer and spreads both ways, so entering from the left reads differently from entering in the middle. As the word rolls, a small photo opens inside the line, an arrow turns into place, and the other lines step back. Leaving rolls the word home the same way. The lines rise out of their masks one by one on load.

```tsx
import RippleRollMenu from "@/components/ui/ripple-roll-menu"

<RippleRollMenu
  brand={<><span>Brasa Studio</span><span>Menu</span></>}
  items={[
    { label: "Work", meta: "24 projects", image: "/work.webp", href: "/work" },
    { label: "Studio", meta: "Since 2014", image: "/studio.webp" },
    { label: "Contact", meta: "Say hello" },
  ]}
  footer={<><span>Rua das Flores 81, Porto</span><a href="mailto:…">hola@…</a></>}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `items` | required | `{ label, href?, image?, meta? }[]`. `image` opens as a pill inside the line on hover. `meta` is a small note on the right. |
| `brand` | none | Top row (its children are spread across it). |
| `footer` | none | Bottom row, spread the same way. |
| `accent` | `#ff7a3d` | The rolled letters, the number and the arrow. |
| `background` | `#1c0f0d` | Page colour. |
| `ink` | `#f3e7da` | Word colour. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |
| `onNavigate` | none | `(item, index)`. |

Below 640 px of container width the photo and the notes drop out and the words grow to fill the width.

## Notes

- **Dependencies:** none beyond React. The rolls are CSS transitions with a per-letter delay. The ripple origin is read from the `data-i` of the letter the pointer entered, so nothing is measured.
- **Accessibility:** Each link carries its word as `aria-label` and the letter spans are hidden, so screen readers hear "Work", not "W, O, R, K". Keyboard focus rolls a line from its first letter.
- **Reduced motion:** No rise, and the rolls and photo swap instantly.
- **Colours:** Its own palette (set `background`, `ink` and `accent`), the same in light and dark.
- **Font:** Anton (SIL Open Font License), subset to Latin and embedded as woff2 (10 KB).
- **Demo photos:** free Unsplash photos (IDs in `demo.tsx`), inlined as WebP.
