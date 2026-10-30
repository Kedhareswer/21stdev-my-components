# Peacock Train Preloader

A loading screen painted in watercolour. A small cobalt peacock stands at the
foot of a circle of clean paper with its train folded down behind it. As your
page loads the train rises and spreads, row by row:

1. **Rising.** The folded train lifts from behind the bird like two wings.
2. **Spreading.** Eight rows open from the inside out: a dark, serrated collar
   round the circle, four rows of scalloped feathers that warm from teal to
   chartreuse with cobalt rims and dark crown points, and two rows of pale halo
   plumes dipped in blue that feather out into the paper.
3. **The rattle.** At 100 the bird shivers its train, the way peacocks do at
   the peak of a display, and every fleck of glitter in the paint catches the
   light. A glint then sweeps round the ring.
4. **The gate.** The train rushes toward you and the clean circle becomes the
   window your page arrives through.

While it waits the train breathes and sways, its rows drift in parallax with
the pointer, and the glitter under the pointer sparkles. The poster type (small
lines, a bold serif wordmark, a spaced year, a signature) sets itself letter by
letter.

**No dependencies.** React is the only import. Every feather and the bird are
painted once onto offscreen canvases (layered, deformed watercolour washes,
dry-brush streaks, granulation, glitter, wet edges), then composed on one 2D
canvas. Nothing is fetched.

```tsx
import PeacockTrainPreloader from "@/components/ui/peacock-train-preloader"

<PeacockTrainPreloader loop />                                        // showcase

<PeacockTrainPreloader progress={loaded} onComplete={() => setReady(true)}>
  <YourPage />
</PeacockTrainPreloader>

<PeacockTrainPreloader preset="midnight" density="lush" title="Nocturne" subtitle="Vol. II" signature="©NOCTURNE" />
```

Click (or press Enter) while it loads to rush it to 100. In `loop` mode, click
the greeting to replay.

## Props

| Prop | Default | |
|---|---|---|
| `children` | — | Revealed through the circle once the gate opens. Ignored while `loop` is set. |
| `loop` | `false` | Showcase mode: opens, rattles, zooms through, greets, replays forever. |
| `progress` | — | Real progress, 0–100. Leave it out to simulate over `durationMs`. |
| `durationMs` | `6000` | Length of the simulated load. |
| `preset` | `"ivory"` | `ivory` (cream paper, chartreuse to cobalt) · `midnight` (night paper, luminous washes) · `opal` (pale grey, lilac and sea-glass, coral plumes, eye-spots and beads) |
| `palette` | — | Override any of `paper`, `ink`, `core`, `body`, `rim`, `edge`, `tip`, `halo`, `haloRim`, `glitter`, `bird`, `accent`, `glow`. |
| `ornament` | on for `opal` | Painted eye-spots on the scalloped feathers and beads along the halo. |
| `density` | `"full"` | `sparse` · `full` · `lush`: wider, fewer feathers or narrower, more of them. |
| `spread` | `300` | Degrees the train spans round the circle, 120–340. |
| `seed` | `3` | Reshuffles the painting's small irregularities. |
| `title` | `"Mayura"` | The wordmark. `""` hides it. |
| `subtitle` | `"2026"` | Letter-spaced line under the wordmark. |
| `meta` | three small lines | Small lines above the wordmark. |
| `signature` | `"©MAYURA"` | The line at the foot. `""` hides it. |
| `message` | `"Welcome."` | Greeting after the gate in `loop` mode. `""` skips it. |
| `hud` | `true` | The corner label with its progress rule, and the counter. |
| `label` | `"Loading"` | Accessible name of the progress bar, also the corner label. |
| `serifFamily` / `monoFamily` | Bodoni Moda / JetBrains Mono → system | Faces for the wordmark and the small type. The default stacks fetch nothing. |
| `height` | `100svh` | Root height while loading. A definite length. Released once the gate has opened so the page flows. |
| `onComplete` | — | Fired once, after the gate has opened. |

## Demos

- `demo.tsx` — the bare looping showcase, ivory.
- `demo-midnight.tsx` — the dark preset, a lusher train, custom copy.
- `demo-opal.tsx` — real usage: the preloader wraps a page and the page arrives through the circle, with a replay button.

## Notes

- **Performance.** Three variants per row are painted once per size (and again,
  debounced, after a resize). While a row is opening its feathers are drawn
  one by one; once it has settled the row is flattened into a single image and
  moved as a unit, so a settled frame is about a dozen draws plus the glitter.
- **Layout.** The train is sized from the space above the type and the screen
  width, so it fits portrait phones and wide screens. The paint thins out under
  the type so it stays legible.
- **Accessibility.** The gate is a focusable `progressbar` with its value.
  Enter and Space rush or replay it, and the greeting is announced.
- **Reduced motion.** The rows appear in place as the load arrives (no rising,
  sway, rattle or glitter), and the gate fades instead of rushing forward.
