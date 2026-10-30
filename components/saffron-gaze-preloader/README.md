# Saffron Gaze Preloader

A painted film poster that wakes up. On a black stage, a letterbox window opens
on a pair of painted eyes, shut, under a bindi sun. Saffron clouds pour in over
its corners while the page loads. When it is done, the eyes open and look at
you. Made as the opening screen of an animated portfolio.

## The storyboard

1. **Slit.** A thread of light is drawn across the black. The window opens
   from it top and bottom, like an eyelid, and the eyes inside are closed.
2. **Load.** The load drives the whole painting. Clouds pour in from the
   window's corners one by one. The sun grows its rays and sparkles ignite in
   turn. The title fills letter by letter behind a glowing pen edge, so it
   works as the progress bar. A caption counts `LOADING · 0%` → `100%` with a
   line in Devanagari under it.
3. **Awaken.** Near the end the lashes flutter. At 100% the eyes spring open.
   The sun flares and throws two rings, the moon rises and gold filigree draws
   itself from the sun over each brow into a curl. A shine runs across the
   title, the subtitle sets beneath it, and the caption turns to
   `CLICK TO ENTER`.
4. **Hold.** The eyes are alive. They follow the pointer, glance about on
   their own and blink now and then. Tap one and it winks. The clouds drift
   and lean away from the pointer, the sparkles twinkle and the small rays
   turn.
5. **Enter.** The eyes close and the text falls away. The window folds back
   into its slit and the clouds sink into it. The slit stretches edge to edge,
   and the black parts top and bottom to reveal your page: the visitor's own
   eyes opening. With `loop`, the slit shrinks away instead and the whole
   thing starts again.

Click, Enter or Space during the load rushes it to 100%. During the hold, the
same keys go straight in. `autoEnter` (on by default) goes in by itself after
`holdMs`.

```tsx
import SaffronGazePreloader from "@/components/ui/saffron-gaze-preloader"

// Looping showcase
<SaffronGazePreloader loop />

// Page gate, driven by real progress
<SaffronGazePreloader progress={loaded} onComplete={() => {}}>
  <YourPortfolio />
</SaffronGazePreloader>

// Your own name, words and colours
<SaffronGazePreloader
  title="AARUSHI"
  subtitle="आरुषि"
  kicker="Studio Aarushi"
  credit={{ eyebrow: "Portfolio · 2026", name: "AARUSHI", note: "Illustration & motion" }}
  monogram="A"
  palette={{ skin: "#2f6a7c", skinLight: "#6fb3bf", skinDeep: "#0f2a38", cloud: "#b9c7cf" }}
/>

// Your own portrait in the window instead of the painted eyes
<SaffronGazePreloader image="/me-eyes.jpg" imagePosition="50% 40%" />
```

## How it is made

There are no dependencies beyond React, and nothing is fetched.

- **The skin** is brushed onto a canvas once per size. A tone map shapes the
  face: shadow pooled in the sockets, light on the brow bone, the cheekbones
  and the bridge of the nose, and the forehead warmed by the sun. Several
  thousand seeded strokes then follow a flow field that runs around the eyes,
  around the sun and down the nose. Hair falls in at the corners, and a
  dry-brush edge makes the window read as paint laid on black.
- **The clouds** are painted dab by dab on their own canvases. Each one is lit
  from the direction of the sun, with a sunlit crown on every lobe, a
  shadowed belly and a flat base. Each is its own compositor layer, so the
  parallax costs nothing.
- **The eyes** are live SVG: lid curves, kajal with a wing, lashes, brows,
  iris fibres and catchlights. Lids, gaze and blinks are driven every frame.
  Attributes are written only when their values change.
- **The type** is a built-in condensed poster face, drawn from primitives, so
  the poster looks the same on every machine. It covers `A–Z`, `0–9` and
  `. ' - ! /`. Lower case is lifted, accents are dropped and anything else
  becomes a space.

It holds about 60 fps in a software renderer at 1440 × 900. The painting is
deterministic, so every visitor sees the same picture.

## Props

