# Ink Pill Navbar

A floating navbar with an ink pill that follows the pointer. The pill is a clipped layer of ink holding an inverted copy of the labels, so text flips colour exactly where the ink passes, mid-letter included. Its two edges ride separate springs. The edge on the side you're heading darts ahead, and the trailing edge holds back, then overshoots into place, so the pill stretches as it travels and lands with a soft wobble. Each label rolls its letters as the pill arrives, and a press squashes the pill for a beat. The call-to-action fills with a tilted wash of ink on hover while its arrow turns.

```tsx
import InkPillNavbar from "@/components/ui/ink-pill-navbar"

<InkPillNavbar
  brand={<Logo />}
  items={[{ label: "Work", href: "/work" }, { label: "Studio", href: "/studio" }, { label: "Contact", href: "/contact" }]}
  current={0}
  cta={{ label: "Start a project", href: "/start" }}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `items` | required | `{ label, href? }[]`. |
| `brand` | none | Logo on the left (node). |
| `cta` | none | `{ label, href? }`, the accent button on the right. It hides below 620 px of container width. |
| `current` | `-1` | Index of the current page. It gets an accent dot and `aria-current="page"`. |
| `accent` | `#ff4d2e` | The button, the dot and focus rings. |
| `onNavigate` | none | `(item, index)`. |

## Notes

- **Dependencies:** `gsap`, already in the root `package.json`. It tweens the two pill edges; everything else is CSS.
- **Performance:** Item positions are measured with a `ResizeObserver` and again once fonts load. The tween's `onUpdate` only writes a `clip-path` string from those cached numbers, so nothing reads layout while it moves.
- **Keyboard:** Focus moves the pill too. The inverted copy is `aria-hidden`, so screen readers hear each label once.
- **Reduced motion:** The pill jumps straight to the item, and the letters and the button don't roll.
- **Colours:** Built on the semantic tokens: the bar is `--color-background` and the ink is `--color-foreground`, so it inverts properly in dark mode.
- **Font:** Bricolage Grotesque (SIL Open Font License), pinned to one optical size, subset to Latin and embedded as woff2 (20 KB).
