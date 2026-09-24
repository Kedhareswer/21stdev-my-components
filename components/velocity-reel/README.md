# Velocity Reel

A scroll-scrubbed cinematic title sequence. Ten shots on one canvas: a
rim-lit face, an archer drawing, an arrow through glass, a blade through what
is left of it, a fly-through of the shards, then a jet, a supercar and a
formula car tearing out of the debris on red light, a burst, and an emblem.

**No dependencies.** React is the only import. One 2D canvas, no CSS file, no
animation library, no fonts, no images — every shape, shard, flare and wheel is
drawn from numbers, so it weighs nothing and never waits on a download.

## How it works

Scroll *is* the timeline. Every frame reads the root's
`getBoundingClientRect()`, turns it into 0–1, picks the shot and how far
through it you are, and draws. Scrub backwards and it runs backwards: shard
positions, speed lines and the arrow's flight are functions of progress, not
accumulated state, so the same scroll position is always the same frame.

```
scene      what it draws
---------  --------------------------------------------------------------
portrait   a head in silhouette, back-lit; the pointer swings the key light
archer     a compound bow drawn to anchor, held, released; the string rings
arrow      a broadhead through a sheet of glass: cracks, shards, glitter
blade      an etched knife through suspended glass, a red bolt behind it
shatter    a fly-through of the frozen explosion, in depth
jet        a fighter out of the debris, afterburner lit
car        a supercar in profile, red-lit wheels, reflective floor
formula    an open-wheel car, lower and faster
burst      red rays pulling into a vanishing point
emblem     a bevelled star (or your own mark) landing out of the burst
```

**Interactive:** the pointer moves the camera and the key light; clicking the
stage fires a lens flare where you clicked; the rail on the right has one
labelled button per shot and jumps the page to it.

## Usage

```tsx
import VelocityReel, { type ReelChapter } from "@/components/ui/velocity-reel"

<VelocityReel />                                 // the ten-shot default

const chapters: ReelChapter[] = [
  { scene: "portrait", kicker: "Driver 07", title: "BREATHE", line: "Lights out in ninety seconds." },
  { scene: "car", title: "LAUNCH", cut: "flash" },
  { scene: "emblem", title: "PIT WALL" },
]
<VelocityReel chapters={chapters} accent="#2f7bff" rim="#ffd2a6"
  emblem="M20 40 L110 40 L180 100 L110 160 L20 160 L90 100 Z" />
```

Give it a parent with a width and nothing else — see `demo.tsx`.

## Props

| Prop | Default | Notes |
|---|---|---|
| `chapters` | ten shots | `{ scene, title, kicker?, line?, cut? }`. Any length, any order, scenes can repeat. |
| `chapterScroll` | `1.1` | Viewport-heights of scroll per shot. |
| `height` | `"100svh"` | The sticky stage. **Must be a definite length.** |
| `accent` | `#ff1f3a` | Everything fast: trails, wheels, burst, emblem. Hex. |
| `rim` | `#9cc8ff` | The cold back-light on silhouettes and glass. Hex. |
| `metal` | `#dfe5ee` | Brightest tone on polished metal. Hex. |
| `emblem` | star | SVG path data in a 200×200 box for the final shot. |
| `grain` | `0.12` | Film grain. `0` disables it. |
| `letterbox` | `true` | Bars that open as you start scrolling. |
| `hud` | `true` | Slate, timecode, title cards, rail, scroll hint. |
| `parallax` | `true` | Pointer moves camera and light. |
| `reelSeconds` | `58` | What the timecode pretends the reel runs. |
| `className` | `""` | Appended to the root. |

`cut: "flash"` makes a shot arrive as a hard cut on a white-hot frame instead
of a crossfade.

`clamp01`, `smoothstep`, `progressFrom`, `chapterAt`, `mixAt`, `flashAt`,
`titleReveal`, `timecode`, `rgba` and `shade` are exported, so the same scroll
position can drive something of your own alongside it.

## Notes

- **The root's height is the timeline**: `chapters.length * chapterScroll`
  stage-heights. The stage is a `sticky` child at `height`.
- Progress is measured from **the element**, never `window.scrollY`.
- Scroll writes a number; the rAF loop reads it. Nothing draws while the reel
  is off screen.
- React re-renders only when the shot changes. The title reveal, letterbox,
  timecode and rail fill are written straight to the DOM each frame.
- A crossfade paints the incoming shot to an offscreen layer and lands it in
  one `drawImage`, so neither shot's own alpha tricks leak into the other.
- `prefers-reduced-motion` stops the loop: a still frame repainted on scroll,
  no ambient motion, no click flares, the rail jumps without smoothing.
- The canvas is `aria-hidden`; the shots also exist as an `sr-only` list.
- Colours are parsed as hex. Anything else falls back to white rather than
  painting `NaN`.
- Self-dark by design: it paints its own black in both themes.

## Credit

Art direction from a reference storyboard of a sports-channel ident — rim-lit
portrait, archer, arrow and blade through glass, jet, supercar, formula car,
red burst, star. The implementation and all artwork are original and
procedural.
