# Knitted Frame

Wraps anything in a border of real knitting. Seven charts, any colourway, an
optional built-in picker, and it knits itself on when it appears.

**No dependencies.** Canvas 2D, React is the only import — no images, no CSS
file, nothing to load.

## Why it looks like wool and not like a pattern fill

**The depth is a height field, not an offset dark copy.** Each run of stitches
is one continuous scalloped path. That path is stroked five times into a
greyscale buffer — wide and low, then narrower and higher — and the finished
frame is then lit per pixel by the surface normals taken from that height:

```
nx = height[x-1] - height[x+1]
ny = height[y-1] - height[y+1]
lit = ground + relief * (nx * 0.6 + ny * 0.62) + sheen * height³
```

Five steps and a gradient is a round strand of wool. One stroke with a dark
copy behind it is a sticker of one, and that is exactly what it looks like.

**The gauge is gentle.** Yarn is 0.48 of a stitch, the bow 0.28, the wander
0.035 — a *thirtieth* of a stitch, not a tenth. Overdo any of them and it stops
reading as hand knitting and starts reading as broken.

**Colour is a chart**, one function of (column, row), so stripes, ribbing,
seed, chevron, fair isle and argyle are the same renderer with a different
chart rather than six code paths.

## Usage

```tsx
import KnittedFrame from "@/components/ui/knitted-frame"

<KnittedFrame tint="#4e8098">
  <YourCard />
</KnittedFrame>

<KnittedFrame controls>…</KnittedFrame>                 // built-in pickers
<KnittedFrame pattern="fairisle" tint="#c8452f">…</KnittedFrame>
<KnittedFrame yarn={["#2e4a6b", "#dfe7ee"]}>…</KnittedFrame>   // explicit
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `children` | — | Anything. The frame sizes itself to it. |
| `stitches` | `5` | Border thickness, in stitches. |
| `stitchSize` | `9` | Height of one stitch in px. Smaller is finer yarn. |
| `pattern` | `"chevron"` | `chevron` \| `fairisle` \| `argyle` \| `seed` \| `ribbing` \| `stripes` \| `plain`. |
| `tint` | `"#4e8098"` | **One** colour; the contrasts are derived from it. |
| `yarn` | — | An explicit colourway, if you want the yarns to clash. Wins over `tint`. |
| `controls` | `false` | Render the built-in pattern and yarn `<select>`s. |
| `seed` | `1` | Which hand knitted it. Changes the wander, nothing else. |
| `radius` | `2` | Corner rounding, in stitches. |
| `background` | — | Paint behind the children. |
| `knitIn` | `true` | Knit on, row by row, when it first appears. |

**7 patterns.** Colourways are unbounded — `tint` takes any colour and `yarn`
takes any list, so the seven charts multiply by whatever palette you hand them.
`COLOURWAYS` exports seven named shades for the picker; `PATTERNS`,
`stitchNoise`, `stitchColorIndex`, `inBorder`, `parseHex` and `tintYarn` are
exported too.

## Tinted, not clashing

`tint` takes a single colour and derives the rest: the contrast is that same
hue pulled most of the way to a warm off-white, the third is the same hue taken
down toward brown. Neither is a new colour — which is the point. A tinted frame
is all one shade, the way the reference app dresses each window in its own
app's colour rather than in a contrasting pair.

Pass `yarn` instead when you actually want unrelated colours.

## Notes

- **A chart never reaches past the end of the colourway.** Hand `argyle` two
  yarns instead of three and it clamps; the index is also taken with a positive
  modulo, because JavaScript's `%` keeps the sign of its left operand and
  `yarn[-1]` is `undefined` — which canvas accepts as a stroke style and
  quietly draws in black.
- A colour `tint` cannot parse comes back as a single-yarn colourway rather
  than as a guess at its channels. One plain sweater beats three wrong ones.
- The padding *is* the border, so it stays transparent. `background` paints
  only behind the children; putting it on the padded box covers the canvas and
  hides every stitch but the corners.
- Runs of one colour become a single path, so a plain row is one stroke rather
  than a hundred.
- The lighting pass is per pixel, but it runs on a resize or a prop change —
  not per frame.
- The canvas is `pointer-events-none` and `aria-hidden`, so it never swallows a
  click meant for the content or turns up in the accessibility tree.
- A resize re-knits at full progress rather than replaying the animation, which
  would make every reflow look like a glitch.
- `prefers-reduced-motion` skips the knit-on and the frame arrives finished.
- The frame has no height of its own — it is the content's height plus the
  border — so it can be dropped around anything without a height chain.

## Credit

Inspired by **[Window Sweaters](https://github.com/saragordic/window-sweaters)**
by [Sara Gordić](https://github.com/saragordic) — a macOS menu-bar app that
dresses your windows in knitted borders, with a hand-picked colourway per app.

The stitch geometry and the gauge are hers, read from `src/knit.c`: the two
quadratic curves per stitch, the bow at 0.55 of the stitch height, the five-pass
ridge, and the tone constants (ground 0.98, shadow 0.74, light 1.18). The idea
of lighting a height field rather than faking depth is the reason it looks
right, and it is hers too.

This is that aimed at an element instead of a window: a React component with no
dependencies and no build step, with the per-app colourways replaced by a
`tint` prop and the pattern charts by one chart function.
