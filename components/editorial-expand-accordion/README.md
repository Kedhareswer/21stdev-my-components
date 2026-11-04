# Editorial Expand Accordion

A services section set like a magazine spread: big serif titles, small numbers and hairline rules. Hovering a row nudges its title along and draws a vermilion rule under it. Opening a row turns the title italic, spins the "+" into a filled "×", and opens a panel where the photo wipes out from its centre while the image eases back from a zoom. The description, deliverable tags and link then rise in one after another.

```tsx
import EditorialExpandAccordion from "@/components/ui/editorial-expand-accordion"

<EditorialExpandAccordion
  eyebrow="Services"
  heading={<>Four ways we <em>help</em></>}
  intro="A small studio for teams who care how things look and how they work."
  items={[
    { title: "Brand & identity", description: "Names, marks and type systems…", image: "/brand.jpg", tags: ["Naming", "Logo"], duration: "6–10 weeks", href: "/work/brand" },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `items` | required | `{ title, description, image, imageAlt?, tags?, duration?, href?, cta? }[]`. Photos are cropped to 4:3. |
| `eyebrow` | `"Services"` | Small label above the heading. |
| `heading` | "Four ways we *help*" | Node. An `<em>` inside turns accent italic. |
| `intro` | none | Line under the heading. |
| `defaultOpen` | `0` | Index open at start, `-1` for none. |

## Notes

- React only. No other dependencies.
- Colours follow the host's semantic tokens, with a vermilion accent, so it works in light and dark. Titles use a serif stack (Instrument Serif or Fraunces if the page loads them, then Palatino and Georgia).
- WAI-ARIA accordion: header buttons with `aria-expanded` and `aria-controls`, labelled regions, and Up, Down, Home and End between rows. Closed panels are `inert`.
- The panel opens through `grid-template-rows` and the photo through `clip-path`, so nothing is measured. On wide containers the photo and copy sit side by side.
- Reduced motion makes every change instant.
