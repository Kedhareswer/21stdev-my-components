# Polaroid Zine Hero

An editorial zine page as a hero: a cream sheet with a taped typewritten slip,
a centre print whose subject is cut out of its own frame, five pinned
snapshots, a handwritten line running over the print, and a justified
typewriter column. The page dots and the edge arrow are real carousel
controls, not decoration.

Everything is generated — no image file, no icon set, no font file. The
handwriting, the paper tooth, the film grain, the pins and the stand-in
photographs are SVG paths, gradients and filters in the one component file.

## Usage

```tsx
import PolaroidZineHero from "@/components/ui/polaroid-zine-hero"

<PolaroidZineHero />                                  // three pages, drawn stand-ins
<PolaroidZineHero portrait={me} photos={childhood} /> // your own photographs
<PolaroidZineHero slides={[page]} />                  // one page, no carousel
<PolaroidZineHero height="46rem" />                   // inside a page section
```

No npm dependencies beyond React, and no Tailwind utilities — every rule is
scoped to `.pzh-*` inside the component's own `<style>`.

## Props

| Prop | Default | What it does |
|---|---|---|
| `height` | `"100svh"` | Height of the hero. Must be a definite length. |
| `minHeight` | `"560px"` | Floor, so the page stays readable on short viewports. |
| `slides` | three pages | Each is `{ script, tail, note, body }`. One slide hides the controls. |
| `portrait` | drawn stand-in | Image URL for the centre print. |
| `photos` | drawn stand-ins | Up to five image URLs for the pinned snapshots. |
| `issue` / `handle` | November 2025 | The two footer lines. |
| `onSlideChange` | — | Fires with the new index, by control or arrow key. |
| `className` | — | Appended to the root. |

Do not pass `height="100%"`. The page is fitted to the root's box, so a
percentage height collapses to 0px on any page whose ancestors up to `<html>`
lack a definite height — which is every installed page.

### Writing `body`

`body` lines are **already broken** and each is stretched to one measured
width, which is how a typewriter justifies and why short lines open into wide
gaps instead of trailing off. Keep lines near 39 characters; a much shorter one
will stretch into something very airy, and a much longer one will crowd.

## Why the handwriting is drawn

The script is path data, not a font. No handwriting face is safe to assume:
the usual stack resolves to a different face on macOS, Windows and Linux, and
to a plain serif on the headless Linux box that renders 21st's cover image.
Every character is drawn as centre-line strokes on a shared baseline —
x-height `-34`, cap `-62`, ascender `-70`, descender `+22` — stroked with a
round pen and slanted at draw time.

The line over the print carries a light halo under the dark stroke. It crosses
the subject's black shirt, and without it the middle of the sentence
disappears. On the print's light ground the halo is invisible.

**A character with no glyph renders as a blank, silently** — `writeScript`
falls back through lowercase to a space rather than throwing.
`tests/polaroid-zine-hero.test.mjs` asserts full coverage of `script` and
`tail`; run it after changing that copy. `note` and `body` are set in a real
monospace face and need no glyph.

## About the default photographs

`portrait` and `photos` are unset by default and the component draws its own
stand-ins. That is not a placeholder habit — 21st's capture sandbox **blocks
external origins**, so a component whose default state points at a photo URL
builds fine and then never generates a cover image. The same rule is why
`hover-expand-gallery` ships gradients rather than photos.

The stand-ins are flat, high-contrast figures. They read as scanned snapshots
at print size, but they are drawings, not photographs — pass `portrait` and
`photos` for the real thing.

One behaviour differs between them. The drawn portrait is clipped to a taller
box than the print window, so the shoulders run past the frame's bottom edge
the way a cut-out subject does. A supplied `portrait` is clipped to the window
instead, because the component cannot know where the subject ends in someone
else's photograph.

## Carousel behaviour

Arrow keys page the carousel whenever focus is anywhere inside it; the edge
arrows and the dots are drawn in the page's own coordinates and are focusable
controls with labels. Reaching either end unmounts that end's arrow, so focus
is returned to the root — otherwise it falls to `<body>` and every later arrow
key is swallowed.

The page change cross-fades, and both the animation and the transition are
switched off under `prefers-reduced-motion`. There is no autoplay.

## Checks worth repeating

```bash
npm run dev     # then ?dark, and drag the window to phone width
npm run check
node tests/polaroid-zine-hero.test.mjs
```

The component uses no semantic colour tokens: it is a printed sheet, so it
looks identical in both themes by design. The dark check confirms nothing
inverts.
