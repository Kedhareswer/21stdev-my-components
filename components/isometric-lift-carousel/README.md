# Isometric Lift Carousel

A minimal 3D photo carousel. Portrait photos stand on edge in a tilted row,
seen from above and to the side like cards in a file box. The chosen photo
widens and lifts out of the row on a spring. A small glass pill underneath
holds prev, the dots and next.

```tsx
import IsometricLiftCarousel from "@/components/ui/isometric-lift-carousel"

<IsometricLiftCarousel items={photos} />                              // as in the pen
<IsometricLiftCarousel items={photos} titles />                       // with the chosen title
<IsometricLiftCarousel items={photos} rotateY={40} lift={120} />      // a shallower turn
<IsometricLiftCarousel items={photos} background="#101012" color="#f4f4f5" />
```

```ts
type IsometricLiftItem = { title: string; src?: string; alt?: string }
```

An item without `src` shows a soft gradient.

**No dependencies beyond React.** The pen used `motion` for the spring and
`lucide-react` for the chevrons. Here the spring is computed once and handed
to CSS as a `linear()` easing, so the browser runs it and no JavaScript runs
per frame. The chevrons are inline SVG.

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | — | Required. |
| `height` | `"100svh"` | **Must be a definite length.** |
| `cardWidth` / `activeWidth` | `clamp(80px, 10vw, 120px)` / `clamp(120px, 15vw, 180px)` | Standing and lifted widths. Cards are 3:4. |
| `lift` | `150` | How far the chosen card rises, in px. |
| `gap` | `12` | Space between cards, in px. |
| `tiltX` / `rotateY` | `-10` / `50` | The row's tilt, in degrees. |
| `radius` | `0` | Card corner radius, in px. |
| `bounce` / `duration` | `0.25` / `0.6` | The spring, in `motion`'s terms. |
| `titles` | `false` | The chosen card's title, above the pill. |
| `controls` | `true` | The pill. |
| `background` / `color` | a 7% tint / the theme foreground | |
| `fontFamily` / `fontHref` | Bricolage Grotesque, then system sans / `null` | Nothing loads unless you pass `fontHref`. |
| `index` / `defaultIndex` / `onIndexChange` | — / `2` / — | Controlled or uncontrolled. |
| `onSelect` | — | Clicking the card that's already lifted. |
| `ariaLabel` / `className` | `"Photo carousel"` / `""` | |

## Interaction

Click a card, use the dots or the arrows, swipe sideways, or use ← → / Home /
End once the stage has focus.

## How the 3D works

This is the pen's geometry, unchanged. The row is turned once with
`rotateX(-10deg) rotateY(50deg)`, and each card is turned a quarter round
inside it with `rotateY(-90deg)`, so the photos face you at an angle.

Each slot is pushed toward the viewer by `translateZ((n − i) × 20px)`. Without
that, every card's left edge sits behind its neighbour in 3D and can't be
clicked. The slots also have zero height, so the empty space around a turned
card can't intercept clicks.

The row sits in a zero-width centring box, so on a phone, where it's wider
than the screen, it overflows both sides evenly instead of only the right. It
is also scaled to 85% below 640px.

## Demos

- **`demo.tsx`**: the pen's eight Unsplash street photos.
- **`demo-custom.tsx`**: titles on, a shallower turn, rounded corners and a
  dark stage.

Both load photos from Unsplash, which 21st's capture sandbox blocks. Capture
a cover locally from `npm run dev` and pass it with `--preview`.

## Install safety

- The root takes an explicit `height`.
- All styles live in one scoped `<style>` (`.ilc-*`) with no `@import`, no
  global reset, and no token beyond those in `dev/styles.css`.
- Photos set `max-width: none` against Preflight.
- With reduced motion, cards jump instead of springing.

## Credit

Based on a [CodePen pen](https://codepen.io/vii120) by
[vii120 (Vivi Tseng)](https://codepen.io/vii120). The geometry, photos and
pill come from there.
