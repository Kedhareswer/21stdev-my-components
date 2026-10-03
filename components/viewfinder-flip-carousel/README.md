# Viewfinder Flip Carousel

A minimal photo carousel built around a viewfinder frame. Only the photo in
the frame lies flat. Every other photo is folded away on its side, turned a
quarter round and tipped back in perspective, so the strip reads as a thin
stack of edges on either side. Moving opens the next photo out of the stack
and folds the last one away, and the frame gives a small pulse as it lands.

```tsx
import ViewfinderFlipCarousel from "@/components/ui/viewfinder-flip-carousel"

<ViewfinderFlipCarousel items={photos} />                                   // as in the pen
<ViewfinderFlipCarousel items={photos} titles />                            // with the open title
<ViewfinderFlipCarousel items={photos} size={260} openWidth={380} />        // bigger
<ViewfinderFlipCarousel items={photos} frame={false} lockWhileMoving={false} />
```

```ts
type ViewfinderFlipItem = { title: string; src?: string; alt?: string }
```

An item without `src` shows a soft gradient.

**No dependencies beyond React.** The pen used `motion` for the strip's
spring, the fold tween and the frame pulse, plus `lucide-react` for the
chevrons. Here the spring is a CSS `linear()` easing computed once, the fold
is a CSS transition on the pen's own `cubic-bezier(1, -0.03, 0.413, 0.965)`,
and the pulse is a keyframe animation that restarts on each change. No
JavaScript runs per frame.

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | — | Required. |
| `height` | `"100svh"` | **Must be a definite length.** |
| `size` | `200` | Side of each square photo, in px. |
| `foldedWidth` / `openWidth` | `70` / `300` | Space a folded or open photo takes in the strip, in px. |
| `tilt` / `roll` | `60` / `90` | How far a folded photo tips back and turns on its side, in degrees. |
| `radius` | `8` | Photo corner radius, in px. The frame follows it. |
| `frame` | `true` | The pulsing frame. |
| `duration` / `bounce` | `0.8` / `0.2` | Fold time, and the strip spring's bounce. |
| `lockWhileMoving` | `true` | Ignore input until a move lands, as the pen does. |
| `titles` | `false` | The open photo's title, above the pill. |
| `controls` | `true` | The pill. |
| `background` / `color` | a 7% tint / the theme foreground | The frame uses `color`. |
| `fontFamily` / `fontHref` | Bricolage Grotesque, then system sans / `null` | |
| `index` / `defaultIndex` / `onIndexChange` | — / `3` / — | Controlled or uncontrolled. |
| `onSelect` | — | Clicking the photo that's already open. |
| `ariaLabel` / `className` | `"Photo carousel"` / `""` | |

## Interaction

Click a folded photo to open it, use the dots or the arrows, swipe sideways,
or use ← → / Home / End once the stage has focus.

## How the fold works

The geometry is the pen's. Every holder sits in its own `perspective: 800px`
slot. A photo before the open one gets `rotateY(60deg) rotateZ(90deg)` and a
70px slot, a photo after it gets the mirror, and the open photo gets 300px
and no rotation.

Because only the open photo is wider than 70px, the strip only ever needs to
move by `70 × index` to put the open photo in the frame. Stacking order falls
off with distance from the open photo, so nearer edges cover farther ones.

## Demos

- **`demo.tsx`**: the pen's ten Unsplash photos.
- **`demo-custom.tsx`**: bigger photos, a tighter stack, rounder corners,
  titles and a dark stage.

Both load photos from Unsplash, which 21st's capture sandbox blocks. Capture
a cover locally from `npm run dev` and pass it with `--preview`.

## Install safety

- The root takes an explicit `height`.
- All styles live in one scoped `<style>` (`.vfc-*`) with no `@import`, no
  global reset, and no token beyond those in `dev/styles.css`.
- Photos set `max-width: none` against Preflight.
- With reduced motion, the strip and fold jump, the frame doesn't pulse, and
  the input lock is skipped.

## Credit

Based on a [CodePen pen](https://codepen.io/vii120) by
[vii120 (Vivi Tseng)](https://codepen.io/vii120). The fold, the frame pulse,
the photos and the pill come from there.
