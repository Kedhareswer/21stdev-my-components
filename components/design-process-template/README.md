# Design Process Template

A case-study page that walks through how a product was made, one phase at a
time. A small eyebrow sits above a large indented headline with a round accent
badge in the middle of the sentence. Below that, a short intro sits beside the
team's role chips. Then each phase gets a ruled row: its share of the time in
accent, a big title, the activities as pill chips, and a description in the
right column.

It's quiet to look at, and every part of it responds:

- **Headline**: the words rise in one by one when it scrolls into view. The
  badge is a link (a `mailto:` by default). Under the pointer the envelope
  opens, a letter slides out and a tooltip names the link. A soft ping draws
  the eye to it.
- **Role chips** filter the page. Pick *Director* and the phases they weren't
  part of fade back, in the rows and in the allocation bar. Hovering a role
  previews the filter. A status line says how many phases match and offers
  *Clear*.
- **Activity chips** cross-reference. Hover *Research* and every phase that also
  did research lights up its chip. A small `×2` shows how often an activity
  comes up. Click a chip to pin the highlight.
- **Allocation bar**: a segmented bar that shows how the time was split. The
  segments grow in when the bar scrolls into view. Hover a segment to light up
  its phase, or click it to scroll there.
- **Phase rows**: each percentage counts up the first time its row comes into
  view. On hover the rule above the row draws in accent, the title shifts over
  and the phase's glyph pops in beside the percentage.
- **Escape** clears every filter.

Colours come from the host's semantic tokens (`--color-background`,
`--color-foreground`, `--color-muted-foreground`, `--color-border`), so it
follows the page's light/dark theme on its own. The accent mixes toward the
foreground for text, so percentages stay readable in both themes. The layout
stacks to one column when the template itself is narrower than 720px, not
the viewport.

```tsx
import DesignProcessTemplate from "@/components/ui/design-process-template"

<DesignProcessTemplate
  eyebrow="Case study — Northbound Roasters"
  headline="Rebranding a roaster meant tasting a lot of coffee {icon} and throwing away more sketches than we kept."
  icon="pen"
  iconHref="https://cal.com/you"
  iconLabel="Book a call"
  roles={["Creative lead", "Designer", "Strategist"]}
  accent="#e4572e"
  phases={[
    { name: "Listen", percent: 20, tags: ["Interviews", "Audit"], description: "…", roles: ["Strategist"], glyph: "search" },
    { name: "Sketch", percent: 35, tags: ["Wordmark", "Interviews"], description: "…", glyph: "spark" },
    { name: "Ship", percent: 45, tags: ["Guidelines", "Website"], description: "…", glyph: "layers" },
  ]}
/>
```

**No dependencies beyond React.** All glyphs are SVG drawn in the file, and the
fonts are a system stack that prefers Manrope / Plus Jakarta Sans / Inter when
they're installed. Pass `fonts` to use your own.

## Props

| Prop | Default | Description |
|---|---|---|
| `eyebrow` | `"Design process"` | The small label at the top. It's also the section's accessible name. |
| `headline` | the sample sentence | Put `{icon}` where the round badge sits. Leave it out for no badge. |
| `icon` | `"mail"` | The badge glyph: `mail`, `search`, `target`, `bulb`, `layers`, `check`, `pen` or `spark`. Only `mail` has the opening-envelope animation. |
| `iconHref` | `"mailto:hello@example.com"` | Where the badge links. `""` makes it decorative. |
| `iconLabel` | `"Get in touch"` | The link's accessible name and tooltip. |
| `intro` | sample | The paragraph beside the role chips. |
| `roles` | Director, Project manager, UIX designer, Product designer | The role chips. An empty array hides them. |
| `phases` | Discovery 15 / Define 30 / Ideate 15 / Solution 40 | `{ name, percent, tags, description, roles?, glyph? }[]`. A phase without `roles` matches every filter. |
| `showAllocation` | `true` | Shows the segmented bar. Percentages are normalised if they don't add up to 100. |
| `allocationLabel` | `"Time allocation"` | The bar's label. |
| `accent` | `"#2f64ef"` | The badge, percentages, highlights and pinned chips. |
| `fonts` | system stack | `{ display?, body? }` font-family strings. |
| `onRoleChange` | — | `(role \| null) => void` |
| `onTagSelect` | — | `(tag \| null) => void`, called when a chip is pinned or unpinned. |
| `maxWidth` | `"1160px"` | Content width. The background still runs full bleed. |
| `height` | `"100svh"` | Minimum height of the root. Always a definite length, never a percentage. |
| `className` | `""` | Added to the root. |

## Notes

- Reveal animations switch on only after mount. Server HTML and no-JS
  visitors see the finished page, and `prefers-reduced-motion` skips the
  animations entirely.
- Styles are one scoped `<style>` block. Every selector starts with `.dp-`,
  and base resets use `:where()` so they carry no specificity.
