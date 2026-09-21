# Chroma Glitch Preloader

Heavy chromatic aberration (3.5x the cinema grade) pulling the RGB channels apart toward the edges, over colour-rich footage where the fringing reads loudest.

A 3D typography cube tumbles a word one letter per face over a WebGL-graded
video plate, with a percentage counter underneath. Loops forever, or gates a
page and lifts to reveal it.

```tsx
import ChromaGlitchPreloader from "@/components/ui/chroma-glitch-preloader"

// Looping loader, nothing else on screen
<ChromaGlitchPreloader loop />

// Page gate: lifts to reveal children
<ChromaGlitchPreloader word="LOADER" videoSrc="/reel.mp4" onComplete={() => {}}>
  <YourPage />
</ChromaGlitchPreloader>
```

**No dependencies beyond React.** The tumble is scoped CSS keyframes; the grade
is one inline WebGL2 fragment shader.

## Defaults

| | |
|---|---|
| `shaderPreset` | `"chroma"` |
| `word` | `"GLITCH"` |
| `videoSrc` | `flower.mp4` (MDN shared-assets, CORS-enabled, openly licensed) |

| Preset | Chroma | Grain | Scanlines | Contrast | Mono |
|---|---|---|---|---|---|
| `chroma` | 2.8 | 0.22 | 1.0 | 1.6 | — |

All four presets ship in the file, so `shaderPreset` still switches the look;
only the default differs between the members of this family.

## Props

| Prop | Default | Description |
|---|---|---|
| `word` | `"GLITCH"` | Letters tumbled through the cube, one per face |
| `loop` | `false` | Run forever. `children` are never revealed and `onComplete` never fires. |
| `children` | — | Content revealed when the gate lifts. Ignored while `loop` is set. |
| `videoSrc` | see above | Background reel. `""` runs the procedural plate instead. |
| `shaderPreset` | `"chroma"` | `cinema` \| `chroma` \| `highcontrast` \| `subtle` \| `off` |
| `grade` | — | Per-knob overrides: `{ chroma, grain, scanlines, contrast, monochrome }` |
| `durationMs` | derived from `word` | One cycle. `max(3200, letters x 600 + 600)` ms. |
| `speed` | `1` | Divides the whole choreography |
| `cubeSize` | `"88px"` | Cube edge length, and so the letter size. 64px under 840px wide. |
| `height` | `"100svh"` | Root height — a definite length, never a percentage |
| `onComplete` | — | Fired once when the gate finishes lifting |
| `className` | `""` | Extra root class names |

## Supplying your own reel

The shader samples the video as a GPU texture, so a cross-origin reel **must**
send `Access-Control-Allow-Origin`; without it the texture upload throws and
the component falls back to its procedural film plate. Same-origin files (your
`public/`) always work. Google's old `gtv-videos-bucket` sample URLs, used in
most tutorials, now return 403.

If no reel is supplied, is still buffering, is blocked, or fails outright, the
shader renders a procedural plate instead. The screen is never a black
rectangle.

## Install safety

- Explicit `height`, never `h-full`, which collapses to `0px` in a page with no
  `html, body { height: 100% }` chain.
- Every rule in the scoped `<style>` block is `.tcp-` prefixed.
- `video` and `canvas` reset `max-width`/`height`, which Tailwind Preflight
  would otherwise set to `100%`/`auto` and collapse.
- Without WebGL2 the raw `<video>` stays visible rather than hiding behind a
  blank canvas.
- `prefers-reduced-motion: reduce` holds one static letter and pauses the reel.

## Family

One engine, three baked looks — `tests/preloader-family.test.mjs` asserts the
three files stay identical apart from their defaults:

- [`cinema-grain-preloader`](../cinema-grain-preloader) — grain and scanlines
- [`chroma-glitch-preloader`](../chroma-glitch-preloader) — chromatic tearing
- [`mono-contrast-preloader`](../mono-contrast-preloader) — crushed monochrome
