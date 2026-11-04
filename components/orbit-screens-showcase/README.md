# Orbit Screens Showcase

A 3D work showcase built with three.js. The project screens are the hero: they orbit a soft pool of accent-coloured stage light on a tilted ring, and the far side of the ring sinks into fog. The ring leans gently toward the pointer. Drag to spin the ring (it settles on a spring with a screen at the front), hover a screen to lift it and see its name, and click one, or use the arrows or arrow keys, to bring it round. A frosted detail card beside the scene follows the front project with its meta line, summary, case link and counter. On first view the light pool brightens and the screens spiral out from the middle.

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
| `background` / `ink` / `accent` | `#07080c` / `#eef0f6` / `#8fa8ff` | Stage (also the fog colour), text, and the accent that tints the light pool. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |
| `onChange` | none | `(index)` when the front project changes. |

One renderer, DPR capped at 2, everything disposed on unmount. Rendering pauses while the showcase is off-screen. The frame loop reads no layout; the canvas position for hit-testing is measured only when the pointer enters or presses.

With `prefers-reduced-motion`, the light and dust hold still, the ring stops drifting, turns jump instead of springing, and nothing spirals in. The loop then renders only when something changes.

Needs `three`.
