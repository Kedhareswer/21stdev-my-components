# Folio Fold Menu

A full-screen menu that folds the page away. Press Menu and the page drops a third of the way down and tips back into a rounded sheet, easing out from the first frame. The links rise into the space above it, one after another, in a quiet serif. Hovering one dims the others. Click the sheet, press Close or press Escape: the links leave first, then the page lifts back up, faster than it came down.

```tsx
import FolioFoldMenu from "@/components/ui/folio-fold-menu"

<FolioFoldMenu
  brand="Halden Mør"
  links={[{ label: "Houses" }, { label: "Journal" }, { label: "Contact", href: "/contact" }]}
>
  {/* your page: hero, sections… */}
</FolioFoldMenu>
```

## Props

| Prop | Default | |
|---|---|---|
| `links` | required | `{ label, href? }[]`. |
| `children` | none | The page. It fills the stage and folds away when the menu opens. |
| `brand` | `"Studio"` | Wordmark in the top bar (string or node). |
| `accent` | `#e8b77a` | The open button's fill. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |
| `defaultOpen` | `false` | Start open. |
| `onNavigate` / `onOpenChange` | none | `(link, index)` and `(open)`. |

The class `ffm-serif` uses the embedded serif, so your page can share it (the demo's headline does).

Below 640 px of container width the links stack in a column and the page drops a little further.

## Motion

- Open: page 600 ms `power3.out` to 34 % down, 94 % scale, 10° back, 20 px corners. Links fade and rise 14 px, 320 ms each, 50 ms apart, starting at 180 ms.
- Close: links out in reverse, 140 ms; page back up 300 ms `power2.in` after 80 ms.
- Interrupting either direction tweens from wherever the page is.

## Notes

- **Dependencies:** `gsap`, already in the root `package.json`.
- **Accessibility:** The toggle has `aria-expanded` and `aria-controls`. While closed the menu is `inert`, so its links are out of the tab order. Opening from the keyboard moves focus to the first link, and Escape closes and returns focus to the button.
- **Reduced motion:** The page slides without the tilt or the scale, links fade without rising, everything is shorter.
- **Font:** Instrument Serif roman (SIL Open Font License), subset to Latin and embedded as woff2 (about 15 KB).
- **Colours:** The menu is its own warm ink palette in light and dark alike. The top bar text is light, so the page under it should be a darkish photo, or restyle `.ffm-brand`.
- **Demo photo:** a free Unsplash photo (ID in `demo.tsx`), inlined as WebP so the demo fetches nothing off-origin.
