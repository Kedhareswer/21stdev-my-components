# cylinder-tunnel-gallery

You stand at the mouth of a white tube lined with photo tiles, set like brickwork, that slowly
twists around you; the far end is a black disc. Scrolling dives you down the tube: the rings
rush past and the black end swells. Near the end the camera turns up to face the wall, and
the tunnel settles into a curved wall of photos you can browse. Hovered tiles lift off the
wall. Scrolling back flies you out again.

## Props

| Prop | Default | Notes |
|---|---|---|
| `images` | sixteen generated photos | `{ src, alt? }[]`, square works best. Neighbouring tiles never repeat. |
| `mode` | `"scroll"` | `"scroll"`: the dive follows page scroll through a pinned track. `"auto"`: it dives in, holds on the wall and floats out on an 11 s loop. The demo uses `"auto"`; `demo-scroll` shows scroll mode. |
| `track` | `"320svh"` | Scroll length in scroll mode. |
| `height` | `"100svh"` | Height of the pinned view. A definite length. |
| `spin` | `1.4` | Twist speed, turns per minute. |
| `className`, `style` | – | |

## Notes

- Uses `three` (declared in the root `package.json`). 392 tiles in 16 instanced meshes, one per
  photo, plus a white grout cylinder and a black end disc. Rounded tile corners come from one
  shared alpha mask.
- Scroll input is eased so the dive glides rather than steps. The loop pauses off screen and
  everything is disposed on unmount.
- Images load from `https://kedhar-components.pages.dev/cylinder-tunnel-gallery/`; pass your
  own `images` in production (they must allow CORS for WebGL).
- The tube carries its own white-and-photo look in light and dark.
- `prefers-reduced-motion`: no twist and no auto loop; in scroll mode the camera follows the
  scroll position directly.
