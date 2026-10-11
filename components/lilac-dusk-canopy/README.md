# Lilac Dusk Canopy

[Dappled Canopy](../dappled-canopy/README.md) set to its `lilac-dusk` preset by
default: dusk light on a violet wall: coral sun, plum shadows. Same shader, props and interaction. Move across it to push
the leaves, click for a gust. Every other preset still works through `preset`.

No dependencies: one fragment shader in raw WebGL1, React is the only import.

```tsx
import LilacDuskCanopy from "@/components/ui/lilac-dusk-canopy"

<LilacDuskCanopy />
<LilacDuskCanopy height="70svh">{/* your hero */}</LilacDuskCanopy>
```
