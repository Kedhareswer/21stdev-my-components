# Flatlay Resume Board

A CV as a desk flat-lay, photographed from above: a creased perforated sheet,
a pinned photo card, a smart-watch "about me", a crumpled receipt of experience
with dotted leaders and a coffee ring, torn-paper education on a ruled page, a
lolly-stick label over grid paper, a handwritten list, layered skill strips, an
SD card, chrome app tiles on denim, an earbud cable, palm leaves, red yarn round
a smiley pin — and two QR codes that actually scan.

Everything you would annotate, you can hover: a red marker loops a contact row
(and on the portfolio row the arrow shoots across to the QR), loops a receipt
row or the CODE badge, underlines an education entry or a soft-skill strip,
ticks an ability. The objects — the QR paper, the SD card, the app tiles, the
strips — lift off the desk. Nothing is marked at rest.

Everything is generated. No image file, no icon set, no font file, no npm
dependency beyond React.

## Usage

```tsx
import FlatlayResumeBoard from "@/components/ui/flatlay-resume-board"

<FlatlayResumeBoard />
<FlatlayResumeBoard name="Your Name" portfolioUrl="https://you.dev" />
<FlatlayResumeBoard photo={headshot} items={roles} education={schools} />
<FlatlayResumeBoard height="52rem" />
```

Every rule is scoped to `.frb-*` inside the component's own `<style>`; no
Tailwind utilities.

## Props

| Prop | Default | What it does |
|---|---|---|
| `height` | `"100svh"` | Height of the hero. Must be a definite length. |
| `minHeight` | `"640px"` | Floor, so the board stays readable on short viewports. |
| `name` / `title` / `roles` | — | The card. `roles` shows three lines. |
| `country` / `locale` | — | The two-cell box under the roles. |
| `contacts` | 3 rows | `{ kind: "phone" \| "mail" \| "link", text, href? }`. Three fit. A row with `href` is a link; the `link` row gets the arrow to the QR. |
| `about` | 7 lines | Pre-broken watch copy. Wrap a phrase in `*stars*` to bold it. |
| `items` | 6 rows | The receipt. `{ title, lines, date }`. Hover draws the loop. |
| `education` | 3 entries | `{ title, detail, date }`. |
| `abilities` / `skills` | 6 / 4 | The handwritten list on the grid paper, and the strips. |
| `tiles` | 4 | `{ label, tint, ink }` — the chrome squares on the denim. |
| `portfolioUrl` / `codeUrl` | — | **Encoded into the two QR codes, for real.** Also where the QR papers link. |
| `photo` | drawn stand-in | Portrait for the card. |

Do not pass `height="100%"`. The board is fitted to the root's box, so a
percentage height collapses to 0px on any installed page.

Text does not reflow: `about` and the receipt rows are placed on a fixed grid,
so keep `about` lines around 30 characters, `items` to six rows, `education` to
three, `abilities` to six and `skills` to four. Past that they run off their
paper.

## The handwriting is drawn

The labels that read as marker — *my portfolio*, *software skills*, the
abilities list, *teamwork* — and the puffy *abilities* and glowing *skills*
are not a font. No script face is a safe system font: the usual stack resolves
differently on every machine and falls back to a serif on the headless box
that renders the cover image, so the board would look right on your Mac and
wrong on 21st.

So the alphabet ships in the file, the way the sibling `polaroid-zine-hero`
does it: centre-line strokes per glyph, set with a round pen and a slight
slant, with a repeatable wobble so the same line is uneven the same way on
every paint. The same strokes painted wide and layered — tan under white, cyan
glow under navy under white — give the two display labels. `hand()` takes any
string, so every one of those labels is editable through props or a one-line
change.

## Ink in the paper, not on it

Print on real paper is not a crisp layer laid over the texture: the folds
shade the ink along with the sheet, its density is a little uneven, its edges
are nudged by the fibres, and the paper shows through it. So every block of
print lives *inside* the group the crease lighting acts on, wrapped in
`.frb-ink` — an `ink` filter (high-frequency noise as an alpha mask for the
toner speckle, a low-frequency displacement for the fibre wobble, a hair of
blur) and `mix-blend-mode: multiply` into the paper. The watch face and the
app tiles are screens and enamel, so they stay crisp; the QR codes get the
crease but not the ink, because a reader needs their edges.

## The red marker

The marker is the one thing that sits *on* the paper: it was added later, it
is a different pen, and it animates. Every hover target is a transparent hit
shape above the print with its marks inside it, so `:hover` on the group
reveals them and nothing under it re-renders. Each mark is a hand-drawn path
with `pathLength={1}`, hidden by `stroke-dasharray:1 2; stroke-dashoffset:1`
and revealed by transitioning the offset to 0 — it draws itself, with no
JavaScript, no measuring, and no layout work. (The gap is longer than the path
on purpose: with `1 1` the dash boundary lands on the path's end and its round
cap shows as a red dot on every hidden ring.) The portfolio row's arrow is a
second path on a short delay, so the loop closes and then the arrow leaves for
the QR.

