# Compass Mega Header

A site header with one shared mega-menu panel that knows which way you're moving. Hover across the top items and the panel stays open: it eases to the next menu's height, the content slides in from the side you came from, and a small notch glides along the top edge to sit under the item you're on. Link icons lift and fill with the accent on hover, and feature cards zoom their photo slowly.

```tsx
import CompassMegaHeader from "@/components/ui/compass-mega-header"

<CompassMegaHeader
  brand="Fieldline"
  items={[
    {
      label: "Platform",
      columns: [{ title: "Data", links: [{ title: "Forecasts", desc: "Hourly to seasonal", icon: <CloudIcon />, tag: "New" }] }],
      feature: { image: "/case.webp", kicker: "Case study", title: "How Halvorsen cut storm losses by 31%" },
    },
    { label: "Pricing", href: "/pricing" },
  ]}
  actions={<a href="/start">Start free</a>}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `items` | required | `{ label, href?, columns?, feature? }[]`. An item with `columns` opens the panel; one without is a plain link. `columns` is `{ title, links: { title, desc?, icon?, href?, tag? }[] }[]`. `feature` is `{ image, title, kicker?, href?, alt? }`, a photo card on the right. |
| `brand` | `"Brand"` | Logo and wordmark (node). |
| `actions` | none | Right-hand side. Add the class `cmh-hide-sm` to anything that should drop on narrow screens. |
| `accent` | `#e4572e` | Icon tiles, tags and focus rings. |
| `maxWidth` | `1180` | Widest the bar and panel get, in px. |

Below 760 px of container width the items move to a scrollable second row, menus stack into one column, and the panel scrolls past 68 % of the viewport height.

## Notes

- **Dependencies:** none beyond React. The motion is CSS transitions.
- **Measuring:** Item positions (for the notch) and menu heights are measured with a `ResizeObserver`, on mount and again once fonts load. Pointer handlers only read those cached numbers, so hovering never forces a layout.
- **Input:** A mouse opens menus on hover, after a 70 ms intent pause from closed and instantly once open. Leaving the header closes it after 160 ms. Touch and click toggle. From the keyboard, Enter toggles, ArrowDown opens and focuses the first link, and Escape closes and returns focus. Hidden menus are `inert`.
- **Reduced motion:** No entrance, and menus swap without sliding.
- **Colours:** Built on the semantic tokens, so it follows light and dark. Only the accent is fixed.
- **Font:** Geist (SIL Open Font License), subset to Latin and embedded as woff2 (17 KB).
- **Demo photos:** free Unsplash photos (IDs in `demo.tsx`), inlined as WebP.
