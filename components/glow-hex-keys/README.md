# glow-hex-keys

A full-bleed field of chunky, dark hexagonal keycaps, each with a white line icon, laid back in
perspective like a real board on a desk. The
pointer warms the keys around it: the key underneath burns white, its neighbours glow peach
and ember orange, and hot pink backlight bleeds out through the grooves. Warmth rises at once
and cools slowly, so the pointer leaves a fading trail. Pressing sinks the key under it.

## Props

| Prop | Default | Notes |
|---|---|---|
| `keySize` | `88` | Flat-to-flat width of one key, px. |
| `gap` | `9` | Groove between keys, px. |
| `reach` | `2.8` | How far the warmth spreads, in keys. |
| `cool` | `1.8` | Seconds a lit key takes to cool. |
| `tilt` | `true` | Lay the board back in perspective. `false` gives a flat, head-on field. |
| `autoPlay` | `false` | A ghost pointer drifts a figure-eight until someone moves over the field. The demo turns it on. |
| `height` | `"100svh"` | Height of the field. A definite length. |
| `className`, `style` | – | |

## Notes

- No dependencies beyond React. One `<canvas>`, sized by a `ResizeObserver`. Tilted, it is laid
  out larger than the stage (never scaled up, so the icons stay sharp) and capped at 1.5×
  device pixels; flat, at 2×. The keys bleed past every edge so there is never a half-empty border.
- Keycaps have a bevelled face and a side wall; the pink backlight spreads wider than the warmth,
  so it flushes the walls of the dark keys around the lit patch.
- The field carries its own near-black keyboard look, so it reads the same on light and dark
  pages. Sixteen generic line icons (star, sparkle, infinity, the `( ^ ^ )` face, sun, cloud,
  bolt, heart, moon, waves, eye, spiral, diamond, smile, ghost, fish) repeat without
  neighbouring duplicates.
- The loop sleeps once every key has cooled, and pauses off screen.
- `prefers-reduced-motion`: keys light directly under the pointer with no trail, no press
  travel and no ghost pointer.
