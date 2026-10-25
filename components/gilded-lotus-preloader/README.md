# Gilded Lotus Preloader

A loading gate painted on blush linen, for a portfolio that wants to open
quietly. The gold ring is the progress bar.

## The storyboard

1. **Stem, 0–16%.** A thread of gold rises from the bottom of the frame and
   stops just below the centre.
2. **Ink, 12–62%.** Where the stem stops, ink bleeds into the linen. It
   spreads fast, then slowly, and its edge keeps breathing. A grey wash runs
   down from the moon behind the stem.
3. **Gold, 0–100%.** Gold leaf is laid round the moon stroke by stroke. It
   sweeps three quarters of a turn, from eight o'clock round to four. Its
   leading edge is a dry brush: the solid leaf thins into long rays as it
   goes. The leaf catches the light, which follows the pointer.
4. **Bloom, 24–98%.** A bud rises out of the ink on the stem and opens
   petal by petal. The outer petals go first, then the back row, the middle
   and the front. Each one overshoots a little and settles.
5. **Hold, at 100%.** A light runs once round the gilding.
6. **Flood.** The ink overruns the frame. The gold dims and lifts off as
   flakes, the lotus sinks, and the stem draws back into the water.
7. **Title card.** A title sets itself in gold in the dark, with a rule and a
   tagline under it.
8. **Open.** The dark fades and `children` are there, already mounted. With
   `loop`, the ink recedes instead and the whole piece plays again.

## Interaction

- The light on the gold and a slight parallax between the linen, the ink,
  the gold and the lotus follow the pointer.
- A click, Enter or Space during the load rushes it to 100%.
- With `loop`, a click on the title card replays from the start.

```tsx
import GildedLotusPreloader from "@/components/ui/gilded-lotus-preloader"

// Showcase: plays forever
<GildedLotusPreloader loop />

// Gate a real page on real progress
<GildedLotusPreloader
  progress={loaded}
  preset="ivory"
  title="Ōka"
  tagline="Lacquer · Light · Line"
  meta="Studio Ōka · Selected work"
  onComplete={() => setReady(true)}
>
  <YourLanding />
</GildedLotusPreloader>
```

**No dependencies beyond React, and no assets.** The linen, the ink and the
gold leaf are painted on three canvases. The leaf and the moon's interior
are painted once per size and reused every frame. The lotus is an SVG of
14 petals whose transforms are set straight from the frame loop, so React
renders only when the percentage changes. The canvases hold a pixel budget
on large, dense screens.

## Props

| Prop | Default | Description |
|---|---|---|
| `children` | — | The page revealed when the ink parts. Mounted from the start. Ignored with `loop`. |
| `loop` | `false` | Play forever as a showcase. `children` never show and `onComplete` never fires. |
| `progress` | — | Real progress, `0`–`100`. Leave it out to run a simulated load. |
| `durationMs` | `6400` | Length of the simulated load. It surges and stalls like a real one. |
| `preset` | `"blush"` | `"blush"`, `"ivory"` or `"noir"`. |
| `palette` | from `preset` | Partial overrides, see below. |
| `seed` | `11` | Reshuffles the gold leaf, the ink's edge and the linen. |
| `title` | `"Padma"` | The title card. Empty string skips the card. |
| `tagline` | `"Rising from still water"` | Under the title. |
| `meta` | `"Portfolio · MMXXVI"` | Top-left line. Empty to hide. |
| `hint` | `"Click to skip"` | Bottom-left line while loading. Empty to hide. |
| `hud` | `true` | Corner type and the counter. |
| `label` | `"Loading"` | Accessible name of the progress bar. |
| `serifFamily` | Cormorant Garamond, then system serifs | Face for the title. Nothing is fetched. Pass one the host already loads. |
| `monoFamily` | JetBrains Mono, then system monos | Face for the corner type. |
| `height` | `"100svh"` | Root height. Always a definite length, never `h-full`. |
| `onComplete` | — | Fired once, after the gate has opened. |
| `className` | `""` | Extra root classes. |

### Palette

| Key | Blush | Used for |
|---|---|---|
| `canvas` | `#d9ccc6` | The linen. |
| `canvasDeep` | `#b6a6a1` | The linen's corners and threads. |
| `ink` | `#121012` | Ink pooled at the moon's edge, and the flood. |
| `inkCore` | `#4b4446` | The moon's mottled centre. |
| `gold` | `#cfa52e` | Gold leaf. |
| `goldLight` | `#f3dd8e` | Gold in the light, and the title. |
| `goldDeep` | `#8a6a14` | Gold in shadow. |
| `petal` | `#fbf6f3` | The petals' body. |
| `petalTip` | `#c95f7a` | The petals' tips and outlines. |
| `petalBase` | `#e59bae` | The blush between tip and body. |
| `text` | `#45393a` | Corner type. |

## Notes

- The stage carries its own colours, so it reads the same in light and dark
  hosts. Use `preset="noir"` on a dark site.
- `prefers-reduced-motion` keeps the storyboard but drops the parallax, the
  flood and the flakes. The gate cuts from the bloom to the title card.
- The gate is a `role="progressbar"` with its value, and focusable. The
  title is announced when the load completes.
- Visual reference: an ink-and-gold-leaf lotus painting supplied by the
  owner. Nothing from it is copied. Every mark here is drawn in code.
