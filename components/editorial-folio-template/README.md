# Editorial Folio Template

A whole portfolio laid out as a printed folio. Grey paper sheets with a fine
grain sit on a soft wash of your accent colour, like prints on a desk. The
display face is a high-contrast Didone, set big enough to fall off the page.
Everything else is typewriter mono, with thin rules, `fig.` captions,
hand-drawn arrows and ✦ bullets.

Six sheets, each a 16:10 spread on desktop that stacks into a single column on
phones:

- **Cover**: the cover word split into two staggered halves. The halves drift
  apart under the pointer, any letter turns italic when you hover it, and a
  contents line jumps to every other sheet.
- **About**: a vertical title, a pull-quote bio, a torn-edge portrait, a
  *Background* list and a *Skills* block with tool badges (hover for the name).
  Click the email to copy it.
- **Postcards** (your work): taped postcards on a torn watercolour wash.
  Hovering an entry lifts its card. Click either one to open the viewer, where
  you can flip the card (`F`) to read the back, with its stamp, postmark and
  message, and page through the set with `←`/`→`.
- **Socials**: two phone mockups. Like a post with the heart or by
  double-clicking it, and toggle *Follow*. Beside them is an analytics card
  whose numbers count up and whose trend line reads out the day you hover.
- **Experience**: roles as tabs (arrow keys work). Switching role swaps the
  bullets and the framed piece.
- **Lets Connect**: copy the email, call the number, or write a postcard on a
  lined card, which opens the mail app. Your name sits on the black bar, and
  each letter jumps when you hover it.

Around the sheets:

- **Contact sheet** (`G` or the grid button): every sheet at once as
  scaled-down prints, like the folio pinned up for review. Arrow keys move
  between them, and Enter opens one.
- **Index bar**: sticky, it tracks the sheet you're on. `←`/`→` or `J`/`K` step
  between sheets. On phones it shrinks to `03 / 06` with arrows.
- **Paper toggle**: light or dark paper.

```tsx
import EditorialFolioTemplate from "@/components/ui/editorial-folio-template"

<EditorialFolioTemplate
  name="Theo Marchetti"
  role="Art Direction + Print"
  year="2027"
  email="theo@example.com"
  accent="#e0937a"
  coverWord="Selected"
  sections={["cover", "about", "experience", "postcards", "connect"]}
  titles={{ postcards: "Prints", connect: "Say Ciao" }}
  works={[{ fig: "3.0", title: "Mercato Fiori", description: "Riso posters for a flower market.", motif: "bloom" }]}
  roles={[{ company: "Studio Fiume", title: "Junior AD", points: ["Art-directed a quarterly magazine."] }]}
/>
```

**No dependencies beyond React.** Every picture (postcards, posts, the framed
piece, the portrait, stamps and postmarks) is SVG drawn in the file. The paper
grain is painted once onto a canvas, and the fonts are system stacks. Nothing
loads at runtime, and the host's URL is never touched.

## Props

| Prop | Default | Description |
|---|---|---|
| `name`, `role`, `year`, `location`, `email`, `phone` | sample person | Used across the cover, About, Connect and the index bar. |
| `coverWord` / `coverSplit` / `coverItalic` | `"Portfolio"` / ~45% / last letter of the first half | The giant cover word, where it breaks, and which letter is italic (`null` for none). |
| `bio` | sample line | Italic pull quote on About. Empty hides it. |
| `portrait` | drawn portrait | An image URL, or any node. |
| `links` | LinkedIn, Instagram, Pinterest | `{ label, href }[]`. The first is the About sheet's *Click here*. |
| `background` | 3 lines | Rows under *Background*. |
| `tools` | Canva, Photoshop, Illustrator | Strings or `{ name, mark?, round? }`. Adobe and common tools get their usual two-letter marks. |
| `skills` | 2 rows | `string[][]`. Each row prints as `a \| b \| c`. |
| `works` | 2 postcards | `{ fig?, title, client?, year?, description, points?, motif?, palette?, artText?, image?, href? }`. The collage shows the first four, and the list shows all. |
| `posts` | 2 posts | `{ fig?, title, description, handle?, caption?, likes?, motif?, palette?, artText?, image? }`. The first two get phones. |
| `analytics` | Pinterest sample | `{ fig?, title, description, cardTitle?, period?, stats: { label, value, suffix? }[], trend?: number[] }`, or `null`. |
| `roles` | 2 roles | `{ company, title?, period?, points, fig?, motif?, palette?, artText?, image? }`. |
| `connectNote` | sample | The note above the postcard composer. |
| `sections` | all six | Which sheets to show, in order. Empty data hides a sheet on its own. |
| `titles` | Portfolio, About, Postcards, Socials, Experience, Lets Connect | Rename any sheet. The connect title breaks onto two lines at its first space. |
| `accent` | `"#8ea4ec"` | The watercolour wash, the desk the sheets lie on, stamps and selection. |
| `fonts` | Didone and mono stacks | `{ display?, mono? }`: any CSS font-family list. Load webfonts in your app, then name them here. |
| `defaultTheme` | `"system"` | `"system"` follows the host's `.dark` class, then the OS. |
| `onThemeChange` | – | Called with `"light"` / `"dark"`. |
| `startInOverview` | `false` | Open on the contact sheet. |
| `height` | `"100svh"` | Minimum height of the page. |

### Artwork motifs

`motif` picks a drawing for any postcard, post or role, and `palette` takes up
to three colours:

`bubble` (bubbles and a label strip), `night` (an ornament grid with a band),
`bloom` (flowers), `grid` (a Swiss poster), `portrait` (an arched concert
poster), `newyear` (bold type and champagne flutes), `mailer` (a direct-mail
card; `artText: "Line one|Line two"`).

Pass `image` instead to use your own picture. A 3:2 image suits postcards, and
a square one suits posts and roles.

## Notes

- Colours are the template's own paper and ink palettes, scoped to its root,
  so it looks the same in any host. The paper toggle affects only the template.
- Sheets lay out from their own width with container queries. The contact
  sheet renders each sheet at a fixed 1200px and scales it down, so a
  thumbnail is an exact print of the desktop sheet.
- The display face prefers Bodoni Moda / Didot / Bodoni 72 and falls back to
  Playfair Display, then Georgia. For the exact look on every OS, load a
  Didone such as Bodoni Moda in your app.
- `prefers-reduced-motion` turns off the parallax, the reveals, the arrow and
  line drawing, and the count-ups.
