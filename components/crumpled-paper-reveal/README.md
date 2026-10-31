# Crumpled Paper Reveal

Crumpled paper balls resting on a warm desk. Hover one (tap on a phone, or
focus it with the keyboard) and it un-crumples in your hand: the wad loosens,
the creases relax, the page flattens, turns to face you and comes up to
reading size. Leave and it folds and wrinkles back into the same ball. Every
sheet is real paper: a handwritten letter, a photo print, a typed studio letter
with a rubber stamp, all drawn from data so you can write your own.

**Requires `three` and `gsap`** (tested with three 0.186, gsap 3.15). React,
three and gsap (with `ScrollTrigger`) are the only imports. The four fonts are
embedded as subset woff2 data URIs (about 87 KB), so nothing is fetched and it
works offline and in 21st's capture sandbox.

## The storyboard

| Moment | What happens |
|---|---|
| load | when the stage scrolls into view the balls are tossed onto the desk one after another: each falls from above, rolls a little, bounces once and settles while its shadow tightens; then the first ball stirs once to say "I open" |
| rest | each ball breathes very slightly, lit from the top left, with a soft oval contact shadow; scraps of its page show on the outside at odd angles, some face up, some showing the paper's back |
| uncrumple | the ball loosens from the middle outwards, edges unwrap from behind it, the sheet lifts, twists to face you and grows while its wrinkles relax; the shadow grows from an oval into the page's own shadow |
| read | the sheet lies flat with faint creases (paper remembers), and tilts a few degrees towards the cursor |
| crumple | leave and it reverses from wherever it is: wrinkles return, edges fold back around, the ball shrinks back onto its spot |

Only one sheet is open at a time. Click or tap keeps it open; Escape or a click
outside crumples it back. With `prefers-reduced-motion: reduce` there is no
toss-in and no morph: the ball and the flat sheet simply crossfade.

## Usage

```tsx
import { CrumpledPaperReveal, DEFAULT_SHEETS, type PaperSheet } from "@/components/ui/crumpled-paper-reveal"

<CrumpledPaperReveal />

const sheets: PaperSheet[] = [
  {
    kind: "letter",
    date: "3 March",
    greeting: "Dear Theo,",
    body: ["The first paragraph.", "The second."],
    closing: "Yours,",
    signature: "Mira",
  },
  { kind: "photo", image: "/photos/harbour.jpg", alt: "Boats at dawn", caption: "Harbour, low tide", date: "Mar '26" },
  {
    kind: "typed",
    letterhead: "Studio Hale",
    tagline: "Type & Print",
    date: "4 March",
    greeting: "Dear Theo,",
    body: ["Typed, with a little ink wobble on every strike."],
    closing: "Best,",
    signature: "Ines",
    signer: "Ines Hale",
    stamp: { text: "Approved", date: "5 Mar", color: "#1f6f4a" },
  },
]

<CrumpledPaperReveal sheets={sheets} height="80svh" hint={false} />
```

Add as many sheets as you like: the balls sit in a row (up to five on desktop,
three on a phone) and wrap onto more rows after that.

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `sheets` | `PaperSheet[]` | `DEFAULT_SHEETS` | one ball per sheet, in order |
| `height` | `string` | `"100svh"` | always a definite length; never inherited |
| `hint` | `string \| false` | `"Hover a page to smooth it out · click to keep it open"` | the line under the balls, hidden after the first open; phones get "Tap a page…" |
| `className` | `string` | `""` | added to the root |

### Sheets

Every sheet takes an optional `label` (the ball's accessible name, derived if
you leave it out) and `paper` (paper colour).

| `kind` | Fields |
|---|---|
| `"letter"` | `body: string[]` (paragraphs), `date?`, `greeting?`, `closing?`, `signature?`, `ink?` |
| `"photo"` | `image?` (URL or data URI; remote images need CORS), `alt?`, `caption?`, `date?`. Without an image it paints layered ridges. |
| `"typed"` | `letterhead`, `body: string[]`, `tagline?`, `date?`, `greeting?`, `closing?`, `signature?`, `signer?`, `stamp?: { text, date?, color? }` |

Long letters are set in a smaller hand until they fit the page.

## Accessibility

Each ball is a `<button>` with an accessible name and `aria-expanded`, and
controls an `sr-only` article holding the sheet's full text, so screen readers
get the real words, not a picture of them. Focus opens a sheet, Enter or Space
keeps it open, Escape closes it.

## How it works

One three.js canvas draws every sheet. Each sheet is a finely subdivided plane
with a canvas texture painted at 1120 × 1400 (paper tooth, fibres, ink that
pools and drifts, a typewriter's uneven strikes, a distressed rubber stamp).
On the CPU each vertex gets a crumple map: where it lies when the page is
wadded (the page mapped onto a ball, pushed together by triangle-wave pleats
that fold it over itself), how high its creases sit (straight folds plus short
crinkles) and when it lets go. The vertex shader then unwraps the page from a
ball of shrinking curvature, staggered from the middle out, while the creases
relax on the whole sheet's clock; normals come from screen-space derivatives,
so every crease catches the light. GSAP drives one number per sheet, so a
reversal always starts from where the paper is. Shadows are signed-distance
rounded rects drawn under everything; the sheet in hand is drawn last with its
own depth so it never clips a ball.

## Credits

- Fonts (SIL Open Font License 1.1): La Belle Aurore by Kimberly Geswein,
  Mrs Saint Delafield by Sudtipos, Courier Prime by Alan Dague-Greene,
  Cormorant Garamond by Christian Thalmann. Subset to Latin and embedded.
- Demo photo: "Blue Ridge Mountains" by Ken Thomas, public domain (Wikimedia
  Commons), cropped and graded blue.
