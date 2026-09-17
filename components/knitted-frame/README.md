# Knitted Frame

Wraps anything in a border of real knitting. Six charts, any colourway, and it
knits itself on when it appears.

**No dependencies.** Canvas 2D, React is the only import — no images, no CSS
file, nothing to load.

## Why it looks knitted and not like a pattern fill

**Every stitch is drawn, not tiled.** Each one is a stockinette V struck three
times — a shadow low, the yarn over it, and a thin highlight along the top of
the loop, which is what makes wool look round instead of like a painted line.

**Each stitch wanders**, by about a tenth of a stitch, from a hash of its own
position. That is the difference between hand knitting and wallpaper. It is
hashed rather than random because the fabric is redrawn on every resize, and
`Math.random()` would re-knit it into a different sweater each time.

**The colour is a chart**, exactly as a knitting pattern is — one function of
(column, row). Stripes, ribbing, seed, chevron, fair isle and argyle are the
same renderer with a different chart, not six code paths.

## Usage

```tsx
import KnittedFrame from "@/components/ui/knitted-frame"

<KnittedFrame>
  <YourCard />
</KnittedFrame>

<KnittedFrame pattern="fairisle" yarn={["#c8452f", "#f2e4cf", "#2e4a6b"]}>
  <article>…</article>
</KnittedFrame>

<KnittedFrame pattern="ribbing" stitches={6} stitchSize={10} radius={0}>
  <img src="/photo.jpg" alt="" />
</KnittedFrame>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `children` | — | Anything. The frame sizes itself to it. |
| `stitches` | `4` | Border thickness, in stitches. |
| `stitchSize` | `15` | One stitch in px. Smaller is finer yarn. |
| `pattern` | `"chevron"` | `stripes` \| `ribbing` \| `seed` \| `chevron` \| `fairisle` \| `argyle` \| `plain`. |
| `yarn` | red / cream / navy | First is the ground. Fair isle and argyle use a third. |
| `seed` | `1` | Which hand knitted it. Changes the wander, nothing else. |
| `radius` | `2` | Corner rounding, in stitches. |
| `background` | — | Paint behind the children. Leave unset for transparent. |
| `knitIn` | `true` | Knit on, row by row, when it first appears. |

`stitchNoise`, `stitchColorIndex` and `inBorder` are exported, so the same
chart can drive a swatch or a legend of your own.

## Notes

- **A chart never reaches past the end of the colourway.** Hand `argyle` two
  yarns instead of three and it clamps; the index is also taken with a positive
  modulo, because JavaScript's `%` keeps the sign of its left operand and
  `yarn[-1]` is `undefined` — which canvas accepts as a stroke style and
  quietly draws in black.
- The padding *is* the border, so it stays transparent. `background` paints
  only behind the children; putting it on the padded box covers the canvas and
  hides every stitch but the corners.
- The grid rarely divides the box exactly, so it is centred on the remainder —
  otherwise every frame is half a stitch short on two sides and reads as a
  misprint.
- The canvas is `pointer-events-none` and `aria-hidden`, so it never swallows a
  click meant for the content or turns up in the accessibility tree.
- A resize re-knits at full progress rather than replaying the animation, which
  would make every reflow look like a glitch.
- `prefers-reduced-motion` skips the knit-on and the frame simply arrives
  finished.
- The frame has no height of its own — it is the content's height plus the
  border, so it can be dropped around anything without a height chain.

## Credit

Inspired by **[Window Sweaters](https://github.com/saragordic/window-sweaters)**
by [Sara Gordić](https://github.com/saragordic) — a macOS menu-bar app that
dresses your windows in knitted borders, with a hand-picked colourway per app.

This is the idea brought to the web: a React component that knits a border
around any element instead of around a window, with the per-app colourways
replaced by a `yarn` prop and the pattern charts by one chart function.