| Prop | Default | Description |
|---|---|---|
| `children` | none | The page behind the gate. It is mounted the whole time and revealed when the black parts. Ignored while `loop` is set. |
| `loop` | `false` | Load, awaken, hold, fold shut, repeat. `onComplete` never fires. |
| `progress` | none | Real progress from `0` to `100`. Leave it out to run a simulated load. The eyes open at `100`. |
| `durationMs` | `4600` | Length of the simulated load. It surges and stalls like a real one. |
| `holdMs` | `3400` | How long the open eyes hold before the gate lifts on its own. |
| `autoEnter` | `true` | Lift after `holdMs`. Set `false` to wait for a click, Enter or Space. |
| `title` | `"DARSHAN"` | The big word, in the built-in face. |
| `subtitle` | `"दर्शन"` | The line under the title, in any script. Pass `""` to drop it. |
| `kicker` / `kickerSub` | `"Nayana Studio"` / `"presents"` | The tracked lines at the top. |
| `loadingLabel` / `loadingSub` | `"Loading"` / `"बस कुछ ही पलों में"` | The caption while loading. The count is set after the label. |
| `enterLabel` / `enterSub` | `"Click to enter"` / `"प्रवेश करें"` | The caption once the eyes are open. |
| `credit` | Nayana credit | `{ eyebrow?, name, note? }`, bottom left. `name` is set in the display face. Pass `null` to drop it. |
| `monogram` | `"N"` | One or two characters in the sun badge, top right. Pass `""` to drop it. |
| `image` | none | Your own portrait in the window, graded into the palette as a duotone. The clouds, sun, sparkles and moon still paint over it. The painted eyes' gaze and blink do not apply. |
| `imagePosition` | `"50% 35%"` | Where the photo is cropped from, as CSS `object-position`. |
| `palette` | saffron | Partial colour overrides, as hex. See below. |
| `gaze` | `1` | How far the eyes follow the pointer. `0` keeps them still. |
| `blink` | `true` | Blink now and then while the eyes are open. |
| `counter` | `true` | Show the percentage after the loading label. |
| `fontFamily` | system sans stack | Face for the small text. Nothing is fetched, so pass one the host already loads. |
| `scriptFontFamily` | Devanagari system stack | Face for the subtitle and the sub-captions. |
| `height` | `"100svh"` | Root height while the gate is up. Always a definite length, never `h-full`. After the reveal the root becomes `auto`, and your page flows and scrolls normally. |
| `onComplete` | none | Fired once, after the page is revealed. |
| `className` | `""` | Extra root classes. |

### Palette

Colours are hex, because the painting mixes them on canvas.

| Key | Default | Used for |
|---|---|---|
| `stage` | `#0a0604` | The black stage and the parting curtains. |
| `skin` / `skinLight` / `skinDeep` | `#dd7a36` / `#f2a95e` / `#8e3410` | The painted skin: mid tone, highlight and shadow. |
| `ink` | `#1a0b05` | Lashes, brows, kajal, hair and pupils. |
| `cream` | `#f9e7c6` | Sclera, sparkles, rays, moon, filigree and rim light. |
| `iris` / `irisDeep` | `#d08a2e` / `#5a2408` | The iris and its rim. |
| `bindi` | `#c0261b` | The bindi at the sun's heart. |
| `cloud` / `cloudLight` / `cloudDeep` | `#e07f3c` / `#f8c993` / `#9a3a12` | The clouds: body, sunlit crowns and bellies. |
| `title` | `#f0a048` | The display type and the gold of the filigree. |
| `text` | `#f1e0c4` | Small text. |

## Notes

- The layout is calculated from the box. Landscape gives the wide letterbox.
  Portrait gives a taller window and a stacked poster.
- The stage keeps its own black, so it reads the same in light and dark hosts.
- `prefers-reduced-motion` drops the slit, the pour, the flutter, the gaze,
  the blinks, the drift and the curtains. The eyes are shown open and the
  phases cross-fade.
- The gate is `role="progressbar"` and carries its value. It is focusable and
  works with Enter and Space. The page underneath is `inert` until it is
  revealed, and the title is announced when loading finishes.
