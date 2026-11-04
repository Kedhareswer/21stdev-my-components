# Orbit Screens Showcase

A 3D work showcase built with three.js. Project screens orbit a slowly turning, iridescent chrome knot on a tilted ring, and the far side of the ring sinks into fog. The knot and ring lean gently toward the pointer. Drag to spin the ring (it settles on a spring with a screen at the front), hover a screen to lift it and see its name, and click one, or use the arrows or arrow keys, to bring it round. A frosted detail card beside the scene follows the front project with its meta line, summary, case link and counter. On first view the knot swells in and the screens spiral out from it.

```tsx
import OrbitScreensShowcase from "@/components/ui/orbit-screens-showcase"

<OrbitScreensShowcase
  eyebrow="Selected projects"
  heading={<>Work that<br /><em>moves people</em></>}
  screens={[
    { title: "Lumen OS", meta: "Product launch · 2026", summary: "A launch site that opens like the laptop it sells…", href: "/work/lumen", image: "/lumen.webp" },
    { title: "Orchard House", meta: "Architecture · 2026", image: "/orchard.webp" },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `screens` | required | `{ title, image, meta?, summary?, href? }[]`. Landscape images (16:10). Six to ten fill the ring well. Remote images must send CORS headers. |
| `heading` | "Work that *moves people*" | Big heading, top left (an `<em>` gets the gradient). |
| `eyebrow` | `"Selected projects"` | Small line over the heading. |
| `ctaLabel` | `"Open case"` | Link label in the detail card. |
| `background` / `ink` / `accent` | `#07080c` / `#eef0f6` / `#8fa8ff` | Stage (also the fog colour), text and accent. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |
| `onChange` | none | `(index)` when the front project changes. |

One renderer, DPR capped at 2, everything disposed on unmount. Rendering pauses while the showcase is off-screen. The frame loop reads no layout; the canvas position for hit-testing is measured only when the pointer enters or presses.

With `prefers-reduced-motion`, the knot and dust hold still, the ring stops drifting, turns jump instead of springing, and nothing spirals in. The loop then renders only when something changes.

Needs `three`.
