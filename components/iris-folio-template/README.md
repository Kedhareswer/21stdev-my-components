# Iris Folio Template

A complete graphic-design portfolio drawn like a gouache cover. A swash
**PORTFOLIO** wordmark in sky blue sits over a band of sunrise sky. Heart-shaped
leaves spill past its edges, an art-nouveau vine frames a white iris, petals
drift and sparkles glint. The cover carries your name in your own script, your
discipline and a year range. Below it the same hand continues through a
filterable works grid with a project viewer, an about section with an arched
portrait, an accordion of disciplines, a timeline vine that grows year by year,
and a contact sign-off.

```tsx
import IrisFolioTemplate from "@/components/ui/iris-folio-template"

<IrisFolioTemplate
  name="Aoi Mori"
  mark="©AOI"
  palette="dusk"
  hero={{ title: "ARCHIVE", from: 2019, to: 2025, discipline: "Illustration", tags: ["Picture books", "Editorial"], localName: "森 葵", localTitle: "作品集" }}
  projects={[{ title: "The Moon Gardener", year: 2025, discipline: "Picture books", summary: "…", motif: "moon", sky: "night" }]}
  contact={{ email: "aoi@example.com" }}
/>
```

**No dependencies beyond React.** Every illustration (leaves, dew, vine frame,
iris, petals, moons and skies) is SVG drawn in the file. The wordmark and
section titles are built from embedded glyph outlines of **Bodoni Moda Italic**
(Owen Earl) and **Pinyon Script** (Nicole Fally), both under the SIL Open Font
License 1.1. No fonts, images or stylesheets load, so it renders inside the 21st
capture sandbox.

## Play with it

| Do this | And |
|---|---|
| Load the page | The wordmark writes itself in stroke by stroke, the band opens from the centre and the vine grows |
| Hover a letter | It lifts and tilts |
| Move the pointer over the cover | Leaves, vine, petals and the sunrise glow part in parallax |
| Click (or Enter on) the iris | It blooms open with a burst of sparkles and sheds petals. Click again to close it |
| Click anywhere on the sky | Petals scatter from that point and drift away |
| Hover a leaf | It rustles. Dew drops glint on their own |
| Click a discipline chip | The grid refilters and re-lays itself |
| Click a project | Opens the viewer. ← → page through, Escape or click outside closes it, and focus returns to the card |
| Open a practice row | Its description and deliverables unfold |
| Pick a year (or use ← →) | The vine grows to it, leaves sprout and that year's milestones appear |
| Click the email | It copies to the clipboard (falls back to `mailto:`) |
| Click a footer swatch | Repaints the page in Morning, Dusk, Sakura or Lagoon |

## The lettering

`hero.title`, and every section `title`, is set in the swash lettering. Typed in
**ALL CAPS** it gets the rhythm of the reference cover: the first letter of each
word in script, every other vowel dropped to a raised lowercase, and one
consonant mid-word in script (`PORTFOLIO` → *P o R T F O L i O*). Type any
lowercase to set the case yourself (`"Works"`). The first letter still
swashes. Characters outside A–Z (digits, `&'.,-!?` aside) are skipped, so keep
CJK and other scripts for `localName` / `localTitle`, which use your system's
serif.

## Props

| Prop | Default | Description |
|---|---|---|
| `name` | `"Lin Ruoxi"` | Nav, about kicker and copyright. |
| `mark` | `"©RUOXI"` | The oval pill in the corner. It links to contact. |
| `nav` | Works, About, Practice, Timeline, Contact | `{ label, href }[]`. `#works`, `#about`, `#practice`, `#timeline`, `#contact` scroll in-page. |
| `hero` | — | `{ title, from, to, discipline, tags, localName, localTitle }`. |
| `worksCopy` / `projects` | 8 projects | `{ title, year, discipline, summary, body?, client?, role?, tools?, motif?, sky?, cover?, href? }`. `motif` is `"iris"`, `"leaves"`, `"petals"`, `"vine"` or `"moon"`; `sky` is `"day"`, `"dawn"`, `"dusk"` or `"night"`. `cover` is your own image and replaces the drawing. The chips come from the `discipline`s. |
| `about` | — | `{ title, statement, body, portrait?, facts, stats, cv }`. Wrap words in `*asterisks*` for italic ink. `stats` count up. `portrait` fills the arch. |
| `servicesCopy` / `services` | Graphic, Visual, Branding, Illustration | `{ title, line, body?, deliverables? }`. |
| `timelineCopy` / `timeline` | 2022–2024 | `{ year, headline?, items: { title, place?, note? }[] }[]`. Opens on the latest year. |
| `contact` | — | `{ title, line, email, availability, socials }`. |
| `palette` | `"morning"` | `"morning"`, `"dusk"`, `"sakura"` or `"lagoon"`. |
| `ink` / `paper` | from palette | Override the lettering colour or the paper. |
| `paletteSwitcher` | `true` | The footer swatches. Turn off for production. |
| `theme` | `"auto"` | `"auto"` follows a `.dark` class on an ancestor; `"light"` / `"dark"` force it. Dark turns the band into a night sky with stars. |
| `intro` | `true` | The write-in on load. |
| `onProjectOpen` | — | `(project) => void`, e.g. for analytics. |
| `height` | `"100svh"` | Minimum cover height. Always a definite length. |
| `className` | `""` | Extra classes on the root. |

## Notes

- **Colour.** Everything mixes from a handful of palette colours with
  `color-mix()`, so `ink` and the palettes repaint the lettering, sky, leaves
  and petals together.
- **Small screens.** The nav folds into a menu, the cover band crops to the
  iris and its frame, the grid goes to one column and the viewer stacks.
- **Accessibility.** The wordmark is an `<h1>` with a text label, the iris is
  a labelled toggle button, chips use `aria-pressed`, the viewer is a modal
  dialog that returns focus, practice rows use `aria-expanded`, the timeline is
  a tab list with arrow keys, and blooms and copies are announced politely.
- **`prefers-reduced-motion`.** No write-in, parallax, drifting, twinkle,
  falling petals or count-up. Everything still opens, filters and pages.
- **Reveal on scroll** only hides what starts below the fold, and only once JS
  runs, so server-rendered pages and screenshots are never blank.
- Escape, arrow keys (in the viewer) and scroll are listened for on `window`,
  and the viewer locks `body` scroll while open. That suits a full-page
  template; keep it in mind if you embed two.
