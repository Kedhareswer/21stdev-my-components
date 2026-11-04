# Orbit Ring Gallery

A portfolio ring. Project photos orbit a tilted ellipse around the current project's title: the back of the ring passes behind the title, the front passes over it, and the far cards shrink and fade into the paper. Scroll down the page or drag sideways to turn it. Each card trails the ring by its own amount and stretches with the speed, so the ring moves like something thick and liquid, then settles with the nearest project at the front. Cards spiral out from the middle on first view.

An index list (bottom right on wide stages) and the cards themselves turn the ring to a project the short way round. Arrow keys do the same when the stage has focus. The title rises in per project and a "View project" link follows the front card.

```tsx
import OrbitRingGallery from "@/components/ui/orbit-ring-gallery"

<OrbitRingGallery
  heading="Atelier Ono"
  works={[
    { title: "Ember Run", meta: "Footwear launch · 2026", href: "/work/ember-run", image: "/ember-run.webp" },
    { title: "Rosa", meta: "Portrait series · 2026", image: "/rosa.webp" },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `works` | required | `{ title, image, alt?, meta?, href? }[]`. Portrait photos (about 3:4). Ten to sixteen fill the ring well. |
| `heading` | `"Index"` | Wordmark, top left. |
| `tagline` | none | Line under the title when a work has no `meta`. |
| `viscosity` | `0.7` | How much the cards trail and stretch. `0` is a rigid ring. |
| `scrollPerWork` | `0.2` | Page scroll per project, as a fraction of `height`. |
| `background` / `ink` / `accent` | `#eee8dd` / `#17130e` / `#2f43ff` | Paper, text and accent colours. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |
| `onChange` | none | `(index)` when the front project changes. |

The section is `height` tall plus the scroll it needs, and its stage sticks while you scroll through it. Titles use Instrument Serif (OFL), subset to Latin and embedded (about 19 KB). The frame loop runs only while the ring moves and is on-screen, reads no layout, and writes only `transform`, `z-index` and opacity.

With `prefers-reduced-motion`, the ring turns rigidly with no lag, stretch or entrance, and titles swap without rising.

Needs `gsap` (with ScrollTrigger).
