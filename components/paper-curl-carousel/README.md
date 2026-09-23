# Paper Curl Carousel

An image carousel where every slide is a printed sheet. Drag its edge, click,
or press an arrow and the sheet rolls over a cylinder, shows the paper stock
on its back, and lays a shadow across the sheet underneath.

```tsx
import PaperCurlCarousel from "@/components/ui/paper-curl-carousel"

<PaperCurlCarousel items={items} />                          // full-bleed hero
<PaperCurlCarousel items={items} autoplay={4200} />          // with a timer
<PaperCurlCarousel items={items} height="560px" />           // inside a section
<PaperCurlCarousel items={items} rail={false} />             // stage only
```

```ts
type PaperCurlItem = { src: string; title?: string; caption?: string; alt?: string }
```

**No dependencies beyond React.** Raw WebGL, one file, no CSS file, no Tailwind.

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | — | Required. `src` must be CORS-enabled, same-origin, or a `data:` URL. |
| `height` | `"100svh"` | Total height, rail included. **Must be a definite length.** |
| `autoplay` | `0` | Milliseconds between turns. `0` is off. |
| `loop` | `true` | Wrap past the ends; `false` disables the controls there. |
| `paper` | `"#EDEEE9"` | The stock on the back of each sheet, `#rrggbb`. |
| `rail` | `true` | Caption rail under the stage: counter, title, caption, controls. |
| `index` / `defaultIndex` / `onIndexChange` | — | Controlled or uncontrolled. |
| `className` | `""` | Appended to the root. |

## How the curl is drawn

One fragment-shader pass over two textures. There is no mesh. For each pixel,
the shader unrolls a cylinder lying along the fold line and asks which layer
of the sheet is on top there:

1. the **unlifted front**, darkened in the gutter by the fold;
2. the **underside of the roll**, seen from inside the curl and shaded by how far it has turned from the light;
3. the **back of the roll**, coming over the top with a highlight band;
4. the **flipped-over back**, lying flat on top.

Anywhere none of those reach is the next sheet, under the roll's shadow. The
back is paper stock with the print ghosting through it, mirrored, the way a
sheet looks held to the light. Grain is keyed to the sheet, so it travels with
the paper rather than sitting on the screen.

## Interaction

Everything is one number, the fold position, driven by one spring. So a drag,
a flick, a click and a hover peek hand over to each other without a seam.

- **Drag** the right half to turn forward, the left half to bring the previous
  sheet back. The corner curls up in place first, then rides under your
  finger. The grab height sets the tilt: grab mid-edge and the whole edge
  lifts, grab near a corner and that corner leads.
- **Release** decides by speed first: a flick faster than 0.11 px/ms turns the
  page however short the drag, and a flick back cancels however far it got.
  Anything slower turns the page if it's past halfway.
- **Click or tap** turns that way. The **arrow keys** work once the stage has focus.
- **Hover** near an edge (mouse only) lifts the corner a little, or rolls the
  previous sheet's edge into view. Click while it's lifted and the peek
  becomes the turn.

### The turn arrives, it doesn't approach

A spring only approaches its target. A turn aimed exactly at the edge spent
**2.2s** drawing, most of it creeping the final corner off the stage, and at
rest it kept drawing 13 frames of sub-pixel settling. The spring now aims past
the edge and stops at it, so the sheet arrives moving and the turn is done.
Measured: about a second per turn, and **0 frames** drawn at rest. Leaving
pushes harder than landing, so an exit is quicker than an entrance. The test
fails if either push is removed.

## Autoplay

The countdown is a CSS animation on the Next button's ring, and a hidden clock
with the same duration and pause state fires the turn. What you see counting
down is exactly what fires it.

It does **not** pause just because the pointer is over the stage. It used to,
and on a full-bleed hero the pointer is almost always there, so autoplay
never ran for desktop visitors. The ring sat frozen, and 21st's capture bot,
which parks its cursor mid-stage, recorded a 5.5s video of nothing happening.
It now pauses where the user is about to act (an edge peek zone, the caption
rail, a drag, focus), and in a hidden tab or off-screen. Once they take over
with a drag, click, arrow key or button, rotation stops for good, following
the WAI-ARIA carousel pattern. It is off under `prefers-reduced-motion`.

## Reduced motion

Turns land in one frame with no curl, and there are no hover peeks. The caption
fades instead of rising. Dragging still works: that motion is the user's own.

## Demos

- **`demo.tsx`** shows five harbour screenprints, designed in Paper and painted
  to canvas at runtime from the same shapes. It ships no image files and
  makes no network requests. That matters: 21st's capture sandbox refuses
  off-origin requests, and a demo that makes one publishes with no video.
- **`demo-section.tsx`** puts the carousel inside a page section at
  `height="560px"`, with Unsplash photos. It's for checking locally, and it
  can't be published as a 21st demo for the same reason.

## Install safety

- The root takes an explicit `height`, never a percentage.
- Every style lives in one scoped `<style>` (`.pcc-*`) with no `@import`, no
  global reset, and no token beyond the five in `dev/styles.css`. The canvas
  and fallback image set `max-width: none` against Preflight.
- If WebGL is missing, the program fails to compile, or every image refuses
  CORS, it falls back to a plain `<img>` of the current slide instead of a
  black rectangle. A lost context is rebuilt when it's restored.
- The shader avoids GLSL ES 1.00 reserved words. `flat` and `cast` are both
  reserved, both are natural names in this shader, and either one fails the
  WebGL1 compile. The test scans for them.
