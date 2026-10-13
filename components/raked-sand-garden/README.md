# Raked Sand Garden

A full-bleed karesansui gravel bed seen from above under a low sun. The gravel
is a real heightfield. Parallel furrows run across the bed, concentric rings go
round each group of stones, and moss sits at the stones' feet. Every furrow is
lit per pixel and casts its own shadow, so the pattern shows up in raking light
the way it does in a real garden. Drag across it and a cedar rake lowers into
the gravel and draws new furrows behind it. The furrows curve as the head turns
and overwrite the old ones. The shoved gravel stands as a low shoulder along each
flank and a crescent where the rake lifts. The rings round each island are left
alone: a stroke stops at their outer berm.

```tsx
import RakedSandGarden from "@/components/ui/raked-sand-garden"

<RakedSandGarden />
```

## Props

| Prop | Default | |
|---|---|---|
| `light` | `"auto"` | `day` (low warm sun), `night` (moonlight), `auto` follows a `.dark` class on `<html>` |
| `stones` | `3` | stone groupings, 0–5 |
| `groove` | scales with the frame, 14–26 | furrow spacing, CSS px |
| `tines` | `6` | teeth on the rake |
| `autoRake` | `true` | rakes one stroke across the bed the first time it scrolls into view |
| `interactive` | `true` | drag to rake; with a mouse the rake hovers, lifted, before you press; on touch, rest a finger ~¼ s, then drag |
| `seed` | `3` | reshuffles the stones |
| `height` | `"100svh"` | a definite length |
| `children` | — | content laid over the garden (the overlay passes pointer events through; its children take them) |

## Notes

- React only, WebGL2, no textures or network. It draws only while something
  changes, then holds the frame.
- Without WebGL2 it shows a CSS furrow pattern instead.
- With reduced motion there is no opening stroke and the rake appears without
  easing. Raking still works.
- On touch the page still scrolls (`touch-action: pan-y`). Raking starts after
  a finger rests about 250 ms, and from then on that finger's moves rake instead
  of scrolling.
- Small resizes (a scrollbar appearing, a mobile URL bar) keep your strokes.
  A larger resize lays the garden again.
