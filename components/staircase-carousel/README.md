# Staircase Carousel

A minimal photo carousel laid out as a staircase. The chosen photo sits level
at full size, with its title beside it. Every photo before it steps up a whole
storey and every photo after it steps down one, each shrunk to 80%. When you
move, the strip slides along on a spring, the photos ease up or down to their
new step, and the title pops out with a blur as the next one pops in.

```tsx
import StaircaseCarousel from "@/components/ui/staircase-carousel"

<StaircaseCarousel items={photos} />                                  // as in the pen
<StaircaseCarousel items={photos} step={0.55} inactiveScale={0.7} />  // a gentler staircase
<StaircaseCarousel items={photos} radius={14} titleSize="28px" />
<StaircaseCarousel items={photos} background="#101012" color="#f4f4f5" />
```

```ts
type StaircaseItem = { title: string; src?: string; alt?: string }
```

An item without `src` shows a soft gradient.

**No dependencies beyond React.** The pen used `motion` for the strip's
spring, the steps and `AnimatePresence` for the titles, plus `lucide-react`
for the chevrons. Here:

- the strip's spring is computed once and handed to CSS as a `linear()`
  easing;
- the steps are CSS transitions on the pen's `ease-in-out`;
- the titles are keyframe animations, with the outgoing title kept on screen
  until its exit finishes.

No JavaScript runs per frame.

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | — | Required. |
| `height` | `"100svh"` | **Must be a definite length.** |
| `slideWidth` | `"clamp(120px, 20vw, 240px)"` | Photos are 3:4. |
| `inactiveScale` | `0.8` | Scale of every photo that isn't chosen. |
| `step` | `1` | How far each side steps, as a fraction of a photo's height. |
| `radius` | `0` | Photo corner radius, in px. |
| `bounce` / `duration` | `0.1` / `0.8` | The strip's spring. |
| `stepDuration` | `0.6` | Seconds for a photo to change step. |
| `titles` / `titleSize` | `true` / `"20px"` | The chosen photo's title, beside it. |
| `controls` | `true` | The pill. |
| `background` / `color` | a 7% tint / the theme foreground | |
| `fontFamily` / `fontHref` | Bricolage Grotesque, then system sans / `null` | Nothing loads unless you pass `fontHref`. |
| `index` / `defaultIndex` / `onIndexChange` | — / `2` / — | Controlled or uncontrolled. |
| `onSelect` | — | Clicking the photo that's already chosen. |
| `ariaLabel` / `className` | `"Photo carousel"` / `""` | |

## Interaction

Click a photo, use the dots or the arrows, swipe sideways, or use ← → /
Home / End once the stage has focus.

## Details

- **The title sits behind the photos**, as in the pen, at `z-index: -1`. In
  the pen the page background sat behind that. Inside a component, the root's
  own background would cover it, so the root uses `isolation: isolate` to keep
  the title between the background and the photos.
- **On phones** there's no room beside the photo, so below 640px the title
  moves underneath it at 15px. That spot is free because the next photo is a
  step down and over.
- **Reduced motion:** the strip and steps jump, and the title swaps without
  popping.

## Demos

- **`demo.tsx`**: the pen's ten Unsplash photos.
- **`demo-custom.tsx`**: a gentler staircase (half-storey steps, smaller side
  photos), rounded corners, a bigger title and a dark stage.

Both load photos from Unsplash, which 21st's capture sandbox blocks. Capture
a cover locally from `npm run dev` and pass it with `--preview`.

## Install safety

- The root takes an explicit `height`.
- All styles live in one scoped `<style>` (`.stc-*`) with no `@import`, no
  global reset, and no token beyond those in `dev/styles.css`.
- Photos set `max-width: none` against Preflight.

## Credit

Based on a [CodePen pen](https://codepen.io/vii120) by
[vii120 (Vivi Tseng)](https://codepen.io/vii120). The staircase, the title
pop, the photos and the pill come from there.
