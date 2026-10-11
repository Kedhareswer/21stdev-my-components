# Grid Loupe Shader

A WebGL image that turns into a magnifying mosaic under the pointer. The
picture is cut into a grid, and every cell near the pointer shows its own patch
blown up: the closest cells flatten into single colours, the outer ones read as
a ring of tiny lenses, and dots swell on the grid nodes. Move faster and the
loupe opens wider. It opens as a full mosaic that settles, and with nobody
pointing, the loupe wanders on its own.

Inspired by Tom Miller's "Canvas Grid Mouse Effect" pen. Rebuilt as one
fragment shader with no GSAP.

**No dependencies.** Without `src`, a still life of ranunculus (layered petals,
foliage, film grain) is painted on a canvas at runtime in one of three palettes,
so it works with no assets at all.

## Usage

```tsx
import GridLoupeShader from "@/components/ui/grid-loupe-shader"

<GridLoupeShader />
<GridLoupeShader palette="butter" cellSize={56} dotColor="#111" />
<GridLoupeShader src="/photos/peonies.jpg" fade restRadius={0} height={640}>
  <h1>Look closer.</h1>
</GridLoupeShader>
```

| Prop | Default | |
|---|---|---|
| `src` | painted still life | Image URL. Off-origin images need CORS. |
| `palette` | `"coral"` | `coral` · `blush` · `butter` (painted image only) |
| `height` | `"100svh"` | Any CSS length |
| `cellSize` | `72` | Grid cell in CSS px |
| `dots` / `dotColor` / `dotScale` | `true` / `#fff` / `0.15` | Node dots and their largest radius as a fraction of a cell |
| `fade` | `false` | Blend the lens in by distance instead of hard cells |
| `spread` | `2` | How much pointer speed widens the loupe |
| `restRadius` | `0.12` | Loupe size while the pointer rests (fraction of the longer side); `0` = speed only, like the original |
| `intro` | `true` | Open as a full mosaic that settles |
| `autoplay` | `true` | Wander when nobody is pointing |
| `children` | | Laid over the image; links and buttons stay clickable |

Reduced motion turns off the intro and the wandering. The render loop pauses
off-screen. If WebGL is unavailable, or a remote image has no CORS, the plain
image shows instead.
