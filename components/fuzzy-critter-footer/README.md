# Fuzzy Critter Footer

A site footer with a huge wordmark along the bottom and six furry creatures living on it.
While the footer scrolls into view the wordmark arcs like a frown. It eases straight as the
footer settles, and then the creatures drop in one by one, soft-focused as they fall
through a blur haze, landing with a squash and a fur shake. They breathe, blink and watch
your cursor. Brush past one and its fur ruffles and it gets nudged. Click one and it hops.
Grab one and you can drag it around and throw it into the others.

```tsx
import FuzzyCritterFooter from "@/components/ui/fuzzy-critter-footer"

<FuzzyCritterFooter />

// Your own name, links and residents
<FuzzyCritterFooter
  wordmark="Fernhouse"
  name="Fernhouse"
  tagline="Plants that forgive you."
  critters={[
    { shape: "cube", colors: ["#2e7ed6", "#b3e0ff"], eyes: "pills", size: 1.2 },
    { shape: "bean", colors: ["#32b763", "#baf3ca"], eyes: "big" },
  ]}
  onCritterClick={(shape) => console.log(shape)}
/>
```

Put it at the end of a page. It drops its creatures the first time the whole footer is on
screen (or its bottom reaches the bottom of the viewport). "Drop them again" tosses them up
and out through the top, then drops them back in.

**Dependencies:** `three`, plus `RoundedBoxGeometry`, `MeshSurfaceSampler` and
`BufferGeometryUtils` from its `examples/jsm` folder. Nothing is fetched: the fur, shadows
and sounds are all made at runtime. The text uses the host's sans-serif stack.

## Props

| Prop | Default | Description |
|---|---|---|
| `wordmark` | `"Tuftworks"` | The giant word. It's sized to 96.5 % of the footer width. |
| `name` / `tagline` | `"Tuftworks"` / … | Brand block, top left |
| `columns` | Product / Company / Elsewhere | `{ title, links: { label, href }[] }[]` |
| `legal` | Privacy, Terms | Small links in the bottom row |
| `copyright` | `"© 2026 Tuftworks"` | Bottom-left text |
| `critters` | six (cloud, flower, cube, triangle, bean, puff) | `{ shape, colors: [root, tip], eyes, size? }[]`. Shapes: `cloud`, `flower`, `cube`, `triangle`, `bean`, `puff`. Eyes: `pills`, `short`, `dashes`, `big`. Size is clamped to 0.5–1.8. Pass a stable array (a constant or `useMemo`): a new array rebuilds the scene. |
| `gravity` | `2600` | Fall acceleration in px/s² |
| `bounce` | `0.32` | Restitution off the floor, walls and each other (0–0.9) |
| `wind` | `1` | Breeze in the fur. `0` holds it still. |
| `density` | `1` | Fur strands per creature × 10 000 (60 % of that under 640 px) |
| `sound` / `volume` | `true` / `0.4` | Synthesised blips on grab, hop and landing. Audio only starts after you grab a creature. |
| `curve` | `true` | The scroll-linked wordmark arc |
| `idleHops` | `true` | Every 3.5–6.5 s a resting creature hops on its own |
| `dropLabel` | `"Drop them again"` | Re-drop button label. `""` hides it. |
| `onDrop` | — | Fires on every drop |
| `onCritterClick` | `(shape) => void` | Fires when a creature is clicked (not dragged) |
| `className` | — | Extra root class names |

The footer takes its height from its content: the columns, the bottom row and the
wordmark. No percentage heights are involved.

## How it works

1. **Bodies.** Each creature is a 2D disc in stage pixels, with y up from the stage bottom.
   Gravity is 2600 px/s², and the floor sits 10 px + 0.16 units up. A landing faster than
   80 px/s bounces at 0.32 and reports an impact (0–1). Bodies roll and spring back upright
   on the floor. Pairs push apart at 0.92 × the summed radii and trade momentum. Walls use
   each shape's on-screen half-width, fur included, so wide shapes stop at the edge. The
   solver runs 3 substeps a frame, with the frame step capped at 33 ms.
2. **Drop.** Creature *i* starts 260 ms × *i* (+0–120 ms) after the drop. It enters 40–200 px
   above the stage top, in its own lane, falling and tumbling. A three-layer progressive
   backdrop blur over the top of the stage (2 / 6 / 14 px) brings it into focus as it falls.
3. **Fur.** Each body is an extruded, bevelled outline (a rounded box for the cube) with
   its vertices merged for smooth normals. 10 000 roots are sampled over its surface. Each
   strand is an instanced, tapered five-segment card that curls toward the viewer on the
   face. A shader sways it in two sine winds, shakes it on landings and parts it around
   your cursor. Strands near the eyes are trimmed, so the eyes sit in a dip.
4. **Life.** Eyes are flattened white capsules. They follow the cursor within 0.035 units
   and jiggle on a spring after impacts. Each creature blinks for 150 ms every 2–6 s,
   breathes ±1.5 %, stretches while falling and squashes on landing (a spring at
   220 / 11).
5. **Wordmark.** The wordmark is fitted to the width. While the footer is partly on screen,
   each glyph is offset by (0.14 c, 0.2 c²) em and turned 13 c°, where c runs from −1 to 1
   across the word. The bend follows how much of the footer is still below the fold, eased
   at 0.14 a frame.
6. **Reduced motion.** There's no arc, no wind and no physics. The creatures sit in an even
   row, and clicks don't throw them around.

Rendering pauses while the footer is off screen. On unmount, the renderer, every geometry
and material, and the audio context are disposed of, and the WebGL context is released.
