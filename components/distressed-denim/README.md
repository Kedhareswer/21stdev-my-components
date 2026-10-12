# Distressed Denim

A full-bleed background of hanging denim you can rip. The cloth is a real mesh
of a few thousand points, gathered so it falls in soft vertical folds. Rest the
pointer on it to press it in. Drag across it to tear it: the indigo warp under
the stroke snaps, the cut opens under its own weight, and the edge frays into
the white weft. Click to punch a small hole.

```tsx
import DistressedDenim from "@/components/ui/distressed-denim"

<DistressedDenim rips={7} />
```

## Props

| Prop | Default | |
|---|---|---|
| `preset` | `"indigo"` | `indigo`, `rinse`, `lightwash`, `black` |
| `palette` | — | `{ deep, indigo, wash, weft, under }` overrides |
| `thread` | `2.4` | warp thread width, CSS px |
| `folds` | `0.6` | fold depth, 0–1 |
| `fade` | `0.55` | how washed out, 0–1 |
| `rips` | `0` | rips torn before the first paint |
| `interactive` | `true` | drag to rip, click to puncture, hover to press |
| `seed` | `7` | reshuffles folds, rips and yarn |
| `height` | `"100svh"` | a definite length |
| `children` | — | content laid over the fabric |

## Notes

- React only, WebGL1, no textures or network. The cloth simulates only while
  something moves, then sleeps; it also sleeps off-screen.
- Without WebGL it shows a CSS twill instead.
- With reduced motion, hovering no longer presses the cloth. Rips still work.
- Resizing re-hangs the cloth, so earlier rips are cleared.
