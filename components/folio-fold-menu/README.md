# Folio Fold Menu

A full-screen menu that folds the page away. Press Menu and the page drops down and tilts back into a rounded sheet. The links rise out of their masks above it, one after another, in a large serif. Hover a link and its face rolls to an accent italic, and its picture fills the folded sheet, so the page shows where you're about to go. Click the sheet, press Close or press Escape, and the page swings back up.

```tsx
import FolioFoldMenu from "@/components/ui/folio-fold-menu"

<FolioFoldMenu
  brand="Halden Mør"
  links={[
    { label: "Houses", note: "14 built works", image: "/houses.webp" },
    { label: "Journal", image: "/journal.webp" },
    { label: "Contact", href: "/contact" },
  ]}
  footer={<><span>Tollbugata 24, Oslo</span><a href="mailto:hello@…">hello@…</a></>}
>
  {/* your page: hero, sections… */}
</FolioFoldMenu>
```

## Props

| Prop | Default | |
|---|---|---|
| `links` | required | `{ label, href?, image?, note? }[]`. `image` previews on the folded page while the link is hovered or focused. `note` is a small caption under the label. |
| `children` | none | The page. It fills the stage and folds away when the menu opens. |
| `brand` | `"Studio"` | Wordmark in the top bar (string or node). |
| `footer` | none | Small row under the links. |
| `accent` | `#e8b77a` | Hover italic, the numbers and the open button. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |
| `defaultOpen` | `false` | Start open. |
| `onNavigate` / `onOpenChange` | none | `(link, index)` and `(open)`. |

The class `ffm-serif` uses the embedded serif, so your page can share it (the demo's headline does).

Below 640 px of container width the links stack in a column.

## Notes

- **Dependencies:** `gsap`, already in the root `package.json`.
- **Accessibility:** The toggle has `aria-expanded` and `aria-controls`. While closed the menu is `inert`, so its links are out of the tab order. Opening from the keyboard moves focus to the first link, and Escape closes and returns focus to the button.
- **Reduced motion:** The page slides without the tilt or the scale, and the link rise is shortened.
- **Font:** Instrument Serif, roman and italic (SIL Open Font License). It is subset to Latin and embedded as woff2 (about 30 KB together).
- **Colours:** The menu is its own warm ink palette in light and dark alike. The top bar text is light, so the page under it should be a darkish photo, or restyle `.ffm-brand`.
- **Demo photos:** free Unsplash photos (IDs in `demo.tsx`), inlined as WebP so the demo fetches nothing off-origin.
