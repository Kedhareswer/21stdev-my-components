# Moonlit Canopy

[Dappled Canopy](../dappled-canopy/README.md) set to its `moonlit` preset by
default: moonlight on a midnight-blue wall: pale blue light, deep shadows. Same shader, props and interaction. Move across it to push
the leaves, click for a gust. Every other preset still works through `preset`.

No dependencies: one fragment shader in raw WebGL1, React is the only import.

```tsx
import MoonlitCanopy from "@/components/ui/moonlit-canopy"

<MoonlitCanopy />
<MoonlitCanopy height="70svh">{/* your hero */}</MoonlitCanopy>
```
