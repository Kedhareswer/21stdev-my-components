# hanging-glass-gallery

Portraits set in thick, clear acrylic panes hang on fine wires at different depths, swaying gently
as the row drifts past in the dark. Drag to move along the row. Hover a pane and it turns to
face you and comes forward; the camera drifts a little with the pointer for depth; tap it and the glass cracks in a spiderweb from where you touched, then bursts
into thick shards that carry the old picture toward you and fall away, revealing another
portrait in the same pane before the glass forms again. Bottom left: a short serif title and
caption about Kedhareswer; bottom right: which pane is in front.

## Props

| Prop | Default | Notes |
|---|---|---|
| `images` | nine generated portraits | `{ src, alt? }[]`, portrait 3:4 works best. Each break moves a pane three pictures on. |
| `eyebrow` | `"Portraits under glass · Kedhareswer"` | |
| `title` | `"Light, held still."` | Any node. |
| `caption` | one line | |
| `autoPlay` | `true` | Drifts the row and breaks the front pane every 6.5 s (first at 2.4 s) until someone interacts. |
| `height` | `"100svh"` | Stage height. A definite length. |
| `className`, `style` | – | |

## Notes

- Uses `three` (declared in the root `package.json`), plus its bundled `RoomEnvironment`
  for studio reflections. Each pane is a bevelled, clear acrylic border with bright rim lines
  and a faint sheet over the photo; clear clamps grip the top edge. The shards are real geometry: rings
  around the impact cut by jittered spokes, clipped to the pane, extruded, with the photo
  mapped onto their faces so the pieces carry the picture as they fly. They tile the pane
  exactly (tested).
- Images load from `https://kedhar-components.pages.dev/hanging-glass-gallery/`; pass your
  own `images` in production (they must allow CORS for WebGL).
- The stage carries its own near-black background; a dark scrim keeps the caption legible
  over the photos.
- `prefers-reduced-motion`: no drift or sway, no unattended breaks, and a tap swaps the
  picture straight away without the shatter.
