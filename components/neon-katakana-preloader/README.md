# Neon Katakana Preloader

A cyberpunk title-card loading gate. The word is **ウィンドウ** ("window"), and
the gate opens like one.

1. **Decode.** On black, with a blood-red haze rising off the floor, dotted
   data-rain falls in vertical streams. As the load runs, the rain condenses
   grain by grain into a glowing katakana word. Each grain drops into place
   from above, sweeping along the reading direction. A red dot-matrix
   `window` scrambles into place above it and a `000%` counter climbs below.
2. **Lock.** At 100% the word surges, a scan bar sweeps down it, the counter
   becomes the caption (which sometimes flips upside down), and the grains
   shimmer in place.
3. **Open.** A slit of light tears across the middle of the screen and opens
   into a full-bleed window onto whatever the gate was guarding, while the
   word melts back into rain.

In `loop` mode the word melts back into rain and decodes again, forever.

**Interactive.** Moving the pointer pushes the word's grain aside and stirs the
rain columns under it. Hovering the word makes it glitch more often (red ghost,
torn scanline bands). Each tap glitches it once. Tap, click, Enter or Space
rushes the load to 100%, then opens the window.

On a tall, narrow screen the word stacks vertically (tategaki), which is how
katakana is often set on signage.

```tsx
import NeonKatakanaPreloader from "@/components/ui/neon-katakana-preloader"

// Looping showcase, nothing else on screen
<NeonKatakanaPreloader loop />

// Page gate, driven by real progress
<NeonKatakanaPreloader progress={loaded} onComplete={() => {}}>
  <YourPage />
</NeonKatakanaPreloader>

// Your own sign
<NeonKatakanaPreloader
  word="ネオン"
  label="neon"
  caption="online"
  kicker="ネオン / sector 7"
  density={1.4}
  palette={{ glow: "#ff3df2", core: "#ffe1fb", accent: "#3dffb0", haze: "#2a0a5c" }}
/>
```

**No dependencies beyond React.** The word is rasterised from text at
runtime, sampled into grains, and eroded with value noise into a brushed,
drippy texture. Rain, word and glitch share one `<canvas>` and one
`requestAnimationFrame` loop. Grain, scanlines, haze and labels are scoped
CSS.

## Props

| Prop | Default | Description |
|---|---|---|
| `children` | — | Content revealed once the window opens. Ignored while `loop` is set. |
| `loop` | `false` | Decode → lock → melt, forever. `onComplete` never fires. |
| `progress` | — | Real progress, `0`–`100`. Leave it out to run a simulated load. The word waits for `100`. |
| `durationMs` | `4200` | Length of the simulated load. It surges and stalls like a real one. |
| `word` | `"ウィンドウ"` | The big word. Any script renders; katakana is what it was designed around. |
| `label` | `"window"` | Red dot-matrix line above the word; it decodes as the load runs. |
| `caption` | `"open"` | Dot-matrix line below the word once loaded. The percentage shows there until then. |
| `kicker` | `"窓 / mado-os"` | Top-left HUD mark. |
| `hud` | `true` | Show the four HUD corners: kicker, status, progress track and hint. |
| `density` | `1` | Rain density, `0` (none) to `2`. |
| `interactive` | `true` | Pointer pushes the grain and stirs the rain. |
| `palette` | see below | Partial overrides: `{ background, glow, core, accent, haze }`. |
| `fontFamily` | Japanese stack | Face the word is drawn in. Nothing is fetched. |
| `height` | `"100svh"` | Root height: a definite length, never a percentage. |
| `onComplete` | — | Fired once, after the window has opened. |
| `className` | `""` | Extra root class names. |

| Palette key | Default | Used for |
|---|---|---|
| `background` | `#040306` | the stage |
| `glow` | `#22c8ff` | the word, the rain, every bloom |
| `core` | `#cdf6ff` | the word's hot core, rain heads, the window frame |
| `accent` | `#ff2742` | dot-matrix labels, the glitch ghost, the status LED |
| `haze` | `#5c0820` | the haze rising from the floor |

## Fonts

The component never loads a font (no `@import`, no network). Its default stack
reaches for Yuji Syuku and Zen Antique (brush faces), then Hiragino Mincho, Yu
Mincho, Noto Serif/Sans JP, Hiragino Sans, Yu Gothic, Meiryo, IPAGothic and
WenQuanYi. The erosion supplies the brushed look whatever face it lands on. If
your app already loads a face with Japanese coverage, pass it through
`fontFamily`. The word is re-sampled once `document.fonts.ready` settles, so a
late web font is picked up.

## Install safety

- Explicit `height`, never `h-full`.
- Every rule in the scoped `<style>` block is `.nkp-` prefixed. Canvas
  `max-width` is reset against Tailwind Preflight.
- The canvas is DPR-aware (capped at 2×) and is rebuilt by a `ResizeObserver`.
  Grains already revealed stay revealed across a resize.
- `prefers-reduced-motion: reduce` turns off the rain, glitch, drop-in, grain
  drift, label flip and window tear. The word fades in by progress and the gate
  fades out.
- The gate is a focusable `role="progressbar"` with `aria-valuenow` and a
  polite live region.
