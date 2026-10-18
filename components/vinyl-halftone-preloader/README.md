# Vinyl Halftone Preloader

A loading gate for a portfolio, printed like a record sleeve in two inks. A
giant record sits on the left with your name on its label, and a halftone
starburst throbs on the right in time with the tempo. While the page loads:

- the record **spins up** from a standstill to 33⅓ RPM, its label edge strobing,
- the **needle**, a pale groove in the vinyl, walks inward with the progress,
- the **stages** step down the diagonal like a game's pause menu, each one
  lighting up in turn with an extruded, slightly mis-registered glow,
- the label's big word counts the load, then flips to `Ready`.

At 100 the last stage becomes the way in. Ink floods out of the burst, then the
dots shrink away from the centre and reveal your page underneath.

**Interactive.** Grab the record and drag it round to scratch. The plates slip
off register while you do. The scene leans slightly toward the pointer. With
`enter="click"`, the last stage is a real button that takes focus at 100.

**No dependencies.** React is the only import. The halftone is one WebGL
fragment shader held to a pixel budget, and it drops resolution on software
GPUs. Where WebGL is missing, a CSS dot screen stands in. The only thing
fetched is the Google Fonts stylesheet for Anton and Archivo, and the fallback
stacks keep the look without it.

```tsx
import VinylHalftonePreloader from "@/components/ui/vinyl-halftone-preloader"

<VinylHalftonePreloader loop />                                  // showcase

<VinylHalftonePreloader progress={loaded} onComplete={() => setReady(true)}>
  <YourPortfolio />
</VinylHalftonePreloader>

<VinylHalftonePreloader
  enter="click"
  preset="cobalt"
  title="Mira Okafor"
  subtitle="motion & interaction"
  stages={["Rewind", "Cue up", "Drop", "Enter"]}
  bpm={96}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `children` | — | Revealed when the gate lifts. With `loop` it shows between runs. |
| `loop` | `false` | Showcase: replays forever, never fires `onComplete`. |
| `progress` | — | Real progress, 0–100. Leave it out to simulate over `durationMs`. |
| `durationMs` | `4200` | Length of the simulated load. |
| `enter` | `"auto"` | `"auto"` lifts a beat after 100. `"click"` waits for the last stage to be pressed. |
| `preset` | `"rhythm"` | `rhythm` (pink / oxblood) · `cobalt` · `citrus` · `newsprint` |
| `palette` | — | `{ paper, ink, glow, edge, spark }` hex overrides. |
| `title` / `subtitle` | `"Kedhareswer"` / `"selected works"` | The two lines at the top of the label. |
| `loadingWord` / `readyWord` | `"Loading"` / `"Ready"` | The big word on the label. |
| `credits` | `["Design & Code", "Portfolio · Vol. 26"]` | Small uppercase lines at the foot of the label. |
| `ringText` | `"Side A · 33⅓ RPM · …"` | Runs round the spinning label edge. |
| `stages` | `["Mastering", "Pressing", "Spinning", "Play"]` | Down the diagonal. The last is the way in and lights only at 100. |
| `bpm` | `120` | Tempo of the burst's pulse and the lit stage's bump. |
| `hint` | `"Drag the record to scratch"` | Corner pill. `""` hides it. |
| `displayFamily` / `textFamily` | Anton / Archivo → system | Faces for the stages and the label. |
| `fontHref` | Google Fonts (Anton, Archivo) | `null` to load nothing and bring your own faces. |
| `height` | `100svh` | A definite length. |
| `onComplete` | — | Fired once, after the gate has lifted. |

## Notes

- **Layout** adapts to the frame. Landscape puts the record on the left and the
  stages stepping down the right. Portrait hangs the record from the top and
  stacks the stages under it.
- **Stages** work best at four, with short words. The display face is
  condensed, so eight to ten letters still fit.
- **Accessibility.** The gate is a `progressbar` with its value, the lit stage
  is `aria-current="step"`, the ready word is announced politely, and the way
  in is a real `<button>`.
- **Reduced motion.** The record stands still, the burst stops pulsing, and the
  gate fades out instead of flooding.
