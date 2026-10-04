# Sticker Hello Portfolio

A whole designer portfolio template with a sense of humour. A huge condensed
serif says *"Hi, I'm Juniper."*, and two sticker puns are slapped on it. The
rest is a stack of case studies, a sticker sheet to play with, an about page
and a footer that wants to hear from you.

- **Hero stickers**: they pop on after the headline rises in. Click one to swap
  its joke (*Like the berry → Or the tree → Say it twice*). Drag one to peel it
  off and move it. Double-click puts it back. The starburst turns slowly.
- **Headline**: it fits its width at any size, so long names never overflow.
  Each letter bounces when you hover it.
- **Loop arrow**: a hand-drawn loop draws itself and points at the bio.
  *The good stuff ↓* scrolls to the work.
- **Nav**: Work / Play / About scroll to their sections, and the section in
  view gets a dot and an underline. The bar is sticky, with a blur behind it.
- **Work rows**: a ruled row (title, client, disciplines, blurb) over a
  full-bleed artwork that drifts with the scroll. On desktop a yellow
  *View case ↗* cursor follows the pointer.
- **Case study**: click an artwork to open a full-screen sheet with the
  overview, client / discipline / year / role, the hero image, two detail
  crops and big result numbers. *Next project* is at the bottom. Esc closes it,
  ← / → flip through, and focus goes back to the artwork you came from.
- **Play**: a dotted sticker sheet. Drag stickers around and they slap down
  when you let go. Add more from the tray of ten, or shuffle them, or peel
  them all off. Keyboard works too: arrows move a sticker (Shift moves it
  further), R turns it and Delete peels it.
- **About**: an illustrated portrait that blinks and tilts its head when you
  hover it, plus a bio and lists of services, clients and recognition.
- **Footer**: a giant closing line with a hand-drawn underline that draws in
  when you reach it. Click the email to copy it. There's also a *Say hello*
  mailto, socials, your local time, a light/dark switch and *Back to top*.

The layout follows the template's own width, not the viewport's. The grid has
six columns on desktop and folds down on tablets and phones.

```tsx
import StickerHelloPortfolio from "@/components/ui/sticker-hello-portfolio"

<StickerHelloPortfolio
  greeting="Olá, I’m"
  name="Rio."
  fullName="Rio Castanho"
  stickers={[
    { lines: ["Like the city", "Not the movie"], shape: "circle", color: "#9ee6c3", x: 54, y: 4, rotate: -12 },
    { lines: ["Moves things", "Frame by frame"], shape: "pill", color: "#ffb38a", x: 88, y: 94, rotate: 8, size: 0.78 },
  ]}
  bio="I’m a motion designer in Lisbon who makes logos wiggle. Currently freelancing with"
  studio={{ label: "Estúdio Onda", href: "https://example.com" }}
  colors={{ paper: "#f3ece2", accent: "#ff7a3d" }}
  projects={[
    { title: "Pocket Money", client: "Tandem", disciplines: ["Motion,", "Product UI"], description: "…", art: "phone" },
    { title: "My Real Project", client: "Acme", disciplines: ["Brand"], description: "…", image: "/work/acme.jpg", imageAlt: "Acme billboards" },
  ]}
  play={false}
  email="rio@example.com"
  timeZone="Europe/Lisbon"
/>
```

**No dependencies beyond React.** Every artwork, sticker, portrait and arrow
is SVG drawn in the file, so nothing loads at runtime. The fonts are font
stacks. The display stack starts with *Instrument Serif*, so if your app loads
it (for example with `next/font`) the headline picks it up. Otherwise it falls
back to the system's Didot or Times, squeezed to look condensed.

## Props

| Prop | Default | Description |
|---|---|---|
| `greeting` / `name` | `"Hi, I’m"` / `"Juniper."` | The headline. It's fitted to the available width. |
| `fullName` | `"Juniper Vale"` | Used in the nav brand and the footer ©. |
| `stickers` | two puns | `{ lines, shape: "burst" \| "oval" \| "circle" \| "pill", color, ink, x, y, rotate, size }`. `x`/`y` are % of the headline box, and `size` is a fraction of the headline's font size. Clicking a sticker cycles through its `lines`. |
| `bio`, `studio` | sample | The bio. `studio` is added at the end as an underlined link; `null` hides it. |
| `ctaLabel` | `"The good stuff"` | The scroll cue under the bio. |
| `nav` | Work / Play / About | Labels for the three links. |
| `projects` | four samples | `{ title, client, disciplines[], description, art?, image?, imageAlt?, year?, role?, overview?, results?[], href? }`. `art` picks a built-in drawing: `"mural" \| "phone" \| "packaging" \| "posters"`. `image` uses your own cover, which is cropped to fill. Each item in `disciplines` goes on its own line. |
| `play` | sticker sheet copy | `{ title, label, tags, description }`, or `false` to drop the section and its nav link. |
| `about` | sample | `{ intro, heading, paragraphs[], services[], clients[], recognition[], resume: { label, href } \| null }`. |
| `footer` | sample | `{ heading, highlight, socials[], note }`. `highlight` is the word in `heading` that gets the underline. |
| `email`, `location`, `timeZone` | sample, `"Asheville, NC"`, `"America/New_York"` | Contact details and the footer clock. |
| `colors` | mint paper, ink, coral | `{ paper, ink, accent }`. `paper` and `ink` apply to the light theme; `accent` is used for focus rings, the active-nav dot, the underline and the *That's me* sticker. |
| `fonts` | serif / grotesk stacks | `{ display, body }`, as CSS font-family values. |
| `squeeze` | `0.84` | How much the display serif is squeezed horizontally, from 0.6 to 1. Use `1` with a font that's already condensed. |
| `defaultTheme` | `"system"` | `"system"` follows the host's `.dark` class first, then the OS. The footer switch overrides it. |
| `onThemeChange`, `onProjectOpen` | — | Callbacks. |
| `height` | `"100svh"` | Minimum height. It's a definite length, so it works in any host. |
| `className` | `""` | Added to the root. |

## Notes

- The template scrolls with the page. The case study and the toast are
  `position: fixed`, so don't put the template inside a `transform`ed
  ancestor.
- With reduced motion on, the parallax, the spin, the blink and the draw-ins
  stop, and the nav jumps instead of scrolling smoothly.
