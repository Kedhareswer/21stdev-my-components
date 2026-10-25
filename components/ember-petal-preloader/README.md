# Ember Petal Preloader

A loading gate that is a sunlit garden growing itself. Warm light pours down
from the top edge, out-of-focus stems sway far behind, and the page's word
sits in the light with a caption and the count.

1. **Grow.** As the load climbs, stems push up out of the ground one after
   another, far ones first. Leaves unfurl along each stem as it passes
   them, and a bud rides every tip.
2. **Open.** Each bud swells and opens into a poppy, a tulip or a lavender
   cup: the petals are recomputed every frame, so opening is a true morph,
   not a crossfade. Stamens appear once the bowl is wide enough.
3. **Bloom.** At 100% every flower flares past open and settles, the light
   flares, the word pops, and pollen lifts faster into the glow.
4. **Hold.** The garden sways in a light wind and a hint says to click.
5. **Dive.** The camera dives into the flowers until they fill the screen,
   then fades into whatever the gate was guarding. With `loop`, the garden
   sets instead: blooms close back into buds, stems sink into the ground,
   and it grows again.

It's meant to be played with. The pointer is wind: every near flower sits
on its own spring and leans away from it, harder the faster you sweep.
Click anywhere and a gust ripples outward across the garden, plant by
plant, with a burst of pollen from where you clicked. The three layers
drift against each other as the pointer moves. Clicking (or pressing Enter
or Space) while it's loading jumps the load to 100%; clicking during the
hold moves on.

```tsx
import EmberPetalPreloader from "@/components/ui/ember-petal-preloader"

// Looping showcase, nothing else on screen
<EmberPetalPreloader loop />

// Page gate, driven by real progress
<EmberPetalPreloader progress={loaded} onComplete={() => {}}>
  <YourPage />
</EmberPetalPreloader>

// Your own word, preset and garden
<EmberPetalPreloader
  word="Nocturne"
  caption="the garden after dark"
  preset="dusk"
  density={1.25}
  seed={3}
  palette={{ ink: "#fff7fb" }}
/>
```

**No dependencies beyond React, and no assets.** Every stem, leaf and petal
is an SVG path generated from a handful of numbers (length, width, curl,
lean), so the garden lays itself out for any box and renders crisp at any
size. The far layer is one blurred SVG that is painted once and then only
moved as a whole, so the depth of field costs nothing per frame. The grain
is an inline SVG noise texture. Everything moves on one
`requestAnimationFrame` loop plus scoped CSS for the light, the dive and
the readout.

## Props

| Prop | Default | Description |
|---|---|---|
| `children` | — | Content revealed once the gate lifts. Ignored while `loop` is set. |
| `loop` | `false` | Grow → bloom → hold → set, forever. `onComplete` never fires. |
| `progress` | — | Real progress, `0`–`100`. Leave it out to run a simulated load. The bloom waits for `100`. |
| `durationMs` | `4200` | Length of the simulated load. It surges and stalls like a real one. |
| `word` | `"Bloom"` | The word set in the light. |
| `caption` | `"gathering the light"` | Small line under the word. Pass `""` to drop it. |
| `preset` | `"ember"` | `"ember"` (the sunlit original), `"dusk"` (violet sky, pink and blue blooms) or `"meadow"` (green, cream and gold). |
| `palette` | — | Overrides merged over the preset: `{ sky, haze, ground, lilac, rose, petal, petalLight, petalDeep, gold, stem, leaf, leafDeep, ink }`. |
| `density` | `1` | How crowded the garden is. `0.6` is sparse, `1.5` a thicket. Scales with the width of the box. |
| `seed` | `7` | Layout seed. A different number is a different garden with the same settings. |
| `sway` | `1` | How much the garden moves: idle wind, pointer, gusts. `0` keeps it still. |
| `counter` | `true` | Show the percentage next to the caption while loading. |
| `fontFamily` | system serif stack | Face for the word. Nothing is fetched, so pass one the host already loads. |
| `height` | `"100svh"` | Root height. Always a definite length, never `h-full`. |
| `onComplete` | — | Fired once, after the gate has lifted. |
| `className` | `""` | Extra root classes. |

### Palette (ember)

| Key | Default | Used for |
|---|---|---|
| `sky` | `#fff4cc` | The light at the top. |
| `haze` | `#ffb878` | Mid sky, where it turns warm. |
| `ground` | `#ff6a42` | The bottom edge and the root background. |
| `lilac` | `#b89cf2` | Lavender flowers and the cool wash behind them. |
| `rose` | `#ff9cb4` | The pink wash in the mid-ground. |
| `petal` | `#ff8a3e` | Main petal colour. |
| `petalLight` | `#ffd98c` | Petal tips and the glow inside each cup. |
| `petalDeep` | `#ff5236` | Petal bases. |
| `gold` | `#ffc24c` | The small gold flowers and the pollen. |
| `stem` | `#e8a24e` | Stems. |
| `leaf` | `#f0953f` | Leaves on the stems. |
| `leafDeep` | `#8a2a34` | The dark foreground foliage. |
| `ink` | `#7a2416` | Word, caption, count and hint. |

## Notes

- The garden is laid out for the box, never cropped: the viewBox takes the
  box's shape, and the number of plants scales with its width, so a phone
  gets a handful of tall blooms and an ultra-wide gets a border.
- The stage keeps its own sky, so it reads the same in light and dark
  hosts.
- `prefers-reduced-motion` turns growth, wind, pollen, the flare and the
  dive off. Plants fade in fully grown as the load passes them, and the
  phases cross-fade.
- Exposes `role="progressbar"` with its live value. It's focusable and
  works with Enter and Space. The word is announced when loading finishes.
