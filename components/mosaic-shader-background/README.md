# Mosaic Shader Background

A full-bleed WebGL background with three scenes in one fragment shader:

- **mosaic**: soft light quantised into rounded tiles, with a light that follows the pointer,
- **prism**: diagonal spectral facets sweeping across slate blue,
- **waves**: flowing silk ribbons on muted plum.

Changing `scene` does not crossfade. The sky re-tiles into the next scene cell by cell, from the bottom up. Children render on top.

**No dependencies.** React is the only import. Nothing is fetched. Without WebGL a painted CSS gradient for the current scene stays in place.

```tsx
import MosaicShaderBackground from "@/components/ui/mosaic-shader-background"

<MosaicShaderBackground scene="mosaic" accent="ice">
  <YourHero />
</MosaicShaderBackground>
```

## Props

| Prop | Default | What it does |
|---|---|---|
| `scene` | `"mosaic"` | `mosaic`, `prism` or `waves`. Changing it re-tiles the sky. |
| `accent` | `"ice"` | `ice`, `ember` or `lime`: tints the light. |
| `interactive` | `true` | A soft light follows the pointer across the mosaic. |
| `transition` | `1.2` | Seconds a re-tile takes. |
| `height` | `"100svh"` | Must be a definite length. |
| `children` | | Laid over the sky, filling it. |
| `className` | | On the root. |

## Behaviour notes

- Renders at three quarters of the device resolution (the tiles hide it), pauses while off screen, and releases its WebGL context on unmount.
- Reduced motion freezes the sky and switches scenes instantly.

Part of the Mosaic kit: `pixel-headline`, `prompt-composer`, `glass-feature-grid`, `glass-pricing-cards`, `pixel-wordmark-footer`. The full page is `mosaic-prompt-template`.
