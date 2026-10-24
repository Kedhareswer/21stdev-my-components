# Wild Hunt Footer

A poster-red site footer under a romantic painting. The sky dissolves into
the red field through an ordered-dither edge while the figures, supplied as a
cut-out layer, ride on over it as crisp silhouettes — red filling in around
hooves, hair and the ravens. The wordmark is set in a bitmap blackletter drawn
for this component — 41 glyphs on a 20-row cell grid, no font file — and a
calligraphic flourish writes itself across it, carving a knockout through the
letters. Tiny tracked captions run up the sides, dotted guide circles and
coordinate ticks sit around the word, and your link columns, a back-to-top
and a colophon line finish the sheet over a fine print grain.

## Storyboard

From the moment the footer scrolls into view:

1. The picture rasters in from the top and breaks into pixels where it meets
   the red; the cut-out riders wipe in over it a beat behind.
2. The wordmark resolves from 8-cell blocks to 4, to 2, to 1, with a last
   flicker of cells blinking in.
3. The flourish writes through the word, left loop to right tail.
4. The captions, columns and marks wipe in with a stagger.

## Interaction

- **Move** across the sheet and a dotted reticle follows with its grid
  coordinate (A1–P9) and pixel position. Over the picture it clears the
  dither to show more of the painting; over the word it scatters the letter
  cells it passes, which snap home as it leaves.
- **Click** anywhere that is not a link and a scanline runs down the sheet,
  re-rastering the word and re-dissolving the picture as it crosses them.
- **Leave it** and everything settles. The canvases stop drawing once nothing
  moves, and sleep off-screen.

**No dependencies.** React is the only import. Three small 2D canvases (the
dither, the word, the grain), one SVG for the marks and the flourish, real
anchors for the links.

**Two remote assets, both props.** The default picture is Peter Nicolai
Arbo's *Åsgårdsreien* (The Wild Hunt of Odin), 1872, Nasjonalmuseet, Oslo —
public domain, served by Wikimedia Commons. Its cut-out is a subject matte of
the same scan (Photoshop select-subject on the 3840px file, exported as a
2048px WebP with alpha, 150 KB), kept in this repository under
`media/wild-hunt-footer/riders.webp` and served from jsDelivr pinned to a
commit, so the URL never moves. Neither image has its pixels read, so any
origin works without CORS. The other demos use Aivazovsky's *The Ninth Wave*
(1850) and John Martin's *The Great Day of His Wrath* (1851–53) without a
cut-out, so the whole picture dissolves.

**Making your own cut-out.** Take the picture you pass as `src`, remove its
background in any tool (Photoshop, remove.bg, Preview's Remove Background) so
only the subject remains, export at the same proportions as the original as
PNG or WebP with alpha, and pass its URL as `cutout`. Because both layers
share `position` and the same box, they register automatically.

```tsx
import WildHuntFooter from "@/components/ui/wild-hunt-footer"

<WildHuntFooter />

<WildHuntFooter
  preset="cobalt"
  wordmark="MAELSTROM"
  image={{ src: "/paintings/ninth-wave.jpg", alt: "The Ninth Wave", position: "50% 42%" }}
  tagline="A nautical almanac · since 1850"
  sideNote="Printed in Saint Petersburg · read at sea"
  columns={[
    { title: "Almanac", links: [{ label: "Tide tables", href: "/tides" }] },
    { title: "Contact", links: [{ label: "post@maelstrom.press", href: "mailto:post@maelstrom.press" }] },
  ]}
  colophon="Painting: Ivan Aivazovsky, The Ninth Wave, 1850. Public domain."
  legal="© 2026 Maelstrom Press"
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `wordmark` | `"HUGINN"` | The giant word. A–Z, 0–9, `& . - ' !` are drawn in the blackletter; anything else is set in the page's bold face and pixelated to the same grid. Lowercase sets as capitals. |
| `image` | Arbo, *Åsgårdsreien* + its riders | `{ src, alt?, position?, cutout? }`. `position` is CSS object-position shared by both layers, default `"50% 26%"`. `cutout` is the subject-only version of `src` with alpha. |
| `imageHeight` | `0.62` | The picture's box as a fraction of the footer's height, 0.3–0.8. The cut-out reaches its bottom; the plain picture is red well before it. Capped at 0.5 under 720px. |
| `dissolve` | `0.4` | Where the dissolve begins, as a fraction of the picture's box. It is fully red 0.28 further down, and the word may rise to just below that line. |
| `tagline` / `sideNote` | studio lines | Vertical captions, left (read bottom to top) and right (top to bottom). Hidden under 720px. Pass `""` to drop one. |
| `columns` | Work · Studio · Elsewhere · Contact | `{ title, links: { label, href? }[] }[]` |
| `colophon` / `legal` | painting credit / `"© 2026 Huginn Studio"` | The bottom line. |
| `backToTop` | `true` | Scrolls the window to the top. |
| `sigils` | `true` | The two small sun marks by the legal line. |
| `preset` | `"vermilion"` | `vermilion` · `ink` · `cobalt` · `bone` |
| `palette` | — | `{ background, ink }` overrides. |
| `tracking` | `2` | Cells between letters. |
| `grain` | `0.6` | Print grain and speckle, 0–1. |
| `interactive` | `true` | Reticle, scatter, halo and click. |
| `fontFamily` / `monoFamily` | Inter → Helvetica / JetBrains Mono → system | Faces for the captions and for the coordinates. |
| `height` | `"min(100svh, 920px)"` | A definite length. |

## Notes

- **The blackletter.** Every glyph was drawn as broad-nib pen strokes at a 42°
  nib angle and sampled to a 20-row grid, so stems, lozenge terminals and
  hairlines come from one hand. Cell size follows the room between the picture
  and the columns, so the word fills the width at 1440 and still reads at 375.
- **Dark mode.** The footer carries its own palette, so it looks the same on
  a light or a dark page. Use `preset="ink"` or `"bone"` to match either.
- **Accessibility.** The canvases and marks are hidden from screen readers.
  The wordmark is also in the page as text, the picture's `alt` is on the
  picture, and every link is a real, focusable anchor.
- **Reduced motion.** The sheet renders finished at once: no raster-in, no
  scatter, no scanline. The reticle still follows the pointer.
- **Cover rendering.** 21st's capture sandbox blocks external origins, so the
  picture and its cut-out will not appear in a server-generated cover; supply
  your own.
