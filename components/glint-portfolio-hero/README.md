# Glint Portfolio Hero

An anime poster cover for a portfolio. A cream-framed sky poster, one huge
headline with a hard ink shadow, and a letterboxed close-up underneath: a face
behind a pair of glasses, eyes turned away. On a loop they turn toward the
screen, the head comes round with a slow push-in, and a star glint flashes off
the lenses, bursting past the frame while the headline hops letter by letter.
Then the gaze drifts off again.

**No dependencies.** React is the only import. The face, the glasses, the cat
sticker and the glint are all SVG built from numbers: no images, no fonts to
load.

## How it plays

| Loop | What happens |
|---|---|
| 0 to 24% | looking away, heavy-lidded; a lazy blink |
| 24 to 38% | the eyes and head come round to the screen, with a blink mid-turn |
| 40 to 50% | the glint bursts off the lens corner (overshoots, then settles), a glare sweeps the lens, the panel flashes, the headline hops left to right, the cat jumps |
| 50 to 80% | the glint hangs, turns and fades |
| 84 to 97% | the gaze drifts away again |

## Interaction

- **Hover**: they notice you. The eyes come round (with a glint) and follow the pointer while you stay; headline letters near the pointer lift.
- **Click / Enter / Space**: fire the glint now.
- **Cat sticker**: drag it anywhere; tap it and it bounces.

## Usage

```tsx
import GlintPortfolioHero from "@/components/ui/glint-portfolio-hero"

<GlintPortfolioHero />
<GlintPortfolioHero title="SHOWREEL" name="Kai Mori" edition="Vol. 03" irisColor="#20b39a" skyFrom="#6a4cf0" skyTo="#ffe3d3" />
<GlintPortfolioHero paused />   // hold the glinting pose
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `title` | `"PORTFOLIO"` | Laid out to fill the width; I stays narrow, M/W wide. |
| `name` | `"Kedhareswer"` | Top-left reads "`name`’s Portfolio". |
| `caption` | none | Replaces the whole top-left line. |
| `edition` | `"2026 ver."` | Top-right. Empty hides it. |
| `skyFrom` / `skyTo` | `"#3a7ff6"` / `"#eceee2"` | Sky gradient. |
| `paper` | `"#f7f2e1"` | Border, headline fill, glint. |
| `ink` | `"#1a0a10"` | Outlines, shadow, lashes. |
| `irisColor` | `"#ef3d2b"` | |
| `skinColor` | `"#f8c6d8"` | |
| `hairColor` | `"#2b0a16"` | |
| `accentColor` | `"#ee3b2a"` | Hair clip and the cat's bow tie. |
| `cycle` | `7` | Seconds per loop. |
| `sticker` | `true` | The draggable cat. |
| `paused` | `false` | Hold the turned, glinting pose. |
| `fontFamily` | Bebas Neue / Anton / Oswald / Impact… | Any heavy face; nothing is loaded. |
| `height` | `"100svh"` | **Must be a definite length.** |
| `className` | `""` | Appended to the root. |

## Notes

- Tall containers (phones) get their own framing: the letterbox grows and the
  camera pushes in on the near eye, so the close-up fills the screen instead
  of shrinking to a strip.
- Reduced motion: no loop, no blinks; it holds the turned-and-glinting pose.
- The animation pauses while the component is off screen.
