# Blueprint Ink Reveal

A drafting plate: a word drawn as a hairline outline with registration ticks,
ruled on all four edges. Moving the pointer across it reveals the solid letters
underneath through an organic ink blot.

```tsx
import BlueprintInkReveal from "@/components/ui/blueprint-ink-reveal"

<BlueprintInkReveal wordmark="STUDIO" inkRadius={150} />
```

**No dependencies beyond React, and no network requests.** Both plates are
drawn to an offscreen canvas at runtime, so there is no image or font to ship.

## Props

| Prop | Default | Description |
|---|---|---|
| `wordmark` | `"BLUEPRINT"` | The word drawn as outline and revealed as solid |
| `inkRadius` | `150` | Radius of the ink reveal, in screen pixels |
| `showCoordinates` | `true` | The drafting-style X/Y readout in the top right |
| `className` | `""` | Extra root class names |

The component sizes to its own 1000×300 aspect, so drop it wherever the band
belongs. It began life wrapped in a footer — link columns, a subscribe form,
an address block, socials, a logo mark and a copyright bar. All of that was
scaffolding around the one thing worth shipping.

## The plate

Sized from the plate's **height**, then condensed horizontally to fill its
width. Sizing from the width instead leaves short letters stranded in a tall
band, because a normal grotesque is far wider per cap-height than drafted
forms. Registration ticks sit **on** the letters, at each one's corners and
edge midpoints, with a centre cross on round glyphs. Rulers run along all four
edges and a cross marks each corner. Rendered at 2x so the hairlines stay crisp.

An earlier pass put construction boxes *around* each letter plus dimension
lines, arrowheads and a size annotation. That is more drawing, not more
drafting: the detail belongs on the letterforms, and the surround stays quiet.

## Both plates share one SVG

They were once two elements: a plain `<img>` sized to the container, and an
`<image>` inside this viewBox. The container is 4:1 and the viewBox 3.33:1, so
`preserveAspectRatio` letterboxed one and not the other — the solid letters
painted **96px inset and 192px narrower** than the outline they are meant to
fill, which reads as the reveal showing the wrong letters.

Both are now `<image>` elements in the same `<svg>` at identical geometry, and
the canvas is drawn at exactly `VIEW_W x VIEW_H` so neither is letterboxed.
Coincident by construction rather than by matching numbers in two places.

## How the ink is positioned

The ink layer is an SVG with `viewBox="0 0 1000 300"` and
`preserveAspectRatio="xMidYMid meet"`, so the container padding and the
letterbox both sit between the pointer and that coordinate space.

Measuring the pointer against the container and scaling by its width — the
mapping you would use for a full-bleed `preserveAspectRatio="none"` box — put
the ink **208px from the cursor at the edges** while looking correct dead
centre. That is the shape of error that makes a hover feel haunted rather than
broken.

It now asks the SVG for its own screen matrix:

```tsx
const p = svg.createSVGPoint()
p.x = e.clientX; p.y = e.clientY
const v = p.matrixTransform(svg.getScreenCTM().inverse())  // viewBox units
```

Exact by construction, and it stays exact through padding, letterboxing, page
zoom and scroll. Measured after: **0px** at 1440, 900 and 420 wide.

Two details follow from it:

- **`inkRadius` is in screen pixels**, so it is divided by the same scale
  (`getScreenCTM().a`) before reaching the mask. Without that the blot grows
  and shrinks with the viewport.
- **Coordinates are deliberately unclamped.** Clamping to the viewBox parks the
  blot on the plate's edge when the cursor is outside it — the same "it is not
  where I am pointing" complaint in a smaller form.

## The spring settles

The follow is a lerp, which only asymptotes. Left alone it allocated new state
every frame for the life of the component and re-rendered at 60fps while idle.
It now snaps the last sub-pixel and stops the loop until the pointer changes
something — verified at **0 mutations per second** while idle.

Animation state lives in refs rather than in the `setState` updaters: a flag
set inside an updater is read during React's render phase, so a frame checking
it still sees the initial value and the loop quits after one step.

## Install safety

- The root takes no percentage height; inner `h-full` sits inside
  `absolute inset-0` parents that have a definite one.
- Every rule is a Tailwind utility — no `<style>` block, no `@import`, no
  global reset.
- Honours `prefers-reduced-motion`: the spring lag and radius ramp are skipped,
  so the reveal tracks the cursor directly instead of easing.
- Nothing is fetched, and no bitmap is embedded. The test asserts the component
  and demo contain no URL other than the SVG namespace.
