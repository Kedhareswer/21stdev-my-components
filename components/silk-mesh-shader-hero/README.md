# Silk Mesh Shader Hero

A full-bleed hero painted by one WebGL fragment shader. Satin folds drift and catch a key light, a fine mesh rides the same folds (strongest low in the frame), and slow pulse rings spread from one side. The cloth leans away from the pointer, and a click sends a ripple through it. The headline rises line by line out of a mask as the picture fades up from black; the pill, copy and buttons follow.

Raw WebGL 1, no dependencies. The serif (Instrument Serif, regular and italic, Latin subset) is embedded.

```tsx
import SilkMeshShaderHero from "@/components/ui/silk-mesh-shader-hero"

<SilkMeshShaderHero
  eyebrow="New — the Atelier 04 collection"
  title={"Light, *woven*\ninto motion."}
  description="Hand-finished silks dyed in small batches."
  primaryCta={{ label: "Explore the collection", href: "/shop" }}
  secondaryCta={{ label: "Watch the film", onClick: openFilm }}
  palette="claret"
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `title` | `"Light, *woven*\ninto motion."` | `*word*` sets a word in italic, `\n` breaks the line. |
| `eyebrow` / `description` / `caption` | sample copy | Pill above, copy below, small caption bottom right (`\n` allowed). |
| `primaryCta` / `secondaryCta` | sample labels | `{ label, href?, onClick? }`. The secondary has a play icon. |
| `palette` | `"claret"` | `"claret"`, `"dune"`, `"moss"`, or `{ colors: [shadow, body, fold, highlight], text }`. |
| `speed` | `1` | Cloth speed. |
| `mesh` | `0.14` | Mesh line opacity; `0` hides it. |
| `rings` | `true` | The slow pulse rings. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |

The render loop stops while the hero is off-screen or the tab is hidden, the pixel ratio is capped at 2, and the GL context is released on unmount. Without WebGL it shows a gradient in the palette. With `prefers-reduced-motion` the silk is drawn once and holds still, and the text appears without moving.
