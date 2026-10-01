# Elsewhere Poster

A square travel poster in the Swiss-meets-romantic style. Two notched sheets of
off-white paper hold a landscape painting between them, and the sheets are
covered in fine print: rotating ring seals in the corners, a script line, arced
captions, barcodes, wire globes, a 1–9 ruler and a big serif destination.

The painting is generated in the component. Layered mountains, a snow-lit
peak, cloud banks, a still lake and stands of pine are drawn on canvas from
seeded numbers. Then every layer is repainted stroke by stroke, with each
stroke taking its colour from the layer and following its edges, so the result
reads as oil on canvas rather than vector art. Four lights ship with it
(golden, dawn, dusk, night), and you can pass any colours of your own.

```tsx
import ElsewherePoster from "@/components/ui/elsewhere-poster"

<ElsewherePoster
  script="You & Me"
  destinations={[
    { title: "Elsewhere", scene: "golden", seed: 3 },
    { title: "Lofoten", scene: "night", code: "LOF-68N-13E", tagline: "THE SUN NEVER QUITE SETS UP HERE" },
    { title: "Dolomites", scene: { skyTop: "#9fb7b3", water: "#7fb3a4" } },
  ]}
  colors={{ paper: "#efe8da", ink: "#1f2f29", mat: "#16201c" }}
/>
```

**No dependencies beyond React.** Nothing is fetched: no fonts, images or
stylesheets. To use a photo, set `image` on a destination.

## Play with it

| Do this | And |
|---|---|
| Drag the painting up or down | The window slides between the sheets. Its tab, the tagline, the barcodes and the labels move with it |
| Tap or click the painting | The window snaps fully open or closed |
| Move the mouse | The sky, clouds, slopes and foreground drift at four parallax depths |
| Click the title | Travel to the next destination. The painting develops in, and the letters turn over like a split-flap board |
| Click the left or right globe | Go back or forward. The globes spin when you travel |
| Hover the lower sheet | A marker follows you down the 1–9 ruler on both edges |
| Hover a letter, or a word on the top edge | It lifts, or takes the accent colour |
| Keyboard | Tab to the painting (a slider), then use ↑ ↓, Home, End or Enter. The title and globes are buttons |

## Props

| Prop | Default | Description |
|---|---|---|
| `destinations` | 4 places | `{ title, scene?, seed?, code?, image?, tagline? }[]`. `scene` is `"golden" \| "dawn" \| "dusk" \| "night"` or a partial palette laid over golden. `seed` reshapes the mountains, trees and clouds. `code` feeds the barcodes. |
| `initial` | `0` | Which destination shows first. |
| `onDestinationChange` | | `(index, destination) => void`, called after the poster travels. |
| `script` | `"You & Me"` | The handwritten line at the top. |
| `marquee` | `ICI OU AILLEURS C'EST PAREIL` | The five words along the top edge, repeated on both halves. Keep them short. |
| `tagline` | French line | The line in the top sheet's tab. A destination's own `tagline` replaces it. |
| `pairs` | `ÊTRE PRÉSENT`, `TOI & MOI` | Two two-line labels beside the script, mirrored. |
| `ring` | `NOUS TROUVONS AILLEURS…` | The text around both corner seals. It always closes the circle. |
| `corner` | 3 lines | The note in the lower sheet's corners. |
| `gateLabel` | `ÊTRE AILLEURS` | Printed twice in the lower tab. |
| `credits` | design / name / graphic design | Three two-line credits, mirrored. |
| `arcTop` / `arcBottom` | French lines | The arcs above and below the title. A caption too long for its arc is squeezed to fit. |
| `notes` | 2 pairs | Two-line notes under the globes, mirrored. |
| `footer` | `SEUL AVEC TOI` | Bottom corners. |
| `colors` | paper, ink, black | `{ paper, ink, mat, accent }`. `accent` is the hover and ruler colour. |
| `fonts` | system stacks | `{ display, script, sans }` font-family strings. |
| `mat` | `true` | Draw the black card around the poster. Without it, the poster is cropped to its paper edge. |
| `parallax` | `true` | Painting layers follow the pointer. |
| `animate` | `true` | Rings turn, stars twinkle, clouds drift, marks blink, letters scramble. |
| `gate` | `0.7` | How far the window starts slid down, `0..1`. You can change it later to slide the window from outside. |
| `maxWidth` | `"880px"` | The poster is square and fills its parent's width up to this. |
| `className` | `""` | Extra classes on the root. |

## Notes

- **Sizing.** The poster is `width: 100%` with a 1 / 1 aspect ratio, so it needs
  only a parent with a width. It never depends on a parent height.
- **Fonts.** Nothing is loaded. The title uses the first of Playfair Display,
  Bodoni 72, Didot, Big Caslon, Georgia or Times that the reader's system has,
  and the script line uses Snell Roundhand, Apple Chancery or Edwardian Script
  if one is installed, otherwise an italic serif. If your site already loads a
  display or script face, pass it through `fonts`.
- **Fine print.** The small type is set at poster scale, like the printed
  original. Below about 500px wide it becomes texture rather than text. The
  destination is always available to screen readers as a heading.
- **Painting cost.** A destination is painted once, one layer per frame (each
  frame took under 100 ms on a software-rendered 1× screen and about 160 ms at
  2×), while the old painting is blurred out. It repaints only when you travel
  or when the poster's size changes by more than about a fifth. Parallax and the sliding window just move layers and rewrite
  two paths. The loop pauses while the poster is off screen.
- **Accessibility.** The painting is a vertical slider, and the title and globes
  are keyboard buttons with visible focus rings. Each trip is announced in a
  polite live region.
- **prefers-reduced-motion.** No parallax, drift, spin, twinkle, blink or
  scramble. The window still slides, but without easing, and travelling swaps
  the painting straight away.
