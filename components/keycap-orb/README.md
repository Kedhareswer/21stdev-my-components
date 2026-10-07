# Keycap Orb

A ball of mechanical keycaps floating over a cobalt floor glow. Ink, ash,
cobalt and lime caps in plastic, clear glass caps with the stem showing
through, engraved legends, and the whole thing mirrored in the floor.

Drag it and it spins and keeps the momentum. Hover a cap and it lifts. Press
one and it sinks, then a ripple runs round the ball. Focus it and type: `j`
presses JS, `/` presses the slash, `@` the at-sign, and any other character
presses a cap facing you.

**No dependencies.** Raw WebGL2, React is the only import. No three.js, no
images, no fonts, no CSS file. The legends are drawn at runtime into a texture
atlas, so there's nothing to host and nothing for a capture sandbox to block.

## Usage

```tsx
import KeycapOrb from "@/components/ui/keycap-orb"

<KeycapOrb />                                         // the default set
<KeycapOrb height="640px" rings={11} speed={-0.6} />
<KeycapOrb glow="#ff5a1f" background="#070302"
  palette={{ ash: { cap: "#e7dccb", legend: "#5a2a14" } }} />
<KeycapOrb
  keys={[
    { label: "Aa", finish: "lime", hotkey: "a" },
    { icon: "pen", finish: "ash" },
    { icon: "cursor", finish: "glass" },
  ]}
  onKeyPress={(key, i) => console.log(key.label ?? key.icon, i)}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `keys` | the web-dev set | Most important first. The first cap sits dead centre facing you; the rest spiral out from it (left, up, right, down, then the diagonals). The far side reuses the list. |
| `palette` | — | Per-finish `{ cap, legend }` hex overrides for `ink`, `ash`, `glass`, `cobalt`, `lime`. |
| `background` | `#020206` | Scene colour. |
| `glow` | `#1f30ff` | The floor glow, the bounce light under the caps and the hover rim. |
| `rings` | `9` | Latitude rows pole to pole, 5–15. More rows, more and smaller caps. |
| `scale` | `0.62` | How much of the shorter side the ball spans. |
| `autoRotate` / `speed` | `true` / `1` | Idle spin. A negative speed spins the other way. |
| `reflection` | `true` | The mirrored ball in the floor. |
| `ripple` | `true` | The wave that follows a press. |
| `height` | `"100svh"` | **Must be a definite length.** The canvas fills this box. |
| `onKeyPress` | — | `(key, index) => void` on every press: click, tap or keyboard. |

A `Keycap` is `{ icon?, label?, finish?, hotkey? }`. `icon` wins over `label`.
Built-in icons: `code` `braces` `chevrons` `frame` `quote` `slash` `at` `pen`
`check` `search` `bolt` `gear` `shield` `folder` `cube` `cursor` `hash`
`terminal` `layers` `star` `heart` `arrow` `plus`, and `none` for a blank cap.

## How it's built

- **Caps are real geometry.** Each one is a stack of rounded-square rings: a
  tapered wall, a rolled bevel, then a shallow spherical dish. They're stitched
  into one shell with smooth normals and drawn instanced, one draw per finish.
- **Rows, not scatter.** Caps sit on latitude rings, each holding as many as its
  circumference fits at the equator's spacing. The middle of the ball stays a
  near-square grid, so it reads as rows of keys and not a Fibonacci dusting.
  Each cap gets a little seeded tilt and roll, and a few stand proud, so it
  looks like a pile of real caps.
- **Engraved legends.** The atlas mask colours the legend, and its gradient
  tips the surface normal, so legend edges catch the light like a cut.
- **Glass is drawn last, back to front.** Inside faces first, then outside, with
  fresnel-driven opacity. That makes the bevels read as thickness, and the
  cross stem and switch housing show through.
- **Picking is exact.** The pointer ray goes into each cap's own space and is
  slab-tested against its box. The dark core sphere occludes the far side, so
  you can't press a cap through the ball.

## Notes

- `prefers-reduced-motion` stops the idle spin, the float and the ripple.
  Dragging and pressing still work, because that motion is the reader's own.
- Rendering pauses while the orb is scrolled out of view.
- Touch keeps the page scrollable vertically (`touch-action: pan-y`). A
  horizontal swipe spins the ball.
- It's a focusable `role="application"`. Arrow keys spin it, Enter/Space press
  the cap facing you, and every press is announced through a polite live region.
- A dropped GPU context rebuilds. Without WebGL2 it falls back to a static glow
  instead of a black box.
- Every GL object and listener is released on unmount.
