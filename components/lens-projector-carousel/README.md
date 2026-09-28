# Lens Projector Carousel

A card carousel staged as a film still: a camcorder on the left throws each
card across a sheet of aged paper as a cone of light. Change slides and the
next card develops out of the lens, growing to fill the beam while the last is
flung at the audience. Go back and the old card is sucked into the lens.

```tsx
import LensProjectorCarousel from "@/components/ui/lens-projector-carousel"

<LensProjectorCarousel items={items} />                                  // full-bleed
<LensProjectorCarousel items={items} heading="Conflict" cameraLabel="HD" autoplay={5000} />
<LensProjectorCarousel items={items} height="640px" ink="#5b3a12" paper="#e6dcc4" />
```

```ts
type ProjectorItem = { src: string; title?: string; note?: string; label?: string; alt?: string }
```

**No dependencies beyond React.** One file, no CSS file, no image files. The
camera is inline SVG, the paper is CSS noise.

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | — | Required. `title` is the condensed headline, `note` the paragraph under it, `label` the pencil annotation over the beam. |
| `heading` | `"Conflict"` | Script heading in the corner. `""` hides it. |
| `cameraLabel` | `"HD"` | Text on the camera's badge plate. |
| `height` | `"100svh"` | Total height. **Must be a definite length.** |
| `autoplay` | `0` | Milliseconds between slides. `0` is off. |
| `loop` | `true` | Wrap past the ends. |
| `ink` | `"#7b5a1c"` | Heading, headline and progress line. |
| `paper` | `"#d8ccb1"` | Paper colour. |
| `index` / `defaultIndex` / `onIndexChange` | — | Controlled or uncontrolled. |
| `className` | `""` | Appended to the root. |

## Interaction

- **Click the beam** for the next card, **drag** it left or right (48px) to go either way.
- **Numbers** jump to a slide; hovering or focusing one deals a tilted print of it. **‹ ›** step.
- **← → Home End** when focused.
- **Autoplay** pauses on focus, in a hidden tab and off-screen, shows a progress line, and stops for good once you take over. It is off under `prefers-reduced-motion`.

## Install safety

- The root takes an explicit `height`, never a percentage. Layout is in container units, so it fits whatever box it is given, and re-flows below 700px wide.
- All styles are one scoped `<style>` (`.lp-*`). It uses no host tokens: the scene is a fixed print, coloured by `ink` and `paper`.
- Images set `max-width: none` explicitly, against Tailwind Preflight.
- Reduced motion swaps every move for a 300ms cross-fade and hides the dust and flicker.
- The demo paints its five stills on a canvas at runtime, so it makes no network requests.
