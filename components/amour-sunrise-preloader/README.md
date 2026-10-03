# Amour Sunrise Preloader

A loading gate styled like a mid-century poster. Fat, wobbly marker letters
arch over a cobalt sun rising from the bottom edge. The outer letters run
long, as they do on a hand-lettered print.

1. **Write.** As the load climbs, the word is inked stroke by stroke, in the
   order a hand would write it. The sun rises with it, and the count
   (`0%` → `100%`) is set inside it in the same marker hand.
2. **Bloom.** At 100% the letters boing in a wave from left to right. Rings
   ripple off the sun, and the count tumbles away while a heart draws
   itself in its place.
3. **Hold.** The heart beats, the caption sits beneath it, and a hint says
   to click.
4. **Lift.** The letters are thrown off the edges and the sun swells until it
   fills the screen. Then it fades into whatever it was guarding. With
   `loop`, the sun sets instead: the letters un-write in reverse and it all
   starts again.

It's meant to be played with. Every letter sits on its own spring and leans
away from the pointer like grass. Sweep the pointer fast and the whole word
bends in the wind. Hover a letter and it wobbles. Click it and it boings. The
sun's shading turns away from the pointer like a lit sphere, and the lines
"boil" the way hand-inked animation does. Clicking the paper or the sun (or
pressing Enter or Space) moves to the next step, and while it's loading, that
jumps the load to 100%.

```tsx
import AmourSunrisePreloader from "@/components/ui/amour-sunrise-preloader"

// Looping showcase, nothing else on screen
<AmourSunrisePreloader loop />

// Page gate, driven by real progress
<AmourSunrisePreloader progress={loaded} onComplete={() => {}}>
  <YourPage />
</AmourSunrisePreloader>

// Your own word, voice and colours
<AmourSunrisePreloader
  word="Ciao!"
  caption="fresh out of the oven"
  weight={0.85}
  fan={1.3}
  palette={{ paper: "#fbefc9", ink: "#d2361f", sun: "#ff7a3d", core: "#c42a12", glow: "#fff4d6" }}
/>
```

**No dependencies beyond React, and no assets.** The letters come from a
built-in single-stroke alphabet drawn as round-capped SVG strokes, so any word
works and it renders at any size. The paper grain is an SVG noise filter.
Everything moves with scoped CSS plus `requestAnimationFrame` loops for the
pen, the springs and the boil.

## Props

| Prop | Default | Description |
|---|---|---|
| `children` | — | Content revealed once the gate lifts. Ignored while `loop` is set. |
| `loop` | `false` | Write → bloom → hold → set, forever. `onComplete` never fires. |
| `progress` | — | Real progress, `0`–`100`. Leave it out to run a simulated load. The bloom waits for `100`. |
| `durationMs` | `4200` | Length of the simulated load. It surges and stalls like a real one. |
| `word` | `"AMOUR"` | The arched word. Supports `A–Z`, `0–9` and `! ? . , ' - % ♥`. Lower case is lifted, accents are dropped (`Été` → `ETE`), anything else becomes a space. Three to eight letters read best. |
| `caption` | `"loading, with love"` | Italic line inside the sun. Pass `""` to drop it. |
| `palette` | see below | Partial overrides: `{ paper, ink, sun, core, glow }`. |
| `weight` | `1` | Stroke weight. `0.6` is a fine pen, `1.4` a fat marker. |
| `fan` | `1` | How far the letters lean out with the arch. `0` stands them upright. |
| `boil` | `1` | Line boil. `0` turns it off, `2` is jittery. |
| `sway` | `1` | How hard letters lean from the pointer, and drift when idle. `0` keeps them still. |
| `counter` | `true` | Show the percentage inside the sun while loading. |
| `fontFamily` | system serif stack | Caption face. Nothing is fetched, so pass one the host already loads. |
| `height` | `"100svh"` | Root height. Always a definite length, never `h-full`. |
| `onComplete` | — | Fired once, after the gate has lifted. |
| `className` | `""` | Extra root classes. |

### Palette

| Key | Default | Used for |
|---|---|---|
| `paper` | `#f4e7df` | The background. |
| `ink` | `#0b215d` | The letters and the bloom ripples. |
| `sun` | `#2f5090` | The sun at its rim. |
| `core` | `#0f2662` | The sun at its heart, where it's darkest. |
| `glow` | `#f4e7df` | Count, heart and caption inside the sun. |

## Notes

- The layout is calculated from the box, not scaled from a fixed picture.
  Landscape gives the poster: a half-sun on the floor and the outer letters
  stretched down to it. Portrait gives a planet wider than the screen, with
  the word standing taller and more condensed over it.
- The stage keeps its own paper, so it reads the same in light and dark
  hosts.
- `prefers-reduced-motion` stops the climb, springs, boil, ripples, beat and
  the screen-swallowing exit. Letters fade in as they load, and the phases
  cross-fade.
- Exposes `role="progressbar"` with its value. It's focusable and works with
  Enter and Space. The word and caption are announced when loading finishes.
