# Holo Card

A holographic foil trading card you tilt with the pointer. Four finishes, a
flip, and layered parallax if you give it art.

**No dependencies.** Raw WebGL2, React is the only import — no three.js, no
animation library, no CSS file, and no images required.

## Why it looks like foil and not like a gradient

**The shine is a function of the viewing direction, not of time.** Hold the
card still and the rainbow holds still; move it and the bands sweep. That one
decision is the whole difference between this and an animated gradient:

```glsl
float phase = uv.x * 0.85 + uv.y * 0.55 + uView.x * 1.5 - uView.y * 0.9
  + grating(uv) * uPattern;
```

**The colour bands along a grating**, because that is what foil physically is —
a ruled diffraction surface. The rainbow follows the radial ruling rather than
washing across the card, which is what makes it read as a printed laminate.

**The parallax divides by a bounded normal.** The view vector goes into card
space and is divided by `max(abs(uView.z), 0.4)` before offsetting UV. Without
the floor, a glancing angle sends the division to infinity and the art slides
clean off the card; with it, the layers stay inside the frame at any tilt.

## Usage

```tsx
import HoloCard from "@/components/ui/holo-card"

<HoloCard name="Aurora Drake" rarity="Legendary" />
<HoloCard finish="gold" name="Sunset Koi" number="No. 014" />
<HoloCard art="/cards/drake.png" background="/cards/sky.jpg" />
<HoloCard finish="original" foil={0} />        // the flat print
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `name`, `subtitle`, `number`, `rarity` | — | The print. Real text over the foil, as on a real card. |
| `art` | — | Subject PNG with transparency, parallaxed forward. |
| `background` | — | Backdrop, parallaxed backward. |
| `finish` | `"pearl"` | `pearl` \| `silver` \| `gold` \| `original`. |
| `width` | `clamp(230px, 64vw, 340px)` | Height follows the 5:7 card ratio. |
| `foil` | `1` | Foil strength. |
| `pattern` | `0.22` | How far the rainbow follows the grating. `0` is a flat sheen. |
| `depth` / `bgDepth` | `0.28` / `-0.2` | Layer separation. Opposite signs put the backdrop behind. |
| `tilt` | `16` | Largest tilt in degrees. |
| `idle` | `true` | Slow drift when nobody is touching it. |
| `flippable` | `true` | Click, tap or Enter flips it. |
| `back` | — | What is printed on the back. |

`clampTilt`, `tiltFromPointer`, `viewFromTilt`, `parallaxOffset` and `spectrum`
are exported, so the same view vector can drive something of your own.

## Notes

- **No art required.** Without `art` the card renders a generated face — a fine
  radial ruling crossed with rings, which is what is actually printed under the
  picture on a real foil card — and the foil is boosted to carry it. Supply art
  and the foil drops back to a restrained level so it sits over the picture
  instead of drowning it.
- The print is real DOM text over the canvas, not baked into a texture, so it
  stays crisp at any size and can be selected and read out. On a real card the
  ink is not laminated either.
- The card is sized by `width` and an aspect ratio — never a percentage height,
  which would collapse wherever the host has no height chain.
- Pointer coordinates come off the card's own rect, so it behaves the same
  wherever it sits on a page.
- `prefers-reduced-motion` stops the idle drift and freezes the glitter. The
  pointer tilt still works, because that motion is the reader's own.
- It is a real control: focusable, flippable from the keyboard, and it reports
  its state with `aria-pressed`.
- A dropped GPU context rebuilds. Without WebGL2 it falls back to a conic
  gradient rather than a black rectangle.
- Every GL object is released on unmount. One program, one VAO and two textures
  per mount is a fast leak in a router otherwise.

## Credit

Inspired by **[RuiC-card-skill](https://github.com/HRuiCcc/RuiC-card-skill)** by
[HRuiCcc](https://github.com/HRuiCcc) — a Codex skill that builds holographic
cards through Blender and Three.js. The holographic recipe is theirs: the
view-driven phase, the bounded-normal parallax, the cosine-palette spectrum, the
tenth-power sweep band and the hashed glitter flakes.

This is a different thing built on that recipe: one React component with no
dependencies and no build pipeline, WebGL2 instead of three.js, a generated
card face so it needs no assets, and the print kept as DOM text.
