# Pixel Bloom Preloader

A loading gate built like a poster: a cobalt field, one large italic serif
word, and a garden of 8-bit flowers. *There is no outside. Go back.* The
loader is a flower. A large pixel bloom takes the place of the word's "i" and
grows pixel by pixel as the page loads.

1. **Grow.** The stem climbs from the ground with the count, the leaves
   unfurl once it has passed them, and the head opens outward from a bud.
   Smaller flowers sprout across the field during the load. `THERE … IS … NO`
   types itself in, and the word rises out of the ground one letter at a
   time. A pixel percentage counts at the foot.
2. **Bloom.** At 100% the head is fully open. Pollen bursts off it, the whole
   field shivers outward in a wave, and the sentence finishes: `GO … BACK`.
3. **Hold.** The garden breathes in the breeze and pollen drifts up from the
   bloom. Click, or press Enter, to go in. Otherwise it goes in on its own.
4. **Lift.** The word sinks back into the ground and the flowers fold up,
   nearest the bloom last. Then the screen dissolves pixel by pixel, rippling
   out from the bloom on the flower's own pixel grid, and each pixel flashes
   gold as it goes. Underneath is whatever the gate was guarding. With
   `loop`, it opens onto the sentence instead, closes back in from the edges
   and grows again.

You can play with it while it loads. Flowers lean away from the pointer and
bend in its wake when you sweep across them. Clicking the field while it
loads plants a new flower where you clicked (up to 24). Enter or Space jumps
the load to 100%.

```tsx
import PixelBloomPreloader from "@/components/ui/pixel-bloom-preloader"

// Looping showcase, nothing else on screen
<PixelBloomPreloader loop />

// Portfolio gate, driven by real progress
<PixelBloomPreloader progress={loaded} onComplete={() => {}}>
  <YourPortfolio />
</PixelBloomPreloader>

// Your own sentence and colours
<PixelBloomPreloader
  word="within"
  before={["Look", "for", "it"]}
  after={["Not", "out"]}
  pixel={0.85}
  palette={{ field: "#163a2b", ink: "#f1ead8", bloom: "#c8a2f0", rose: "#ff7a59", leaf: "#7cc46a" }}
/>
```

**Requires only React.** The flowers come from built-in sprites drawn on
canvas, with each rect snapped to device pixels so the art stays crisp at
any DPR. The layout is measured from the box, so it reflows for portrait,
landscape and ultra-wide screens. The type is Instrument Serif (italic) and
Inter, loaded with an injected Google Fonts `<link>`, never a CSS `@import`.
Pass `fontHref={null}` to load nothing and use the fallback stacks. If you
do, pass `serif` and `sans` faces your page already loads.

## Props

| Prop | Default | Description |
|---|---|---|
| `children` | — | Content revealed once the field dissolves. It's `inert` until then. Ignored while `loop` is set. |
| `loop` | `false` | Grow → bloom → hold → dissolve → close back in, forever. `onComplete` never fires. |
| `progress` | — | Real progress, `0`–`100`. Leave it out to run a simulated load that surges and stalls. The bloom waits for `100`. |
| `durationMs` | `5200` | Length of the simulated load. |
| `word` | `"outside"` | The big word. Its first `i` becomes the flower. If there's no `i`, the flower ends the word. |
| `before` | `["There", "is", "no"]` | Words above the big one. The first sits flush left and the last flush right. Any in between join up and sit just before the bloom. |
| `after` | `["Go", "back"]` | Words below it, typed in at the bloom. The first sits flush left, the last flush right, and any between are centred. |
| `flowers` | `12` | How many flowers sprout around the field. Fewer fit on a small screen. |
| `palette` | see below | Partial overrides: `{ field, ink, bloom, rose, leaf }`, as hex colours. Shades are derived from each one. |
| `pixel` | `1` | Pixel size. `0.7` is finer and `1.4` chunkier. |
| `sway` | `1` | How far flowers lean from the pointer and the breeze. `0` keeps them still. |
| `counter` | `true` | Show the pixel percentage while loading. |
| `fontHref` | Google Fonts URL | Stylesheet for the faces. `null` loads nothing. |
| `serif` / `sans` | Instrument Serif / Inter stacks | Faces for the big word and the small words. |
| `height` | `"100svh"` | Root height. Always a definite length, never `h-full`. |
| `onComplete` | — | Fired once, after the field has dissolved. |
| `className` | `""` | Extra root classes. |

### Palette

| Key | Default | Used for |
|---|---|---|
| `field` | `#1c3fcf` | The background, and the pixels of the exit. |
| `ink` | `#ece8de` | The type, the count, and the loop's backdrop. |
| `bloom` | `#f4c531` | The big flower, the yellow flowers, the pollen and the gold flash of the exit. |
| `rose` | `#cf2420` | The red flowers. |
| `leaf` | `#2b9a2c` | Stems and leaves. |

## Notes

- The stage has its own colours, so it reads the same in light and dark
  hosts.
- `prefers-reduced-motion` turns off the sway, the pollen and the letter
  rise. The flowers appear whole, the letters fade in, and the pixel
  dissolve becomes a plain cross-fade.
- The gate exposes `role="progressbar"` with its value. It's focusable and
  works with Enter and Space. The sentence is announced when loading
  finishes.
- `21st render` capture blocks off-site fonts, so supply the cover with
  `--preview` when publishing (`media/pixel-bloom-preloader/cover.png`).
