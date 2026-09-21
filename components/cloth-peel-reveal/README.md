# Cloth Peel Reveal

A sheet of cloth covering your page, dragged away to reveal what's underneath.
It slides as one piece and crumples as it goes: parallel folds travel along the
drag direction, each crease lit from its own slope, and the sheet's trailing
edge is torn rather than straight.

```tsx
import ClothPeelReveal from "@/components/ui/cloth-peel-reveal"

// Page gate: the sheet is pulled off once
<ClothPeelReveal sheetText="Make Something" onReveal={() => {}}>
  <YourPage />
</ClothPeelReveal>

// Ambient showcase: peel, hold, settle back, repeat
<ClothPeelReveal loop sheetText={"Make\nSomething"} />
```

**No dependencies, and no network requests.** The sheet is a 120x80 quad mesh
deformed in a vertex shader; the word on it is drawn to an offscreen 2D canvas
at runtime, so there is no image or font file to ship.

## Props

| Prop | Default | Description |
|---|---|---|
| `children` | — | Content underneath, revealed as the sheet is pulled away |
| `sheetColor` | `"#ffffff"` | The sheet's colour |
| `sheetText` | — | Word drawn onto the sheet, so the type folds with the cloth. `\n` splits lines. |
| `textColor` | `"#111111"` | Colour of `sheetText` |
| `durationMs` | `1500` | How long the peel takes |
| `delayMs` | `700` | Hold before the peel begins |
| `loop` | `false` | Peel off, hold, settle back, repeat. For showcases. |
| `holdMs` | `900` | Hold at each end of a loop cycle |
| `angleDeg` | `196` | Direction the sheet is dragged. `180` is left, `270` is down. |
| `foldAmplitude` | `0.13` | Depth of the folds. `0` is flat, `0.4` is heavy crumple. |
| `foldFrequency` | `4.2` | How many folds run across the sheet |
| `edgeRoughness` | `0.09` | How ragged the trailing edge is |
| `tilt` | `0.85` | How far the sheet swings out of the screen plane. `0` stays flat, `1.2` is a hard turn. |
| `height` | `"100svh"` | Root height — a definite length, never a percentage |
| `onReveal` | — | Fired once, when the sheet is fully gone |
| `className` | `""` | Extra root class names |

## How it works

1. **A real mesh, not a screen-space trick.** The sheet is a 120x80 grid of
   quads. Folds are per-vertex displacement, which is why the type on the sheet
   warps along the creases instead of sliding over a flat gradient.

2. **It slides, it does not inflate.** An early version displaced vertices
   across a wide release band, so the sheet stretched and the artwork ballooned.
   Real cloth translates as one piece and crumples, so the whole sheet moves
   together and the folds ride on top of that motion.

3. **It swings out of the screen plane.** The sheet is projected with a real
   perspective divide and yaws as it goes, so the far edge foreshortens and the
   top edge sweeps in a long curve. Kept flat and screen-aligned it reads as a
   sliding rectangle no matter how good the folds are; the swing is most of
   what sells it as cloth.

4. **Fold spacing is irregular.** Evenly spaced sines read as corrugated metal,
   so the fold phase is warped by noise before it is summed. Varied spacing is
   the difference between cloth and a washboard.

5. **Creases are lit from their own slope.** The fold is a sum of sines, so its
   derivative is available analytically; that slope becomes the surface normal
   and the normal is what catches the light. No normal map, no texture.

6. **The trailing edge is torn.** The sheet is 1.3x oversized, so its ragged
   edge starts just off screen and sweeps in as the cloth is dragged away. The
   cut is evaluated per fragment against fBm, so the raggedness stays crisp no
   matter how coarse the mesh is.

7. **Grip.** The leading half holds on longer than the trailing half, so the
   crumple builds where the cloth has already let go.

## Install safety

- Explicit `height`, never `h-full`, which collapses to `0px` in a page with no
  `html, body { height: 100% }` chain.
- Every rule in the scoped `<style>` block is `.cpr-` prefixed.
- The `canvas` resets `max-width` and `height`, which Tailwind Preflight would
  otherwise set to `100%` / `auto` and collapse inside the absolute parent.
- **Without WebGL2 the sheet still covers the content.** A plain CSS sheet
  renders until the mesh is confirmed live, so an unsupported browser sees the
  sheet slide away rather than a flash of the page it was meant to hide.
- `prefers-reduced-motion: reduce` skips the cloth and uncovers the content.
- Nothing is fetched. The component and its demo contain zero URLs, which the
  test enforces.

## Notes

The sheet is a flat colour plus an optional word, because a shader cannot
texture arbitrary DOM — `children` are what gets revealed, not what wrinkles.
For a full artwork on the cloth, extend it to take an image and upload that as
the texture instead of the generated word.
