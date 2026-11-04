# Rotating Flavor Slider

A scroll-driven, full-bleed product slider for anything round photographed from above: cakes, pizzas, bowls, plates. The photo sits half below the bottom edge, and a ring of curved flavour names arcs over it. The stage sticks while the page scrolls, and the scroll scrubs one continuous position. The photo turns 45° per slide and morphs into the next. The page colour blends from one slide's colour to the next. The marker dot glides round the ring, the title and copy trade places, and the corner garnish flies out as the next drops in. Letting go eases to the nearest slide.

Clicking a name on the ring, the round arrows in the bottom corners or the left/right arrow keys scrolls the page to that slide, so the same morph plays. There is no autoplay, and the page scroll is never hijacked.

```tsx
import RotatingFlavorSlider from "@/components/ui/rotating-flavor-slider"

<RotatingFlavorSlider
  slides={[
    { name: "lemon", title: "Lemon Tart", description: "A crisp butter shell…", image: "/lemon-tart.webp", color: "#e2a90d", decor: ["/lemons.webp"] },
    { name: "berry", title: "Berry Tart", description: "Vanilla pastry cream…", image: "/berry-tart.webp", color: "#b01538", decor: ["/raspberries.webp"] },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `slides` | required | `{ name, title, description?, image, alt?, color, decor? }[]`. `image` is a square, top-down photo, shown as a circle. `color` is the page colour (hex or rgb). `decor` is `[left, right]` garnish for the top corners (transparent PNG/WebP); with one image it is mirrored on the right. |
| `turn` | `45` | Degrees the photo turns per slide. |
| `scrollPerSlide` | `0.8` | Page scroll per slide, as a fraction of `height`. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |
| `className` | none | Added to the scroll track. |
| `onChange` | none | `(index)` when the nearest slide changes. |

The component is a tall scroll track (`height × (1 + (slides − 1) × scrollPerSlide)`) with the stage pinned by `position: sticky`. Five to seven slides fit the ring; more squeeze into the same arc.

Everything scales with the stage box. Below 640 px of width the wheel lifts to the middle of the screen. The text is white, so pick slide colours dark or saturated enough to read on. In dark mode a layer of `--color-background` dims the colours slightly.

With `prefers-reduced-motion`, the photo doesn't turn, the copy and garnish only fade, and the scroll doesn't snap.

Needs `gsap` (ScrollTrigger). The demo photos are free Unsplash images (IDs in `demo.tsx`), and the garnish was cut out with Adobe remove-background.
