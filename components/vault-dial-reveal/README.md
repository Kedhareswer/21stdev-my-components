# Vault Dial Reveal

A matte strongbox on a plinth with a spoked handwheel you actually turn. Dial
in the combination and the wheel spins free, the door swings out on its hinge
and whatever is inside lights the room.

**No dependencies.** React is the only import — no three.js, no animation
library, no images, no fonts, no audio files.

## How it is built

**It is a real 3D scene, not a picture.** One shared perspective holds every
piece, so the door, the walls and the coin agree on where the camera is:

- the **door** is a slab with thickness, rotating about its hinge — its edge
  catches the light from inside as it opens;
- the **interior** has a back wall, sides, ceiling and floor, so you look *into*
  the box rather than at a dark rectangle;
- the **coin** is a disc of two faces and 48 edge segments, each shaded by where
  it sits against the light, with a milled rim and a sheen that follows its yaw.

Every surface is a gradient or inline SVG. The clicks, the clunk and the chime
are synthesised with Web Audio, and only ever on a user gesture.

**The dial reads like a real one.** Numbers are printed clockwise, so turning
right counts down. A number is set when you let go after turning — a tap is not
a turn, so a stray click never burns a digit.

## Usage

```tsx
import VaultDialReveal from "@/components/ui/vault-dial-reveal"

<VaultDialReveal code={[12, 30, 7]} />

<VaultDialReveal tone="midnight" metal="silver" symbol="Ξ" code={[45, 5, 20, 35]} ticks={60} />

// anything can go in the safe
<VaultDialReveal code={[4, 20]} tone="bone" metal="rose">
  <MyLetter />
</VaultDialReveal>
```

## Controls

| | |
|---|---|
| Drag the wheel | Turn it. Let go to set the number under the index. |
| `←` `→` / `↑` `↓` | One number. `PageUp` / `PageDown` five. `Home` to zero. |
| `Enter` / `Space` | Set the current number. |
| `Backspace` | Undo the last number. `Escape` clears them. |
| Open: move across the scene | Tilts the coin. Tap it (or `Enter`) to flip it. |
| Open: `Escape`, the door, or **Lock it** | Closes the door and spins the wheel off its number. |

## Props

| Prop | Default | Notes |
|---|---|---|
| `code` | `[12, 30, 7]` | Numbers on the dial, up to six. Out-of-range values wrap. |
| `ticks` | `40` | Numbers round the dial (8–120). |
| `hint` | `true` | Shows the combination faintly, so a visitor can open it. |
| `defaultOpen` | `false` | Start with the door open. |
| `swing` | `72` | How far the door opens, in degrees. |
| `tone` | `"graphite"` | `graphite` \| `midnight` \| `bone` — the safe and the room. |
| `metal` | `"gold"` | `gold` \| `silver` \| `rose` — the coin, the glow and the accent. |
| `symbol` | `"₿"` | The mark struck on the coin. Any short string. |
| `children` | — | Replaces the coin. Rendered inside the safe and lit by it. |
| `engraving` | `"DEPOSIT Nº 0417 · EST. 2026"` | Small line under the wheel. |
| `caption` | playful fine print | Text under the scene. `null` hides it. |
| `sound` | `true` | Clicks, clunk and chime. |
| `height` | `"100svh"` | A definite length. Never a percentage. |
| `onAttempt` | — | `(entered, ok)` on every complete attempt. |
| `onUnlock` / `onLock` | — | Fired when the door has opened / been locked. |

`valueAt`, `angleFor`, `unwrapDelta` and `pointerAngle` are exported, so the
same dial math can drive something of your own.

## Notes

- The scene is drawn in one design space and scaled to fit, so it holds its
  proportions at any size and on a phone.
- It takes an explicit `height` (default `100svh`) instead of `h-full`, which
  would collapse to 0px wherever the host has no height chain.
- Nothing inside the safe is drawn while the door is shut. Chrome's 3D plane
  sorting can otherwise paint the coin through a closed door.
- `prefers-reduced-motion` drops the coin's idle sway, the door's overshoot and
  the shake on a wrong code. The coin still follows the pointer — that motion is
  the reader's own.
- The dial is a real `role="slider"` with live status for screen readers, and
  `touch-action: none` so turning it on a phone does not scroll the page.
- Every timer, animation frame and the audio context are released on unmount.
- The default `₿` is just a Unicode character. Swap `symbol` for your own mark.
