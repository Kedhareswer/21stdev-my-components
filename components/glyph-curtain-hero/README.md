# Glyph Curtain Hero

A travel hero where an illustrated roof hangs a curtain of script. Every column of the curtain is a string of glyphs in the place's own writing:

- Chinese for China;
- kana and kanji for Japan;
- Kazakh Cyrillic for Kazakhstan;
- and so on.

Move the pointer through the curtain and the strings wrap around it like a hand pressed into a bead curtain, then drift home when it leaves.

Small framed cards at either side, or the arrow keys, change destination. The roof slides off one edge with its strings trailing, the headline blurs away, and the next roof glides in from the other edge while the new headline sharpens word by word.

**No dependencies.** React is the only import.

## Motion

| What | How |
|---|---|
| Strings | Each string is a damped hanging line. Its glyphs move only sideways and keep their spacing, so a bent string rises at the bottom. It is stiffer near the eave, like a real chain. Glyphs turn to follow the string. A faint breeze keeps the curtain alive at rest. |
| Pointer | A round collider about 6% of the stage wide. Glyphs are pushed out to its rim on the side they are on, so strings part around it and pile up at its edge. It eases after the pointer and swells in and out over about 0.1 s, so the curtain is pressed and released, never snapped. When it leaves, the strings settle in about a second without a wild swing. |
| Frames | The physics runs at a fixed 60 Hz. Each drawn frame blends the last two steps and is pinned to where the roof is now, so 120 and 144 Hz screens get smooth motion. |
| Change | The roof slides out (0.42 s, ease-in) and the words blur out together (0.36 s). The new eyebrow and headline blur in, 120 ms apart per word, from 0.64 s. The new roof enters from the far edge at 0.88 s (0.56 s, ease-out). Its strings lean back behind it and settle. A light horizontal blur follows the roof's speed. |
| Reduced motion | The strings hang still and destinations change in place with a short fade. |

## Layout

- On wide screens there are three columns: the destination text on the left, the stage in the middle, and the caption on the right. The cards sit level with the eaves, at the page gutter.
- Below 820 px the cards flank the stage, and the text and caption stack under it.
- The section has a woven-paper background of its own, plus a dark version under `.dark`.

## Usage

```tsx
import GlyphCurtainHero from "@/components/ui/glyph-curtain-hero"

<GlyphCurtainHero />
<GlyphCurtainHero initialIndex={2} onChange={(i) => console.log(i)} />
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `destinations` | Vietnam, China, Japan, Kazakhstan, Russia | See below. |
| `initialIndex` | `1` | The destination shown first. |
| `brand` / `links` / `cta` / `onCta` | "Eaves & Ink", three links, "Plan a trip" | The top bar. |
| `onChange` | — | Receives the new index. |
| `height` | `100svh` | Minimum height of the section. Must be a definite length. |
| `fontHref` | Google Fonts (Newsreader, IBM Plex Mono, Noto Serif SC/JP) | Pass `null` to bring your own. |

Each destination is `{ name, word, gloss, headline, caption, glyphs, glyphFont, roof }`:

- `glyphs` is the text threaded on the strings. Spaces leave gaps.
- `roof` is `{ src, width, height, scale, eave, span }`:
  - `scale`: the roof's width as a share of the stage;
  - `eave`: where the strings hang from, as a share of the roof's height;
  - `span`: the curtain's width as a share of the roof's width.

## Notes

- The roof illustrations were generated with ChatGPT and are served from the catalog site.
- The curtain is drawn on one canvas, at up to 2× device pixels. It pauses when the section is off screen.
