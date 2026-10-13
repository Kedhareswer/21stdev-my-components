# Pigment Experience Ledger

An "Experience" section for a portfolio, résumé or about page. Each employer
is a huge right-aligned wordmark with its years in italics on the left. A row
opens in place to show the position, location, industry, a link, a short story
and skill tags. Point at a row and a wash of pigment blooms behind it where the
pointer came in, then drifts after it. The open row keeps its wash, and the
wash moves slowly while the page is still.

**No dependencies, no assets.** The pigment is painted on a small 2D canvas per
row, with ragged, grainy edges like watercolour on paper. It looks the same on
a software renderer as on a GPU, and it pauses off screen and in background tabs.

```tsx
import PigmentExperienceLedger from "@/components/ui/pigment-experience-ledger"

<PigmentExperienceLedger />

<PigmentExperienceLedger
  palette="tide"
  heading="Where I've worked"
  defaultOpen={null}
  items={[
    {
      company: "Osprey Transit",
      role: "Staff engineer",
      years: "2023-now",
      location: "Seattle",
      industry: "Public transport",
      link: { label: "How the arrival feed works", href: "/writing/arrivals" },
      summary: ["I run the platform team behind real-time arrivals."],
      tags: ["Go", "Kafka"],
    },
  ]}
/>
```

| Prop | Default | |
|---|---|---|
| `items` | five example roles | `{ company, role, years, mark?, location?, industry?, link?: { label, href }, summary?: string[], tags?: string[] }` |
| `heading` / `intro` | "Experience" / one line | Set either to `""` to hide it |
| `footnote` | `"* Contract role"` | Small print under the list. Explains `mark` |
| `cta` | Download CV | `{ label, href }`, or `null` to hide it |
| `palette` | `"ember"` | `"ember"` (pink, orange, yellow), `"tide"`, `"moss"`, `"mono"` |
| `colors` | | Your own pigment as `[core, body, edge]` hex values. Overrides `palette` |
| `strength` | `0.92` | Peak pigment opacity, 0 to 1 |
| `defaultOpen` | `0` | Row open on first render. `null` starts with every row closed |
| `open` / `onToggle` | | Controlled mode. `onToggle(index \| null)` |
| `labels` | Position, Location, Industry, Website | Field labels in the open row |
| `uppercase` | `true` | Set the wordmarks in capitals |
| `minHeight` | `"100svh"` | Any CSS length. The section grows past it when rows open |
| `background` / `ink` | theme tokens | Page colours. Uses `--color-background`, `--color-foreground`, `--color-muted-foreground` and `--color-border` by default |
| `fontFamily` | Helvetica Neue stack | Font for the wordmarks and heading. Body copy uses the page font |

## Behaviour

- Each row header is a real `<button>` with `aria-expanded`. Click, tap, Enter
  or Space opens the row, and only one row is open at a time. Keyboard focus
  blooms the wash too.
- Long names shrink to fit their column, so a wordmark never wraps or clips.
  Below 640 px of container width, the year moves above the name and the open
  row stacks.
- The wash follows the surface it sits on. On a dark background it uses deeper
  colours, so light text on top of it stays readable.
- With `prefers-reduced-motion`, the entrance, drift and transitions are off,
  and the wash appears fully formed.
- On touch screens nothing depends on hover. The open row carries the wash.

The roles, companies and copy in the defaults are fictional examples. Replace them.
