# Onyx Glyph Preloader

A cinematic loading gate in sandblasted black metal.

1. **Assemble.** Five thick, glitter-flecked tiles
   rack into focus in an orbit, each with its glyph pressed into the face. As
   the load climbs they light up one by one, clockwise, and a beam of light
   sweeps across each one as it does. With `hud` on, a letterbox names the tile lighting
   up and counts `00 / 05`, `001 %`.
2. **Forge.** At 100% the orbit spirals into the centre and dissolves. A
   single hero tile turns over out of the dark, its mark cut clean through
   the metal, with a soft flash and a light cone overhead.
3. **Reveal.** The wordmark racks from blur into chrome under the tile, and
   its caption opens up beneath it.
4. **Lift.** The bars retract and the tile flies through the camera, off
   whatever it was guarding.

The light follows the pointer: the stage tilts, the sheen slides across every
face, and the glitter flashes as different specks catch it. With no pointer,
the light drifts on its own. Hover a tile to pull it forward. A click, Enter
or Space moves to the next step. While it's loading, that jumps the load
to 100%.

```tsx
import OnyxGlyphPreloader from "@/components/ui/onyx-glyph-preloader"

// Looping showcase, nothing else on screen
<OnyxGlyphPreloader loop />

// Page gate, driven by real progress
<OnyxGlyphPreloader progress={loaded} onComplete={() => {}}>
  <YourPage />
</OnyxGlyphPreloader>

// Your own tiles, mark and metal
<OnyxGlyphPreloader
  glyphs={[
    { d: "M50 18 L82 50 L50 82 L18 50 Z", label: "Facet" },
    { d: "M28 30 H72 M28 50 H72 M28 70 H56", stroke: 10, label: "Notes" },
  ]}
  mark={{ d: "M30 30 L70 70 M70 30 L30 70", stroke: 13 }}
  word="Foundry"
  caption="Four tools, one cast"
  glitter={1.6}
  palette={{ metal: "#3a3633", rim: "#8a7d70", glitter: "#ffe9cf" }}
/>
```

**No dependencies beyond React, and no assets.** The metal, glitter, film
grain and debossed glyphs are painted procedurally onto canvas once on mount
(seeded, so they come out the same every time). The thickness is a stack of
CSS 3D layers. Everything moves with scoped CSS plus one
`requestAnimationFrame` loop for the light and one for the load.

## Props

| Prop | Default | Description |
|---|---|---|
| `children` | — | Content revealed once the gate lifts. Ignored while `loop` is set. |
| `loop` | `false` | Cycle assemble → forge → reveal forever. `onComplete` never fires. |
| `progress` | — | Real progress, `0`–`100`. Leave it out to run a simulated load. The orbit waits for `100`. |
| `durationMs` | `4200` | Length of the simulated load. It surges and stalls like a real one. |
| `glyphs` | five original marks | The orbiting tiles: `{ d, stroke?, label? }` each. Three to eight read best. |
| `mark` | four-pill pinwheel | The hero tile's mark. |
| `markStyle` | `"cut"` | `"cut"` punches the mark through the tile. `"deboss"` presses it in like the others. |
| `word` | `"Onyx"` | Wordmark under the hero, and in the HUD. |
| `caption` | `"Every tool, one mark"` | Line under the wordmark. |
| `palette` | see below | Partial overrides: `{ stage, metal, shade, rim, glitter, ink }`. |
| `glitter` | `1` | Glitter density. `0` is plain sandblasted metal, `2` is disco. |
| `depth` | `0.12` | Tile thickness as a fraction of its width. |
| `spin` | `48` | Seconds per orbit. |
| `hud` | `false` | Letterbox bars with the status read-out and progress track. Off by default for a clean screen. |
| `fontFamily` | system sans stack | Wordmark face. Nothing is fetched. Pass one the host already loads. |
| `height` | `"100svh"` | Root height. Always a definite length, never `h-full`. |
| `onComplete` | — | Fired once, after the gate has lifted. |
| `className` | `""` | Extra root classes. |

### Glyphs

A glyph is SVG path data in a `100 × 100` box, drawn at about two-thirds of
the tile's width. Without `stroke`, the path is filled even-odd, so an inner
subpath punches back out. That's how the default shield keeps its check
raised. With `stroke`, it's drawn as round-capped lines of that width. Any
icon set's path data works, as long as you have the rights to use it.

### Palette

| Key | Default | Used for |
|---|---|---|
| `stage` | `#030303` | Background, and what shows through the hero's cut. |
| `metal` | `#2e2e32` | Face colour where the key light lands. |
| `shade` | `#0a0a0b` | Face colour on the far side. |
| `rim` | `#6a6a72` | The lit edge down each tile's thickness. |
| `glitter` | `#f4f4f7` | Glitter specks. |
| `ink` | `#e9e9ee` | HUD and wordmark. |

## Notes

- The stage is always dark: it's a set piece, and it reads the same in light
  and dark hosts.
- Textures are encoded synchronously. `canvas.toBlob` runs in the browser's
  idle time, and a page this busy never has any, so it never resolves.
- Opacity or a filter on a `preserve-3d` element flattens it, and the tiles
  lose their depth. Every fade and focus pull here sits on the leaf layers,
  and the test enforces that.
- `prefers-reduced-motion` stops the orbit, bobbing, dust, grain, flips and
  sweeps. The phases cross-fade instead.
- Exposes `role="progressbar"` with its value. It's focusable and works with
  Enter and Space, and each tile's `label` is announced as it lights.
