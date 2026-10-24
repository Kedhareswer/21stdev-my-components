# Marginalia Portfolio Template

A junior designer's CV laid out like a printed portfolio that someone went over
with a periwinkle pen. Pale paper sheets alternate with charcoal night sheets.
Headings are set big in a high-contrast serif. The margins are full of
handwriting: arrows pointing at the portrait, ovals around the parts of the bio
that matter, a curly arrow from the signature into the title, doodles for the
fun facts.

**Requires `gsap`** (`npm install gsap`). ScrollTrigger, ScrollToPlugin and
MorphSVGPlugin all ship in the public package, so nothing else is needed.

**Real photographs.** The portrait and the photos inside the phone screens come
from [Unsplash](https://unsplash.com) (Unsplash License: free to use, no
permission needed), served at the width each slot needs. Each one is a prop.
The phone UIs (status bar, feeds, cards, rings, tab bars), every doodle and
arrow, the book stack and the QR code are drawn in this file.

## The sheets

- **Cover.** The title's letters rise on load. Then the signature writes itself
  in, the curly arrow and the oval around your role draw in, and a star starts
  orbiting one letter (it dims when it passes behind). Hover the signature and
  the star morphs into a heart. Moving the pointer over the cover leaves a
  fading ink trail. As you scroll away, the letters drift apart.
- **Hello.** A greyscale portrait (it turns colour on hover) inside two sketchy
  boxes, with up to six trait words pointing at it. The traits and the photo
  parallax against each other under the pointer. In the bio, `*phrase*` gets a
  pen underline and `[phrase]` gets a pen oval. Both draw in as the bio
  scrolls into view.
- **Education.** A list where `circled` entries get an oval, a **real,
  scannable QR code** for `cvUrl` (byte mode, level M, up to 106 bytes), and
  language rows whose pen strokes draw out to each level.
- **Skills.** Tool tiles inside a pen oval. Hover or focus a tile and the
  handwritten note under the tiles changes to that tool's note. There's also a
  stack of design books with a coffee cup on top, and a two-column skill list.
- **Projects.** The sheet stays still while you scroll, and the project phones
  go from a shuffled pile into a row. Then their numbered labels and tags
  write themselves in. Tap a phone to scroll smoothly to its case study.
- **Case studies.** One sheet per project. Each has an eyebrow, a big title, a
  marked-up summary, a circled *my challenge*, and stats that count up inside
  pen ovals. There are three phones: the front one turns to face you, the side
  ones fan out from behind it, all of them parallax, and each tilts in 3D under
  the pointer. The phones swap sides from one case to the next.
- **Fun facts.** Line doodles draw themselves in next to handwritten facts.
  Hover a fact to make its doodle wiggle, and click it to draw it again.
- **Thank you.** A circled avatar, *Get in touch* (clicking the address copies
  it), links that get underlined on hover, and a handwritten letter that
  writes itself out paragraph by paragraph before the signature.

The other moving parts:

- Each heading's underline morphs from a nervous zig-zag into a clean swoosh
  as you scroll (MorphSVG).
- When a night sheet follows paper, it grows from a rounded card into full
  bleed.
- A thin top bar (year, *Curriculum Vitae*, your name and the current sheet)
  inverts over light and dark sheets and has a scroll-progress line. Click
  *Curriculum Vitae* to open a contents page. Escape closes it.

`prefers-reduced-motion` gets the finished page: everything is drawn and
written, the projects show as a row in a normal-height sheet, and there's no
ink trail.

## Usage

```tsx
import MarginaliaPortfolioTemplate from "@/components/ui/marginalia-portfolio-template"

export default function Page() {
  return (
    <MarginaliaPortfolioTemplate
      name="Kenji Ward"
      role="Product Designer"
      title="Folio"
      bio="I design calm software. *Trust is a design material*, and the best interface is often [the one you remove]."
      cvUrl="https://example.com/cv.pdf"
      colors={{ paper: "#efe8dc", night: "#1f2a2b", ink: "#2a2420", pen: "#e0613a" }}
      projects={[
        {
          name: "Ledger",
          tagline: "Money, minus the anxiety.",
          kind: "Fintech · iOS",
          year: "2026",
          summary: "A spending app for freelancers. We replaced budgets with [a calm weekly allowance].",
          challenge: "Explain irregular income without a single pie chart.",
          stats: [{ value: 38, suffix: "%", label: "fewer support tickets" }],
          images: ["https://images.unsplash.com/photo-…", "…", "…"],
          screens: ["stats", "cover", "detail"],
          accent: "#1f6f6b",
          tag: "shipped",
        },
      ]}
    />
  )
}
```

See `demo-terracotta.tsx` for a complete second persona.

## Props

| Prop | Default | Notes |
|---|---|---|
| `name`, `role`, `year`, `location` | Aurelia Sorel, UX/UI Designer, 2026, Paris | |
| `title` | `"Portfolio"` | The giant cover word. The star orbits its last "o", or its last letter if there's no "o". |
| `docLabel` | `"Curriculum Vitae"` | Middle of the top bar; opens the contents page. |
| `portrait` | Unsplash photo | Used on Hello and Thank you. |
| `traits` | six words | Up to six handwritten words around the portrait. |
| `greeting`, `bio` | | `*under*` and `[oval]` markup in `bio` and `summary`. |
| `educationIntro`, `education` | | `{ title, place?, period?, circled? }[]` |
| `cvUrl` | example URL | What the QR code encodes (≤ 106 bytes). `null` hides it. |
| `cvNote`, `languages` | | `{ name, level, value: 0–1 }[]` |
| `tools`, `toolNote` | Ps, Ai, Figma, HTML, CSS | `{ name, mark, bg, fg, note? }`. `mark: "figma"` draws the Figma logo. |
| `skillsIntro`, `skills`, `books`, `booksNote` | | `books: { title, color }[]`, up to 7. |
| `projectsNote`, `projects` | five projects | See `MgnProject`. `screens` picks from `cover`, `feed`, `detail`, `stats`. |
| `factsNote`, `facts` | six facts | `doodle`: guitar, dumbbell, music, plane, coffee, camera, plant, book, headphones, globe, cat, pencil, mountain, heart. |
| `thanks`, `email`, `links`, `letter`, `signature` | | Blank lines split the letter into paragraphs. `signature` defaults to `name`. |
| `sections` | all, in order | Any of `cover`, `hello`, `education`, `skills`, `projects`, `cases`, `facts`, `thanks`. |
| `colors` | `{ paper, night, ink, pen }` | Paper sheets, night sheets, body ink, the pen. |
| `fonts` | DM Serif Display, Caveat, Poppins | `{ href?, display?, hand?, body? }`. `href: null` loads no stylesheet. |
| `inkTrail` | `true` | The pointer trail on the cover. |
| `height` | `"100svh"` | One screen. Every sheet is at least this tall, and the projects sheet is 2.3 screens long. |
| `className` | | |

## Notes

- The template uses the page's own scroll (ScrollTrigger's default scroller),
  so mount it in normal document flow, not inside an `overflow: auto` box.
- Layout follows the component's own width (`@container`), so it works the
  same at full width or inside a narrower frame.
- Fonts come from one Google Fonts stylesheet `<link>`. With `fonts.href: null`
  it falls back to Georgia / Bradley Hand / system UI.
