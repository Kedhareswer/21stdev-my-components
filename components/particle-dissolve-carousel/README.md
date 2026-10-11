# Particle Dissolve Carousel

An image carousel made of dust. Change slides and the picture comes apart:
a wave crosses it, every grain lifts off carrying its own colour, rides a
drifting flow field, then turns and settles back into place as a grain of the
next picture. At rest the picture keeps shedding a little dust, and a flick of
the pointer drags a wake of loose grains behind it.

```tsx
import ParticleDissolveCarousel from "@/components/ui/particle-dissolve-carousel"

<ParticleDissolveCarousel items={items} />                              // full-bleed hero
<ParticleDissolveCarousel items={items} autoplay={5000} />              // with a timer
<ParticleDissolveCarousel items={items} height="560px" overlay={false} /> // inside a section, picture only
<ParticleDissolveCarousel items={items} pattern="radial" glow={1} dust={0.8} scatter={1.5} /> // embers
<ParticleDissolveCarousel items={items} dust={0} push={0} />            // still at rest, dissolves only
```

```ts
type ParticleDissolveItem = { src: string; title?: string; caption?: string; eyebrow?: string; alt?: string }
```

**No dependencies beyond React.** Raw WebGL2, one file, no CSS file, no Tailwind.

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | — | Required. `src` must be CORS-enabled, same-origin, or a `data:` URL. |
| `height` | `"100svh"` | Total height. **Must be a definite length.** |
| `particles` | `160000` | Most grains on the stage. A small stage uses fewer (one per ~6 CSS px²); a device that can't keep up uses half. |
| `duration` | `2600` | Milliseconds from the first grain lifting to the last one landing. |
| `pattern` | `"sweep"` | The wave's shape. `"sweep"` crosses from the edge the slides move from, `"radial"` breaks out from a point, `"scatter"` goes everywhere at once. A click always ripples out from where it lands (except `"scatter"`). |
| `scatter` | `1` | How far grains fly. |
| `turbulence` | `1` | How hard the flow field curls them. |
| `glow` | `0.6` | How brightly grains burn in flight, plus the flare as the picture lets go. `0` is flat colour. |
| `dust` | `0.35` | How much dust the picture sheds at rest. `0` keeps it perfectly still. |
| `push` | `1` | How hard pointer momentum drags loose grains. `0` turns it off. |
| `backdrop` | `"#08080A"` | The void behind the picture while it's in pieces. Hex. |
| `autoplay` | `0` | Milliseconds between dissolves. `0` is off. |
| `loop` | `true` | Wrap past the ends. |
| `overlay` | `true` | Eyebrow, title, caption, counter, progress bars and the up-next card. |
| `index` / `defaultIndex` / `onIndexChange` | — | Controlled or uncontrolled. |
| `className` | `""` | Appended to the root. |

## Interaction

- **The up-next card** shows the next picture. Press it and the current one dissolves into it, sweeping in from the right. **←** goes back, sweeping from the left.
- **Click or tap the picture** to dissolve into the next slide, rippling out from where you pressed.
- **Progress bars** jump to any slide. **Arrow keys** work when the stage has focus.
- **Move the pointer** and nearby grains are dragged with its momentum, then spring home.
- Asking for another slide mid-dissolve doesn't cut the running one. It lands, then the newest request starts straight away.

## How it works

The stage is covered by a grid of grains, one per cell, each jittered inside
its cell. Each grain's state (offset from home, velocity, age) lives in GPU
buffers and is stepped every frame by a vertex shader whose output is written
back with **transform feedback**. The same pass draws the grain, so the whole
simulation is one draw call.

Every place on the stage has an **order** in the wave: its distance from the
edge or point, plus smooth noise for a ragged front, plus a per-cell speck so it
frays like sand. From the dissolve's progress, each grain gets its own timeline:

| Grain's timeline | What happens |
|---|---|
| 0 → 0.04 | The grain fades in over its home, the same colour as the picture under it |
| 0.04 → 0.08 | Its place in the picture goes dark and the grain lifts off |
| 0.08 → 0.42 | Flight: flow field, the wave's wind and a little lift. Colour shifts toward the new picture |
| 0.42 → 0.9 | Drawn home on an ease. Its flight is dropped at 0.9, so it rests exactly where it landed |
| 0.86 → 1 | The new picture fades in under it and the grain fades out |

The picture underneath runs the **same timeline code** (one shared GLSL block),
so a grain lifts off exactly where the old picture goes dark and lands exactly
where the new one appears. At progress 1 every grain is home whatever its order,
so swapping the slide underneath is invisible. The test checks that.

## It stops when it's still, and adapts when it can't keep up

- **At rest**, grains that haven't been knocked loose are drawn at point size 0, so most of the stage costs nothing. With `dust={0}` the loop stops entirely 2.5s after the pointer does.
- **Off screen or in a hidden tab** the loop stops, and autoplay pauses.
- **A frame-time watchdog** watches the first busy frames. If the device can't keep up, it switches once to half the grains at 1× pixel density.
- **A dissolve follows the clock**, not the frame count, so a slow device still lands it on time.

## Autoplay

The current progress bar, the up-next card's timer and a hidden clock share one
duration and one pause state, so what fills is exactly what fires. Resting the
pointer on the picture doesn't pause it (on a full-bleed hero the pointer is
always there). The controls, focus, a hidden tab or scrolling it away do. Any
tap, key, bar or button stops rotation for good. It's off under
`prefers-reduced-motion`.

## Reduced motion

No grains, no dust, no pointer drag. A slide change is a 420ms cross-fade, and
the title fades instead of gathering letter by letter.

## Install safety

- The root takes an explicit `height`, never a percentage.
- All styles live in one scoped `<style>` (`.pdc-*`). The overlay sits on the picture, so its text is white on a scrim in both themes. The only token it reads is `--color-background` (behind the canvas while it loads) and `--color-primary` (stage focus ring).
- The canvas and the up-next thumbnail override Preflight's `max-width: 100%`; the thumbnail has explicit `width`/`height`.
- Without WebGL2 it cross-fades plain images instead of showing a black rectangle. A lost context is rebuilt when it's restored.
- Every shader opens with `#version 300 es` on its first line, and no GLSL ES 3.00 reserved word is used as an identifier. The test checks both.
- The demos paint their pictures at runtime, so they make no network requests. 21st's capture sandbox refuses them, and a demo that makes one publishes with no video.
