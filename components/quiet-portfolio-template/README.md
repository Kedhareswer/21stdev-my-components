# Quiet Portfolio Template

A complete, minimal personal site in one component: calm type, generous
whitespace, one accent colour, and a lot of small interactions that only show
up when you reach for them.

- **Floating pill nav**: Home / Essays (with a count), a `⌘K` key and a
  sun/moon toggle. The active tab's pill slides between tabs, and while you
  read an essay a thin progress line fills along the nav's bottom edge.
- **Intro**: a hand-drawn SVG portrait that blinks, a live status dot, and a
  *Say hello* popover (copy email, open mail app, socials).
- **Work**: the current role as a card, with every previous role folded into a
  timeline underneath.
- **What I do**: a single note card.
- **Recent work**: rows that dim their neighbours on hover. A generated cover
  trails the pointer and leans into the motion. Click a row to open it in place
  with a description, tags and an optional *Visit* link.
- **Essays**: an index grouped by year, a reader with headings, quotes, lists,
  reading time and older/newer paging.
- **Command palette** (`⌘K` / `Ctrl K`): fuzzy search over pages, essays,
  projects, actions (theme, copy email, send email) and links. Arrow keys,
  Enter and Esc all work.
- **Footer**: socials, and your local time with a day/night dot.

```tsx
import QuietPortfolioTemplate from "@/components/ui/quiet-portfolio-template"

<QuietPortfolioTemplate
  name="Maya"
  fullName="Maya Okafor"
  tagline="I design calm software for loud problems."
  location="Lisbon"
  timeZone="Europe/Lisbon"
  email="maya@example.com"
  accent="#3b82f6"
  currentRole={{ title: "Design Engineer", company: "Tern", period: "2023 – Present", location: "Remote" }}
  previousRoles={[{ title: "Product Designer", company: "Harbor", period: "2020 – 2023" }]}
  projects={[{ name: "Tidepool", description: "Design tokens to four platforms.", year: "2026", tags: ["CLI"] }]}
  essays={[{ slug: "defaults", title: "Defaults are the design", date: "2026-06-03", body: ["…"] }]}
  socials={[{ label: "GitHub", href: "https://github.com/you" }]}
/>
```

**No dependencies beyond React.** The portrait and project covers are SVG drawn
in the file, the type is the system font stack, and nothing loads at runtime.
Views (home, essays, essay) are internal state, so the host's URL is never touched.

## Props

| Prop | Default | Description |
|---|---|---|
| `name` / `fullName` | `"Ari"` / `"Ari Novak"` | First name in the intro; full name in the footer and alt text. |
| `tagline` | product-storyteller line | Muted text after the greeting. |
| `location` | `"Berlin"` | "Based in …" and the footer clock label. Empty hides both. |
| `email` | `"hello@example.com"` | Powers *Say hello* and the palette's email actions. |
| `avatar` | drawn portrait | An image URL, or any node (rendered in a 56px circle). |
| `status` | `"Open to new projects"` | Line under the intro plus the pulsing dot. Empty hides them. |
| `currentRole` | sample | `{ title, company, period, location?, href? }`, or `null`. |
| `previousRoles` | 5 samples | Same shape. Folded under *Previous roles*. |
| `about` | sample paragraph | A string, or your own nodes (e.g. several `<p>`). |
| `projects` | 7 samples | `{ name, description?, year?, tags?, href?, hue? }`. `hue` tints the generated cover. |
| `essays` | 4 samples | `{ slug, title, date: "YYYY-MM-DD", summary?, body: string[] }`. Empty hides the Essays tab. |
| `socials` | X, GitHub, LinkedIn, Read.cv | `{ label, href }[]`. |
| `timeZone` | `"Europe/Berlin"` | IANA zone for the footer clock. |
| `accent` | `"#f2682a"` | Focus rings, status dot, quote rule, palette selection, reading progress. |
| `defaultTheme` | `"system"` | `"system"` follows the host's `.dark` class, then the OS. |
| `onThemeChange` | – | Called with `"light"` / `"dark"`, so you can persist the choice. |
| `height` | `"100svh"` | Minimum height of the page. |

### Essay body

One string per block. `## ` starts a heading, `> ` a pull quote, `- ` a list
item (consecutive items join into one list). Anything else is a paragraph.

## Notes

- Colours are the component's own light/dark palettes, scoped to its root, so
  it looks the same in any host. The theme toggle affects only the template.
- The pointer-following cover shows only on devices with a fine pointer and
  hover. On touch, rows simply open in place.
- `prefers-reduced-motion` turns off every animation and transition.
