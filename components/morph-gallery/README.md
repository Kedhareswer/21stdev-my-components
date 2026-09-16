# Morph Gallery

A photo gallery whose slides dissolve into each other through noise instead of
cutting or cross-fading. Arrows, thumbnails, keyboard, swipe and autoplay.

**No dependencies.** Raw WebGL, React is the only import — no gallery library,
no animation library, no CSS file.

## Why it doesn't look like a cross-fade

The transition is one full-screen shader pass over two textures. An fbm noise
field gives every pixel its own threshold, and progress sweeps past those
thresholds, so the outgoing frame tears away in drifting shreds rather than
fading uniformly:

```glsl
float noise = fbm(v_uv * u_scale + vec2(0.0, u_progress * u_direction)) * 0.5 + 0.5;
noise = smoothstep(0.0, 2.0, length(texture2D(u_to, coverUV(v_uv, u_toAspect)).rgb) + noise);
float mixFactor = 1.0 - smoothstep(adjusted - u_edge, adjusted + u_edge, noise);
```

The second line is the detail that matters: the threshold is biased by the
**luminance of the incoming frame**, so its bright areas cross the front first
and the new image appears to burn through the old one. Both frames also slide,
by different amounts and in opposite directions, which gives the shreds
parallax instead of leaving them in one flat plane.

## Usage

```tsx
import MorphGallery from "@/components/ui/morph-gallery"

<MorphGallery items={items} />                                  // full-bleed
<MorphGallery items={items} autoplay={4500} />                  // the hero
<MorphGallery items={items} height="380px" thumbnails={false} /> // inside a card
<MorphGallery items={items} noiseScale={12} duration={2400} />   // finer, slower
```

```ts
type MorphItem = { src: string; thumb?: string; alt?: string }
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | — | Required. `src` must be CORS-enabled; `thumb` falls back to `src`. |
| `height` | `"100svh"` | **Must be a definite length.** The canvas fills this box. |
| `duration` | `1500` | Milliseconds of dissolve. |
| `noiseScale` | `3.5` | fbm frequency. Higher tears into finer shreds. |
| `edge` | `0.15` | Width of the dissolve front. Near `0` is a hard tear. |
| `drift` | `0.5` | How far the frames slide against each other. `0` holds them still. |
| `loop` | `true` | Wrap past the ends; `false` disables the arrows there. |
| `autoplay` | `0` | Milliseconds between advances. `0` is off. |
| `arrows`, `thumbnails` | `true` | The two chrome layers, independently. |
| `index` / `defaultIndex` / `onIndexChange` | — | Controlled or uncontrolled. |
| `className` | `""` | Appended to the root. |

## Notes

- **Images need CORS.** A cross-origin image without
  `Access-Control-Allow-Origin` cannot be uploaded to WebGL at all. The
  component detects that and falls back to a plain DOM cross-fade, so the
  gallery still works — it just stops morphing. Same for a missing WebGL
  context. Nothing here ever renders as a black rectangle.
- Textures upload **as each image arrives** and the first one starts the loop.
  Waiting for all of them would mean a black frame for as long as the slowest
  image takes, which is the whole first impression.
- One broken URL costs one slide, not the effect.
- Photographs are not powers of two, so mipmaps and `REPEAT` are illegal in
  WebGL1 here — clamp and linear are the only legal pair, and the wrong one
  renders black with no error at all.
- `prefers-reduced-motion` keeps the gallery and drops the animation: the next
  slide is simply there, and autoplay never starts.
- Autoplay pauses on hover, on focus, and while the tab is hidden.
- The canvas measures **its own box**, not the window — it behaves the same in
  a card as full-bleed.
- A dropped GPU context rebuilds; without that the canvas stays black forever.
- Every GL object is released on unmount. One program, one buffer and a texture
  per image is a fast leak in a router otherwise.
- The thumbnail strip opts out of Tailwind Preflight's `img { max-width: 100% }`,
  which would otherwise shrink the thumbnails inside the scroller.

## Credit

Ported from **[Morph Gallery](https://codepen.io/team/wtc/pen/raWNYzx)** by
[We The Collective](https://codepen.io/team/wtc). The shader is theirs. The
port drops the `@wethegit/react-gallery` dependency for ~40 lines of React, and
changes what a page demands of a component: sizing from the element, progressive
texture upload, a fallback when CORS or WebGL is missing, keyboard and swipe,
a reduced-motion path, context-loss recovery, and cleanup on unmount.
