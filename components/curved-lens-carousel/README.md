# Curved Lens Carousel

A photo carousel seen through a curved lens. Every card is drawn on one WebGL canvas: the middle card reads almost flat, and the further a card slides from the centre, the taller and more bent it grows, with a thin chromatic fringe and a glassy rim at its edge. Moving fast adds a soft wobble and a little more fringe; at rest it settles on a critically damped spring. Cards rise in one by one on first view, and each title rises letter by letter.

Drag or flick the cards, use the arrow keys when the carousel has focus, or the round buttons. It loops both ways. There is no autoplay, and the page scroll is never captured.

```tsx
import CurvedLensCarousel from "@/components/ui/curved-lens-carousel"

<CurvedLensCarousel
  label="Field Atlas — Vol. 04"
  slides={[
    { kicker: "Route 12 · Utah", title: "Red Mile", caption: "Two lanes of tar through sandstone…", image: "/red-mile.webp" },
    { kicker: "Moraine · Alberta", title: "Glass Water", image: "/moraine.webp" },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `slides` | required | `{ title, kicker?, caption?, image, alt? }[]`. Portrait photos (about 4:5) read best. Remote images must send CORS headers, because WebGL reads their pixels. |
| `label` | `"Field Atlas"` | Small label, top left. |
| `bend` | `0.55` | How hard the lens bends the outer cards. `0` is flat. |
| `background` | `#0e0e10` | Stage colour. |
| `ink` | `#f3ede4` | Text and control colour. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |
| `onChange` | none | `(index)` when the centred slide changes. |

The title face is Instrument Serif (OFL), subset to Latin and embedded (about 19 KB). There is one canvas and one draw per visible card; the frame loop stops when the cards settle and while the carousel is off-screen. Without WebGL it shows the centred photo as a plain image.

With `prefers-reduced-motion`, slides switch without the spring, wobble or entrance, and the titles fade instead of rising.

No dependencies beyond React.
