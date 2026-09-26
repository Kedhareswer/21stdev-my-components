# Chrome Dragon Poster

A full-bleed poster. A liquid-chrome eastern dragon coils in an S down a blue
sky, pinned in front of a huge red four-point star with a hot yellow core.
Small red stars, white glints, faint rainbow lens streaks and film grain
finish it off. It is alive: the body undulates head to tail, the fins flutter,
the whisker sways, the jaw breathes and a sheen runs down the scales every few
seconds.

**No dependencies.** React is the only import. There are no images, fonts or
3D models. The dragon is a rig of about 50 tapered tubes: body, skull, snout,
jaw, horns, mane, beard, fins, arms, talons, teeth, tongue, whisker and tail
tuft. They are rebuilt every frame and shaded per pixel in **WebGL2** as
polished metal. Each fragment rebuilds its tube's normal, reflects a
procedural studio sky with a softbox and a horizon streak, and adds fish
scales, a sky rim light and an ink edge. The sky, the stars, the glints and
the grain are shaders too.

## Interaction

| Input | What happens |
|---|---|
| Move the pointer | The chrome turns under the light and the pointer becomes a moving specular light. The head tracks you, the layers drift in parallax, and glints near the pointer flare. |
| Click / tap | **Roar.** The jaw drops, the eye flares, a pulse rolls down the body to the tail, the stars swell and sparks burst where you clicked. |
| `Enter` / `Space` | Roar, from the keyboard (the stage is focusable). |

## Usage

```tsx
import ChromeDragonPoster from "@/components/ui/chrome-dragon-poster"

<ChromeDragonPoster />

<ChromeDragonPoster
  metal="gold"
  skyTop="#1a0b2e"
  skyBottom="#e0795b"
  star="#10c9b4"
  starCore="#fff1b8"
  accent="#10c9b4"
  title="Golden Hour"
  mark="金龍"
  caption=""
  onRoar={() => console.log("roar")}
/>
```

Give it a parent with a width and nothing else (see `demo.tsx`).

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | The stage. **Must be a definite length.** |
| `metal` | `"obsidian"` | `"obsidian"`, `"silver"` or `"gold"`. |
| `tint` | none | Hex. Overrides the metal's tint. |
| `skyTop` / `skyBottom` | `#0b3874` / `#8fbcd4` | Hex. The chrome reflects them too. |
| `star` / `starCore` | `#ff2d17` / `#f4c21c` | Hex. The stars, and the burst sparks. |
| `accent` | `#e3261a` | Hex. Whisker, tongue and eye. |
| `grain` | `0.1` | `0` disables it. |
| `speed` | `1` | Idle motion speed. `0` freezes it. |
| `zoom` | `1` | `1` fits the whole poster (contain). Go above 1 to crop into it on wide stages. |
| `interactive` | `true` | Pointer light, parallax, glint flares and roar. |
| `followPointer` | `true` | The head turns toward the pointer. |
| `glints` | `true` | The white sparkles on the chrome. |
| `title` | `"Chrome Dragon"` | Top left. `""` hides it. |
| `mark` | `"龍"` | Vertical, top right. `""` hides it. |
| `caption` | hint text | Bottom left. `""` hides it. |
| `onRoar` | none | Called on every roar. |
| `className` | `""` | Appended to the root. |

`catmull`, `resample`, `arcLengths`, `outerSides`, `fitPoster`,
`roarEnvelope`, `hexToRgb` and `nearestIndex` are exported. You can drive
your own tube rigs with them.

## Notes

- **One rig, three passes.** The first pass is a full-screen sky. The stars
  there are two tapering blades joined with a smooth max, so the inner corners
  curve like ink. The second pass is the dragon, with a depth test.
  `gl_FragDepth` bulges each tube toward the camera, so crossing parts overlap
  like real cylinders. The third pass adds the glints, the burst sparks and
  the grain on top.
- Fins grow on the **outside** of every bend (curvature sign), like the
  reference art, and sweep toward the tail.
- The arms, the talons and the tail tuft each ride the body point nearest their
  root, so they move with the undulation.
- The pixel ratio is capped at 2. The loop stops while the stage is off screen,
  and every GL object is deleted on unmount.
- `prefers-reduced-motion` gives one still frame and no loop and no roar. It
  is redrawn only on resize or pointer move, so the light still follows you.
- No WebGL2, or a lost context, leaves the CSS sky gradient with the mark on
  it, so it never shows a blank box.
- The canvas is `aria-hidden`. The stage is a focusable `role="img"` with a
  label, and there is an `sr-only` description.
- It paints its own sky, so it looks the same in light and dark themes.

## Credit

Art direction is from a chrome-dragon poster: a black-chrome serpent in an S
over a blue gradient, with red four-point stars and white glints. The rig, the
shaders and all the artwork are original and procedural.
