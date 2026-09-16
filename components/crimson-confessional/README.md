# Crimson Confessional

A scroll-scrubbed noir sequence. Each chapter is one word, one cryptic line,
and a procedural motif drawn from scroll position. Red, black, bone, and a lot
of grain.

**No dependencies.** React is the only import, one 2D canvas, no CSS file, no
animation library, no fonts to download.

## How it works

Scroll *is* the timeline. There is no autoplay and no tween: every frame reads
the root's `getBoundingClientRect()`, turns that into 0–1, and draws. Scrub
backwards and it runs backwards, at whatever speed you scrub.

Nothing in it is an asset. The light cone, the puppet strings, the receding
grid, the iris, the glyph flood and the CRT collapse are all a few dozen lines
of canvas each, so the component weighs nothing and scales to any resolution.

```
motif      what it draws
---------  ------------------------------------------------------------
beam       a hard triangular shaft, drifting motes, a figure standing in it
strings    taut lines converging above the frame, swaying, knotted at the end
race       a grid running to a vanishing point with runners who never arrive
watch      an iris: arcs with a rotating gap closing on a slit
flood      columns of glyphs falling at different rates
static     blocky CRT noise and a rolling band
void       the picture squashing to a line, then to a point
```

## Usage

```tsx
import CrimsonConfessional, { type Chapter } from "@/components/ui/crimson-confessional"

<CrimsonConfessional />                          // the seven-chapter default

const chapters: Chapter[] = [
  { word: "OFFER", line: "It was free. That was the tell.", motif: "beam" },
  { word: "TERMS", line: "You accepted on page nine.", motif: "flood", censor: true },
  { word: "SOLD",  line: "Not the product. Never the product.", motif: "void" },
]
<CrimsonConfessional chapters={chapters} chapterScroll={1} />
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `chapters` | seven | `{ word, line?, motif, censor? }`. Any length. |
| `chapterScroll` | `1.35` | Viewport-heights of scroll per chapter. Below ~0.8 the type has no time to land. |
| `ink` / `bone` | `#07070a` / `#e6e0d6` | The bone is deliberately not white. |
| `crimson` | `#e01221` | Everything bright is this colour. |
| `oxblood` | `#3d070d` | The field under everything. |
| `grain` | `0.16` | `0` disables it. Above ~`0.3` it eats the type. |
| `scanlines` | `true` | |
| `className` | `""` | Appended to the root. |

`censor: true` wipes a flat red bar across the word as that chapter peaks and
leaves it there — the block over the face, from the reference.

`clamp01`, `smoothstep`, `progressFrom`, `chapterAt` and `typeOpacity` are
exported, so the same scroll position can drive something of your own
alongside it.

## Notes

- **The root's height is the timeline**: `chapters.length * chapterScroll`
  viewports. The stage inside is a `sticky` child at `100svh`. Give the
  component a parent with a width and nothing else.
- Progress is measured from **the element**, never `window.scrollY`. The
  component can sit anywhere on a page, after content whose height changes
  after load, and still be in step.
- Scroll writes a number; the rAF loop reads it. Drawing inside the scroll
  handler runs it several times per frame on a trackpad and janks the page.
- The canvas re-renders every frame, but React only re-renders the type layer
  when the chapter or a quantised slice of progress changes — not sixty times
  a second for two lines of text.
- `prefers-reduced-motion` stops the loop entirely and repaints on scroll
  instead, so the sequence still advances chapter by chapter without anything
  animating.
- The chapters also exist as an ordinary `sr-only` list, because the canvas is
  `aria-hidden` and a screen reader would otherwise find an empty seven-screen
  scroll.
- Grain and static are drawn as sparse rectangles, not per-pixel `ImageData` —
  at device resolution the per-pixel version costs more than everything else in
  the component put together.
- No images, so nothing to taint the canvas and nothing to load.

## Credit

Art direction assembled from reference: red marionette strings and the rat
race, a hard triangular light cone with a lone figure in it, a flat red block
over a face, a wall of monospace code for overwhelm, and a CRT going dark.
The implementation is original.
