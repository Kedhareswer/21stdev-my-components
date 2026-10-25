# Peacock Train Preloader

A loading screen painted as a peacock in display. A small bird stands in a
circle of clean paper; as your page loads, its train fans open round that
circle, feather by feather, three rings deep — a tight ring of eyed feathers,
a wider ring of long cobalt-and-emerald plumes, and an outer halo of pale
watercolour washes dipped in blue. Each eye opens with a small overshoot once
its feather settles.

At 100 a glint runs round the ring. Then the whole train rushes toward you,
and the clean circle at its centre becomes the window your page arrives
through.

While it waits, the train is alive: it breathes, sways, leans toward the
pointer, and the feathers under the pointer lift and catch the light.

**No dependencies.** React is the only import. Every feather is painted once
onto an offscreen 2D canvas (barbs, wash, granulation, the eye) and composed
every frame onto one canvas; the bird is procedural SVG. Nothing is fetched.

```tsx
import PeacockTrainPreloader from "@/components/ui/peacock-train-preloader"

<PeacockTrainPreloader loop />                                        // showcase

<PeacockTrainPreloader progress={loaded} onComplete={() => setReady(true)}>
  <YourPage />
</PeacockTrainPreloader>

<PeacockTrainPreloader preset="midnight" density="lush" title="Nocturne" subtitle="Vol. II" />
```

Click (or press Enter) while it loads to rush it to 100. In `loop` mode,
click the greeting to replay.

## Props

| Prop | Default | |
|---|---|---|
| `children` | — | Revealed through the ring once the gate opens. Ignored while `loop` is set. |
| `loop` | `false` | Showcase mode: fans open, zooms through, greets, replays forever. |
| `progress` | — | Real progress, 0–100. Leave it out to simulate over `durationMs`. |
| `durationMs` | `5800` | Length of the simulated load. |
| `preset` | `"ivory"` | `ivory` (cream paper, emerald and cobalt) · `midnight` (night paper, lilac washes, teal eyes) · `opal` (pale grey, pastel violet and sea-glass, beaded edges) |
| `palette` | — | Override any of `paper`, `ink`, `shaft`, `barbBase`, `barbMid`, `barbTip`, `eyeHeart`, `eyeBlue`, `eyeGreen`, `eyeGold`, `plume`, `plumeEdge`, `bird`, `glow`. |
| `density` | `"full"` | `sparse` (50 feathers) · `full` (78) · `lush` (102) |
| `spread` | `300` | Degrees the train spans round the circle, 120–340. |
| `seed` | `3` | Reshuffles the feathers' small irregularities. |
| `title` | `"ATELIER"` | The wordmark under the ring. `""` hides it. |
| `subtitle` | `"2026"` | Letter-spaced line under the wordmark. |
| `meta` | `["Winter 2026", "Portfolio · Edition I"]` | Small lines above the wordmark. |
| `message` | `"Welcome."` | Greeting after the gate in `loop` mode. `""` skips it. |
| `hud` | `true` | The corner label with its progress rule, and the counter. |
| `label` | `"Loading"` | Accessible name of the progress bar, also the corner label. |
| `serifFamily` / `monoFamily` | Bodoni Moda / JetBrains Mono → system | Faces for the wordmark and the small type. The default stacks fetch nothing. |
| `height` | `100svh` | Root height while loading. A definite length. Released once the gate has opened so the page flows. |
| `onComplete` | — | Fired once, after the gate has opened. |

## Demos

- `demo.tsx` — the bare looping showcase, ivory.
- `demo-midnight.tsx` — the dark preset, a lusher train, custom copy.
- `demo-opal.tsx` — real usage: the preloader wraps a page and the page arrives through the ring, with a replay button.

## Notes

- **Performance.** Three feather variants per ring are painted once per
  size (and again on resize); a frame is about 80 `drawImage` calls plus the
  glints. It holds 60 fps on a software renderer.
- **Layout.** The train is sized from the shorter side of the root, so it
  fits portrait phones and wide screens; the wordmark sits below it.
- **Accessibility.** The gate is a focusable `progressbar` with its value.
  Enter and Space rush or replay it, and the greeting is announced.
- **Reduced motion.** The feathers appear in place as the load arrives
  (no fan sweep, no sway, no glints), and the gate fades instead of rushing
  forward.
