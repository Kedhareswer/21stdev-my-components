# Stencil Labs Template

A complete studio / incubator site on one hairline grid. The page is cool grey
paper with monospace text, orange chamfered buttons, and display type in a
stencil face that is drawn in the file. Empty spacer rows between sections let
the column rules run through the page.

- **Nav**: sticky, with a blurred backdrop. `#team`, `#faq`, `#news` and
  `#subscribe` scroll within the template and never touch the host URL. It has
  a light/dark switch, and below 760px the links fold into a menu.
- **Hero**: stencil headline lines all set at one size. Beside them is a
  **live clay object**: a signed-distance scene raymarched in WebGL2 with soft
  shadows and AO. It idles in a slow spin and tilts toward the pointer. You can
  drag and flick it, or use the arrow keys. The stats count up the first time
  they scroll into view.
- **Team**: each portrait is a dot-matrix bust, seeded by the person's name and
  lit from the upper left, and it turns accent on hover. Pass `image` to use a
  photo instead (grayscale until hover). **Bio +** slides the bio up over the
  portrait, and its plus turns to a cross.
- **FAQ**: an accordion with numbered rows and chamfered orange toggles that
  rotate from + to ×. Answers ease open. One question is open at a time unless
  you set `faqMultiple`. The small × box in the left margin collapses every
  answer. A second clay object sits in a bracketed cell.
- **Latest news**: a carousel showing two cards, or one on narrow widths. Use
  the side pager, swipe, or the arrow keys. A progress bar tracks the position.
  The ◎ mark in the corner toggles autoplay. **Covers are generated**: one
  offscreen WebGL context renders each clay scene (`bot`, `stack`, `orbs`,
  `jack`, `rings`) on a studio floor once, and the card shows the result as an
  image with a stencil kicker. Pass `image` to use your own cover.
- **Subscribe**: validates the email, shows a loading state, then confirms or
  reports an error.
- **Footer**: link columns, socials with ↗ arrows, a back-to-top link, and the
  **giant wordmark** with one letter per column and orange corner squares.
  Hover a letter and its heavy strokes thin and turn orange.

```tsx
import StencilLabsTemplate from "@/components/ui/stencil-labs-template"

<StencilLabsTemplate
  brand={{ name: "Halden", word: "Works" }}
  wordmark="WORKS"
  accent="#2f5bff"
  hero={{ lines: ["Hardware,", "made small"], shape: "stack" }}
  team={[{ name: "Sigrid Halden", role: "Founder", bio: "…" }]}
  faq={[{ question: "How much does a prototype cost?", answer: "…" }]}
  news={[{ title: "Why we prototype in cardboard", author: "Sigrid Halden", category: "Process", date: "Oct 1, 2026", cover: "bot", kicker: "Process" }]}
  onSubscribe={(email) => fetch("/api/subscribe", { method: "POST", body: JSON.stringify({ email }) })}
/>
```

**No dependencies beyond React.** It loads no images, fonts or scripts. The
stencil face, marks, portraits and clay renders are all made in the file.

## Props

| Prop | Default | Description |
|---|---|---|
| `brand` | `{ name: "Nullpoint", word: "Labs" }` | Two-line lockup in the nav and subscribe row. `word` is set in stencil. |
| `wordmark` | `"LABS"` | The giant footer word, one column per letter. |
| `nav`, `navCta` | Team / FAQ / News / Contact, Apply | `{ label, href }`. A `#name` href scrolls to that section inside the template. |
| `hero` | Build what comes next | `{ lines, eyebrow, description, cta, secondary, stats, shape }`, merged over the defaults. Up to 3 `stats` of `{ value, prefix?, suffix?, label }`. |
| `teamTitle`, `teamIntro`, `team` | 4 people | `team` is `{ name, role, bio, image?, href? }[]`. An empty array hides the section. |
| `faqTitle`, `faqIntro`, `faq` | 7 questions | `faq` is `{ question, answer }[]`. |
| `faqDefaultOpen` | `4` | Index of the question that starts open. `-1` starts with all closed. |
| `faqMultiple` | `false` | Let several answers stay open at once. |
| `faqShape` | `"jack"` | The clay object in the FAQ header. |
| `newsTitle`, `blog`, `news` | 4 posts | `news` is `{ title, author, category, date, href?, image?, cover?, kicker? }[]`. |
| `newsAutoplay` | `false` | Starts the carousel advancing every 4.2s. Any manual step stops it. |
| `subscribe` | – | `{ title, placeholder, note, cta }`. |
| `onSubscribe` | – | `(email) => void \| Promise`. A rejected promise shows an error. Without it, the form only simulates the send. |
| `columns`, `socials` | Ecosystem / Quick links / Legal, 4 socials | `columns` is `{ title, links }[]` and shows up to 3. |
| `copyright`, `rights` | `© year`, `All rights reserved by …` | The legal row. |
| `accent` | `"#ff6a1a"` | Buttons, toggles, corner squares, and one part of every clay object. |
| `paper` | `"#e3e3e0"` | Page colour in the light theme. |
| `font` | monospace stack | CSS font-family list for all text. Load a webfont in your app, then name it here. |
| `defaultTheme` | `"system"` | `"system"` follows the host's `.dark` class, then the OS. |
| `onThemeChange` | – | Called with `"light"` or `"dark"`. |
| `maxWidth` | `"1180px"` | Width of the grid frame. |
| `height` | `"100svh"` | Minimum height of the page. |

`ClayShape` is `"jack" | "rings" | "bot" | "stack" | "orbs"`.

## Notes

- Without WebGL2, the live objects become a drawn crosshair and the covers fall
  back to an empty panel that still shows the stencil kicker. Nothing breaks.
- The live render loop pauses when the object is off screen. All the generated
  covers share one context.
- The stencil face covers A–Z, 0–9 and `. , - / : ! ? ' & + #`. Any other
  character sets as a space.
- Body text prefers JetBrains Mono, then IBM Plex Mono and Roboto Mono, then
  the system monospace.
- `prefers-reduced-motion` stops the idle spin, the bob, the entrance, the
  count-ups and autoplay, and makes transitions instant. You can still drag the
  clay objects.
- The layout is four columns, or two below 760px. It switches on the
  template's own width, not the viewport's.
