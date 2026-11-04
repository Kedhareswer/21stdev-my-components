# Infinite Pan Grid

An endless wall of photo tiles that drifts slowly on a diagonal. The wall sits muted and grey; a soft lens follows the pointer and shows the full-colour layer underneath, with each tile's caption. Drag anywhere to throw the wall in any direction; it coasts to a stop and never runs out. A glass dock at the bottom switches the density between loose, regular and dense; the wall fades, re-deals in the new tile size and comes back, while a pill slides under the chosen option.

On touch screens the lens opens under your finger while you drag. Arrow keys nudge the wall when it has focus.

```tsx
import InfinitePanGrid from "@/components/ui/infinite-pan-grid"

<InfinitePanGrid
  brand="Loupe"
  photos={[
    { src: "/ember.webp", caption: "Ember knit" },
    { src: "/rosa.webp", caption: "Rosa" },
    // …eight or more
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `photos` | required | `{ src, alt?, caption? }[]`. Square crops work best. Eight or more keep repeats apart. |
| `brand` | `"Loupe"` | Wordmark, top left. |
| `note` | `"Drag anywhere"` | Short line, top right. |
| `density` | `"regular"` | Starting density: `"loose"`, `"regular"` or `"dense"`. |
| `lens` | `170` | Lens radius in px. |
| `drift` | `14` | Idle drift speed in px/s. `0` holds the wall still. |
| `background` / `ink` | `#f1efea` / `#121110` | Paper and text colours. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |

The wall is one pattern laid out twice in each direction and moved as two layers, so a frame writes two transforms and three CSS variables, nothing per tile. The frame loop reads no layout. The stage position is measured when the pointer enters or presses (and on resize) in page coordinates, so the lens only needs `scrollY` to stay under the pointer while the page scrolls. The loop pauses off-screen.

With `prefers-reduced-motion`, the wall doesn't drift or coast, density changes swap instantly, and the dock pill doesn't slide. Dragging still pans it.

No dependencies beyond React.
