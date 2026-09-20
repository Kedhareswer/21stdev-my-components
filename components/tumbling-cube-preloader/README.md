# Tumbling Cube Preloader

A loading screen built from two things: a WebGL-graded background plate
(chromatic aberration, film grain, CRT scanlines, contrast) and a 3D
typography cube that tumbles a word through it one letter per face, with a
percentage counter underneath.

Runs as a looping showcase, or as a real page gate that lifts to reveal your
content.

```tsx
import TumblingCubePreloader from "@/components/ui/tumbling-cube-preloader"

// Looping loader — no destination, runs forever
<TumblingCubePreloader loop word="LOADER" />

// Page gate — lifts to reveal children
<TumblingCubePreloader
  word="LOADER"
  videoSrc="/reel.mp4"
  onComplete={() => console.log("unlocked")}
>
  <YourPageContent />
</TumblingCubePreloader>
```

**No dependencies beyond React.** The tumble is scoped CSS keyframes; the
grade is one inline WebGL2 fragment shader. No animation runtime, no shader
library, no CSS file to import.

## Props

| Prop | Default | Description |
|---|---|---|
| `word` | `"LOADER"` | Letters tumbled through the cube, one per face |
| `loop` | `false` | Run forever. `children` are never revealed and `onComplete` never fires. |
| `children` | — | Content revealed when the gate lifts. Ignored while `loop` is set. |
| `videoSrc` | an MDN open-movie clip | Background reel. `""` runs the procedural plate instead. |
| `shaderPreset` | `"cinema"` | `cinema` \| `chroma` \| `highcontrast` \| `subtle` \| `off` |
| `grade` | — | Per-knob overrides: `{ chroma, grain, scanlines, contrast, monochrome }` |
| `durationMs` | derived from `word` | One cycle. Defaults to `max(3200, letters × 600 + 600)` ms. |
| `speed` | `1` | Divides the whole choreography — `2` runs it twice as fast |
| `cubeSize` | `"88px"` | Cube edge length, and so the letter size. Drops to 64px under 840px wide. |
| `height` | `"100svh"` | Root height — a definite length, never a percentage |
| `onComplete` | — | Fired once when the gate finishes lifting. Never fires while looping. |
| `className` | `""` | Extra root class names |

### Shader presets

| Preset | Chroma | Grain | Scanlines | Contrast | Mono |
|---|---|---|---|---|---|
| `cinema` | 0.8 | 0.15 | 0.8 | 1.4 | — |
| `chroma` | 2.8 | 0.22 | 1.0 | 1.6 | — |
| `highcontrast` | 0.5 | 0.20 | 0.6 | 2.2 | ✓ |
| `subtle` | 0.1 | 0.05 | 0 | 1.1 | — |
| `off` | *skips WebGL entirely and shows the raw `<video>`* |

Mix a preset with `grade` to tweak one knob:
`shaderPreset="cinema" grade={{ grain: 0.3 }}`.

## Supplying your own reel

The shader samples the video as a GPU texture, so a cross-origin reel **must**
send `Access-Control-Allow-Origin`. Without it the texture upload throws and
the component falls back to the procedural plate. Same-origin files (anything
in your `public/`) always work.

The default reel and the demo's reel list point at
[`mdn/shared-assets`](https://github.com/mdn/shared-assets), which serves CORS
headers and hosts openly licensed Blender open-movie clips. Note that Google's
old `gtv-videos-bucket` sample URLs — the ones in most tutorials — now return
403.

If no reel is supplied, is still buffering, is blocked, or fails outright, the
shader renders its own procedural film plate (drifting luma under the same
grain, scanlines and vignette). The screen is never a black rectangle.

## How it works

1. **The cube.** `perspective: 800px` over a `preserve-3d` stack of
   absolutely-positioned letters, cycling five rotation patterns
   (`rotateY(90deg)`, `rotateX(-90deg)`, …) on
   `cubic-bezier(0.83, 0, 0.17, 1)` with a 600ms per-letter stagger, so each
   character reads as a face of one rotating die.
2. **The grade.** One full-screen quad; the reel arrives as a texture and is
   sampled three times at radially-displaced offsets for chromatic aberration,
   then graded, scanlined, grained and vignetted. Aspect-corrected in the
   shader, so the reel is never stretched.
3. **Difference blend.** The type sits in `mix-blend-mode: difference` over
   the plate, so it inverts against whatever the footage is doing rather than
   needing a scrim. On very bright footage this naturally drops in contrast.
4. **The counter.** A fast rise decelerating into a stall in the 42–48% band —
   the way a real asset queue behaves — then a surge to 100. Monotonic by
   construction: a loading counter that ticks backwards reads as broken.
5. **The loop.** At 100% the counter slides out of its clip box; a beat later
   the cube remounts and the cycle restarts. The shader never fades, so the
   plate is continuous across cycles.

## Install safety

- The root takes an explicit `height` and never uses `h-full`, which would
  collapse to `0px` in a page without an `html, body { height: 100% }` chain.
- Every rule in the scoped `<style>` block is prefixed `.tcp-` — installing
  this cannot restyle the host app.
- The `<video>` and `<canvas>` explicitly reset `max-width` and `height`,
  which Tailwind Preflight would otherwise set to `100%` / `auto`, collapsing
  them inside the absolutely-positioned container.
- Without WebGL2 the raw `<video>` stays visible rather than being hidden
  behind a blank canvas.
- `prefers-reduced-motion: reduce` holds a single static letter at 100%, stops
  the tumble, and leaves the reel paused.
- Fonts use a full fallback stack (`Saira Extra Condensed` → `Oswald` →
  `Impact` → `sans-serif`) and are never `@import`ed — the host app owns
  webfonts.

## Demos

| File | Shows |
|---|---|
| `demo.tsx` | Looping, with a dock to switch word, shader preset, grain and reel |
| `demo-plate.tsx` | Looping with no reel at all — the procedural plate, zero network calls |