Rows with a URL are real `<a>` elements, so keyboard focus reveals their mark
too. Objects get `.frb-lift` instead — a five-pixel rise and a degree of tilt.

Under `prefers-reduced-motion: reduce` the transitions are dropped: every mark
still appears on hover, instantly.

## The QR codes are real

`portfolioUrl` and `codeUrl` are encoded by a QR encoder that ships in this
file — byte mode, error-correction level M, versions 1 to 10, which covers any
URL up to 213 bytes. It picks the smallest version that fits, computes the
Reed-Solomon codewords, lays out the function patterns, tries all eight masks
and keeps the one with the lowest penalty.

This matters because **a decorative QR is worse than no QR on a CV**. Nobody
discovers it does not work until someone points a phone at it.

The encoder lives in a `// #region qr` block, so the published component stays
one file while `tests/flatlay-resume-board.test.mjs` lifts it out and runs it
against matrices captured from a build whose every output was decoded back to
its exact input by a third-party reader. The rendered SVG was scanned too, not
just the matrix.

One bug is worth knowing about, because it is invisible: from version 7 up,
alignment patterns sit on the timing row and column. Skipping those — which is
what happens if you treat "a module is already set" as "already handled" —
produces a code that looks completely normal and never scans. The test asserts
those two patterns explicitly.

If a URL is longer than 213 bytes the encoder returns `null` and the component
draws a plain grey square rather than a truncated code.

The modules are drawn as **one path per code**, not a `<rect>` each. Separate
rects leave anti-aliased seams between neighbours at any fractional scale, and
a seam through a finder pattern's 3-wide core breaks the 1:1:3:1:1 run every
reader looks for first — the matrix was perfect and a screenshot of the page
would not decode. One path has no seams; a screenshot of the rendered board
now decodes to both URLs exactly.

## The texture

The crumple on the receipt, the creases on the backing sheet and the folds in
the denim are one technique: `feTurbulence` lit by `feDiffuseLighting` from
the top-left, multiplied into the paper. Two things make it read as paper
rather than stucco. It is `type="turbulence"` at a *low* frequency with one or
two octaves — the zero-crossings of |noise| become long sharp ridges with flat
paper between, which is what a crumpled-then-flattened sheet looks like; a
high frequency with more octaves gives a popcorn ceiling. And the lit result
is put through `feComponentTransfer` so flat paper lands on white and only the
folds take tone.

Every sheet is torn twice: a fibrous white fringe on its own seed, inflated a
little, under the paper itself, so the edges read as pulled apart rather than
cut. The denim adds a rotated twill pattern and threads sticking out of its
edges; the desk is a fine screened fibre; grain goes over the lot. All of it is
`<defs>` in the same SVG — nothing is loaded.

## About the defaults

`photo` is unset by default and the card draws a stand-in: a three-quarter
profile in a dark jacket, no features, because at card size a silhouette reads
as a photograph and a drawn face reads as a cartoon. That is not a placeholder
habit — 21st's capture sandbox blocks external origins, so a component whose
default state points at an image URL builds fine and then never generates a
cover image.

The demo shows a real face anyway: `demo.tsx` carries the portrait as a data
URI — a 288×328 black-and-white JPEG, about 7KB — which has no origin to block.
Any `photo` goes through the same treatment on the card: desaturated and
pushed a little in contrast, then the shade gradient and the grain that the
drawn stand-in gets, so a colour headshot from a phone comes out as the same
black-and-white print as the rest of the board.

The default URLs are the one exception, and they are not loaded: they are
encoded into a matrix locally, and followed only on click. Nothing in this
component fetches anything.

## Deliberate departures from the reference

- **The app tiles are monograms, not logos.** The reference shows Adobe's
  product icons; those are trademarks and are not reproduced. `tiles` takes
  whatever labels and tints you want; the chrome bevel is the reference's.
- **The badge at the foot of the receipt reads `CODE`**, not a third-party
  wordmark, for the same reason.
- **The two chalk crosses beside "my portfolio" are gone.** At UI size they
  read as close buttons, twice.
- **Nothing is ringed at rest.** The reference has a static loop on one row;
  here the loop is the hover.
- **The strips are labelled "soft skills"**, not "skills" — that is what they
  are, and it keeps them apart from the software on the SD card and the tiles.

## Checks worth repeating

```bash
npm run dev     # then ?dark, hover the rows, tab through the links, and drag the window to phone width
npm run check
node tests/flatlay-resume-board.test.mjs
```

The board uses no semantic colour tokens — it is a photograph of a desk, so it
looks identical in both themes by design.
