# Slat Count Preloader

A Swiss-poster loading gate built out of black slats on vermilion.

Every character is a 3 × 7 grid of 2:1 bars, and every row always owns exactly
three of them. A figure is drawn by **sliding those bars sideways** into the lit
cells and stacking the spares behind them, so the count never fades or swaps a
glyph: it shunts, row by row, each bar on its own slightly-off delay. At 100 the
poster splits into eight horizontal blinds that slide off alternately left and
right, over whatever it was guarding.

1. **Set type.** The bars grow out of nothing into a row of dashes.
2. **Count.** The dashes fan out into `000` and the figure shunts upward on a
   fixed beat, with surges and stalls like a real load. A `%`, a 12-tick rail
   and an `042 / 100` read-out follow along.
3. **Hold.** At 100 the status flips to *Ready* and the last tick goes accent.
4. **Open.** The figure drops back, the blinds slide out, `onComplete` fires.

**Interactive.** Hover the figure and the row under the pointer lights in the
accent colour while the type leans toward you. Click it (or Tab to it and press
Enter / Space) and every slat scatters to a random cell, then finds its own way
back. *Skip intro →* jumps straight to the final frame.

```tsx
import SlatCountPreloader from "@/components/ui/slat-count-preloader"

// Looping showcase
<SlatCountPreloader loop />

// Page gate, driven by real progress
<SlatCountPreloader progress={loaded} onComplete={() => {}}>
  <YourPage />
</SlatCountPreloader>

// A countdown that lands on a word, in your colours
<SlatCountPreloader
  preset="ink"
  sequence={["3", "2", "1", "GO!"]}
  palette={{ accent: "#ffd23f" }}
  slatRatio={2.4}
/>
```

**No dependencies.** React only. Every rule in the scoped `<style>` is `.scp-`
prefixed, and nothing is fetched.

## Props

| Prop | Default | |
|---|---|---|
| `children` | — | Content revealed once the blinds open. Mounted underneath the whole time |
| `loop` | `false` | Showcase mode: count, hold, fold back to a dash, repeat. No children, no `onComplete` |
| `progress` | — | Real progress 0–100. Leave it out for the simulated load |
| `durationMs` | `5600` | Length of the simulated load |
| `sequence` | — | Frames to show instead of a percentage, one per `stepMs`. Numbers right-align and follow `pad`; strings (A–Z, 0–9, `- ! .`) centre |
| `digits` | `3` | Minimum character slots. Grows to fit the longest `sequence` frame |
| `pad` | `true` | `007`. With `false` the spare slots fold flat |
| `preset` | `"vermilion"` | `"vermilion"`, `"ink"`, `"paper"` or `"cobalt"` |
| `palette` | — | `{ background, ink, accent }`, merged over the preset |
| `label` | `"Slat / Count — N°07"` | Top-left HUD line |
| `caption` | *(a line about the slats)* | Bottom-left HUD line |
| `hud` | `true` | Corner type, registration marks, rail and skip button |
| `size` | fits the gate | Character height, any CSS length. The default uses container units so three slots always fit |
| `slatRatio` | `2` | Slat width ÷ height. `1` is square pixels, `3` is long planks |
| `speed` | `520` | Milliseconds for one shunt |
| `stepMs` | `720` | How often the count advances |
| `interactive` | `true` | Hover-to-light and click-to-scatter |
| `exit` | `"blinds"` | `"blinds"` or `"fade"` |
| `fontFamily` | mono stack | HUD face. The default never fetches |
| `height` | `"100svh"` | Root height. A definite length — never a percentage |
| `onComplete` | — | Fires once, after the gate has lifted |
| `className` | `""` | Extra classes on the root |

## How it works

- **The font** is a `Record<string, string[]>` of 3 × 7 bitmaps (`0–9`, `A–Z`,
  `- ! .`). Add a key to add a glyph.
- **The shunt.** For each row, a bar whose own cell is lit stays put and a
  spare moves to the nearest lit cell. The middle bar of a `101` row has two
  equally near homes, so it alternates by row and the motion doesn't lean one
  way. An empty row folds vertically into its nearest lit neighbour. Every bar
  is one `translate()` driven by four custom properties, and it moves in whole
  cells.
- **The delays** are five uneven values (0, 69, 99, 123, 222 ms) laid over the
  grid by overlapping `nth-child`-style rules, plus a 45 ms ripple per slot,
  so neighbours never move in lockstep.
- **Sizing** uses container query units on the gate, so the figure fits the
  box it is given, not the viewport.

The font, layout, delays, load curve and frame formatting live between
`// #region timeline` markers and are executed by
`node tests/slat-count-preloader.test.mjs`. That test also proves every glyph
renders exactly its lit cells.

## Notes

- `prefers-reduced-motion: reduce` snaps the slats into place, stops the lean
  and the blinking status dot, and swaps the blinds for a fade.
- The figure is a real `<button>`, so scatter works from the keyboard. The gate
  is a `role="progressbar"` carrying `aria-valuenow`, and *Loaded* is announced
  politely at 100.
- The demos import nothing but React. `demo-gate.tsx` reveals a small photo
  carousel of ten Unsplash stock photos loaded from `images.unsplash.com`
  (Unsplash License). They load underneath while the gate counts. 21st's cover
  capture blocks external origins, so give that demo your own `--preview`; the
  component and the other two demos fetch nothing.
