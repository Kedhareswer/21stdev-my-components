# Stepped Morph Slider

An image slider whose window is a stepped, skyline-like mask. Each slide has
its own blocky shape; moving to the next one morphs the mask column by column
— a left-to-right stagger — while the picture cross-fades and drifts. Hover
lifts the column under the pointer.

Click, drag or swipe the image, use the arrows, the progress dots or ←/→.
Autoplay runs a progress line and pauses on hover, on focus and off-screen.

**No dependencies.** Slides without an `image` get one painted on a canvas at
runtime — abstract architecture with lit beams, glass grids and film grain, in
four palettes — so it works with no assets at all.

## Usage

```tsx
import SteppedMorphSlider from "@/components/ui/stepped-morph-slider"

<SteppedMorphSlider />
<SteppedMorphSlider
  columns={11}
  outline="#1b1a17"
  slides={[
    { image: "/work/facade.jpg", title: "Ribbon Facade", caption: "Steel bands over glass." },
    { title: "Copper Hour", palette: "dusk", seed: 11 },
  ]}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `slides` | 4 painted slides | `{ image?, title, caption?, seed?, palette? }[]` |
| `columns` | `9` | Steps per shape, 3–16. |
| `autoplay` | `5200` | ms per slide; `0` turns it off. |
| `duration` | `1100` | Morph length, ms. |
| `aspect` | `5 / 3` | Width ÷ height of the window. |
| `outline` | `""` | Stroke colour round the shape; empty hides it. |
| `background` / `ink` / `muted` / `accent` | warm white / near-black | Page, text, secondary text, progress. |
| `onChange` | — | `(index) => void` |

`palette`: `"concrete"` · `"dusk"` · `"glass"` · `"rose"`. `seed` picks both the
slide's shape and its painted image, so a slide always looks the same.

## Notes

- Every shape has the same number of corners, so any two morph cleanly.
- Images fill the window with `slice`, like `object-fit: cover`.
- `prefers-reduced-motion`: slides change instantly and autoplay is off.
