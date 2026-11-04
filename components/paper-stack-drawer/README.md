# Paper Stack Drawer

A side drawer that stacks as you go deeper. The menu slides in from the right as a sheet of warm paper, its rows settling in a short stagger, while the page behind steps back and dims. Open a submenu and a fresh sheet slides over the last one. The sheets beneath step back to the left, so their edges show like a pile of pages. Back, a click on an exposed edge or Escape lifts the top sheet off again.

```tsx
import PaperStackDrawer from "@/components/ui/paper-stack-drawer"

<PaperStackDrawer
  brand="Northfold"
  rootTitle="Explore"
  items={[
    { label: "New arrivals", meta: "New" },
    { label: "Gear", meta: "6", children: [
      { label: "Shells & insulation", children: [{ label: "Hardshells", href: "/hardshells" }] },
      { label: "Packs", href: "/packs" },
    ] },
    { label: "Stores", href: "/stores" },
  ]}
  feature={{ image: "/kit.webp", title: "The Winter Field Kit", text: "Twelve pieces…", cta: "Read the report" }}
  footerLinks={[{ label: "Account" }, { label: "Help" }]}
>
  {/* your page */}
</PaperStackDrawer>
```

## Props

| Prop | Default | |
|---|---|---|
| `items` | required | `{ label, href?, meta?, children?, title? }[]`, nested as deep as you like. A row with `children` opens a sheet titled `title ?? label`. A number in `meta` reads as a quiet count; any other text becomes an accent pill. |
| `children` | none | The page behind the drawer. |
| `brand` | `"Brand"` | Wordmark in the top bar. |
| `rootTitle` | `"Menu"` | Heading of the first sheet. |
| `feature` | none | `{ image, title, text?, cta?, href?, alt? }`, a card at the foot of the first sheet. |
| `footerLinks` | `[]` | Small links under the card. |
| `accent` | `#b5532f` | Pills, the card link and focus rings. |
| `width` | `"440px"` | Drawer width, capped to the stage minus a 22 px edge. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |
| `defaultOpen` | `false` | Start open. |
| `onNavigate` | none | `(item, path)` for leaf rows. |

## Notes

- **Dependencies:** `gsap`, already in the root `package.json`. GSAP slides the sheets; everything else is CSS transitions.
- **Accessibility:** The toggle has `aria-expanded` and `aria-controls`. A closed drawer and every sheet under the top one are `inert`. A new sheet moves focus to its first row, and lifting it returns focus to the sheet below. Escape lifts one sheet, then closes.
- **Reduced motion:** Sheets swap with a short fade, and the page doesn't scale back.
- **Font:** Bricolage Grotesque (SIL Open Font License), pinned to one optical size, subset to Latin and embedded as woff2 (20 KB).
- **Colours:** The paper sheets keep their own warm palette in light and dark. The top bar text is light, so put a darkish photo behind it, or restyle `.psd-brand`.
- **Demo photos:** free Unsplash photos (IDs in `demo.tsx`), inlined as WebP so the demo fetches nothing off-origin.
