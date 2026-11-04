# Elastic Column Gallery

A full-bleed wall of photo columns that the page scroll pulls in opposite directions: even columns rise, odd ones fall. Each column hangs on its own spring, the outer ones looser than the middle, so a fast scroll leaves the wall strung out and each column stretched along its travel like elastic. Then they catch up and settle. A bold headline sits over a soft dark veil in the middle, a thin meter on the right tracks progress, and hovering a tile brings its colour up with a caption. On first view the columns slide in from alternating sides.

```tsx
import ElasticColumnGallery from "@/components/ui/elastic-column-gallery"

<ElasticColumnGallery
  note="The archive · 2016 — 2026"
  photos={[
    { src: "/mount-cook.webp", caption: "Mount Cook, 2019" },
    { src: "/rosa.webp", caption: "Rosa, 2024" },
    // …ten or more work best
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `photos` | required | `{ src, alt?, caption? }[]`. Ten or more; they are spread across the wall so neighbours differ. Tiles mix tall and wide frames, so any crop works. |
| `heading` | "Ten years / of looking" | Headline over the wall. Wrap each line in `<span><span>…</span></span>` to get the line-by-line rise. |
| `note` | `"The archive · 2016 — 2026"` | Small line under the headline. |
| `columns` | `5` | Columns on wide stages. Phones use three. |
| `elasticity` | `0.8` | How much the columns lag and stretch. `0` moves them rigidly. |
| `scrollLength` | `2.4` | Page scroll the section takes, as a multiple of `height`. |
| `background` | `#0f0e0d` | Stage and edge-fade colour. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |

The section is `height` tall plus `scrollLength × height` of scroll, and its stage sticks while you scroll through it. Tile sizes are worked out from the column width, not measured, and the frame loop runs only while a column is still catching up. It writes only `transform` and opacity.

With `prefers-reduced-motion`, the columns follow the scroll rigidly with no lag, stretch or slide-in, and the headline doesn't rise.

Needs `gsap` (with ScrollTrigger).
