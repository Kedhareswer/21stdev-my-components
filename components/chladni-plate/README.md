# Chladni Plate

A square brass plate, clamped at its centre and dusted with fine sand, under one
low tungsten lamp. Draw a bow across its edge and the plate rings. The sand is
thrown off everywhere the brass moves and settles on the still lines between,
so every note draws its own figure: crosses, diamonds, rings, the shapes Ernst
Chladni showed in 1787.

The physics is real. The plate's modes are free-edge standing waves, paired so
the clamped centre never moves. Where you lay the bow along the edge and how
hard you draw it decide which mode speaks, and a bow resting on one of a mode's
nodes cannot drive it. Every grain is integrated on its own: it hops where the
brass accelerates faster than gravity, flies a short arc, lands, and creeps into
the still line as the plate quietens. The grains are drawn as a heightfield, so
each ridge catches the lamp on one flank and throws a short shadow on the other.

Drag across the sand (away from the edge) to plough a channel through it with a
fingertip; bow again and it gathers back.

```tsx
import ChladniPlate from "@/components/ui/chladni-plate"

<ChladniPlate />
```

## Props

| Prop | Default | |
|---|---|---|
| `light` | `"auto"` | `day` (grey soapstone bench, room light), `night` (black bench, the lamp alone), `auto` follows a `.dark` class on `<html>` |
| `align` | `"center"` | `aside` puts the plate on the right of wide frames and at the top of narrow ones (under 768 px), leaving room for copy |
| `autoBow` | `true` | bows the plate once by itself the first time it scrolls into view |
| `interactive` | `true` | bow the edge, plough the sand |
| `hint` | `true` | the corner pill: names the note while the plate rings, and bows the plate when pressed (keyboard and touch too) |
| `figure` | `13` | the figure the sand sits in on the first frame, 0 to 18 from the lowest note to the highest |
| `seed` | `7` | reshuffles the grains |
| `height` | `"100svh"` | a definite length |
| `children` | none | content laid over the bench (the overlay passes pointer events through; its links and buttons take them) |

## Notes

- React only, WebGL2, no textures or network. It draws only while something
  moves, then holds the frame.
- With a mouse, hover near any edge to lift the bow over it, then press and drag
  across the edge: the stroke speed sets the note, sliding along the edge moves
  the bow. On touch, rest a finger near an edge for about ¼ s, then draw; the
  page still scrolls otherwise. The corner pill bows the plate for anyone.
- Software renderers (and 21st's capture) get fewer pixels and grains, and the
  sand catches up on wall time between frames, so the figure still finishes.
- With reduced motion there is no opening stroke; pressing the pill shows the
  new figure settled, without the sand in flight.
- Without WebGL2 it shows a still brass square instead.
