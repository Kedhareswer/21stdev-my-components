# Arc Card Carousel

Photo cards hung on the rim of a big wheel whose hub sits off the left edge,
so only a gentle arc of them shows. The card on the wheel's equator lies flat.
Every card above it tips back and every card below tips forward, each turned
to face the hub. Every few seconds the wheel rolls one card: the next card
swings down from the top and settles flat while the rest ride the rim.

```tsx
import ArcCardCarousel from "@/components/ui/arc-card-carousel"

<ArcCardCarousel items={photos} />                       // as in the reference
<ArcCardCarousel items={photos} autoplay={0} />          // still until moved
<ArcCardCarousel items={photos} step={18} duration={1} /> // a tighter, quicker wheel
<ArcCardCarousel items={photos} height="640px" />        // inside a section
```

```ts
type ArcCardItem = { src: string; alt?: string }
```

**Dependency: `gsap`** (declared in the root `package.json`). It tweens the
wheel's position with a `power2.inOut` ease.

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | — | Required. Lists shorter than ten are repeated round the rim, so the wrap always happens off screen. |
| `height` | `"100svh"` | **Must be a definite length.** |
| `autoplay` | `3200` | Milliseconds between steps. `0` is off. |
| `step` | `14` | Degrees of the wheel between neighbouring cards. |
| `duration` | `1.7` | Seconds one step takes. |
| `radius` | `10` | Card corner radius in px. |
| `defaultIndex` / `onIndexChange` | `0` / — | The flat card. |
| `ariaLabel` / `className` | `"Photo carousel"` / `""` | |

## Geometry

Measured off the reference at 680 px tall and kept as fractions of the stage
height: the flat card is 0.30 of the height wide (1.65 : 1), its centre sits
0.284 in from the left edge and 0.475 down, and the hub is 0.71 of the height
behind it. On a stage narrower than 0.47 of its height, everything shrinks to
fit the width.

## Interaction

- **Autoplay** rolls the wheel down one card at a time. It pauses while focus
  is inside, during a drag, in a hidden tab and off-screen. Resting the pointer
  on the stage doesn't pause it. Any drag, click or key stops it for good.
- **Drag** up or down: the wheel follows the pointer one card per card-height
  of travel, and a flick carries on for up to two cards.
- **Click** a card to roll it flat by the short way round.
- **Keyboard**: ↑ ↓ (and ← →) step.
- The vertical wheel is left to the page, so it still scrolls.

**Reduced motion:** no autoplay, and steps land in one frame.

## Demo

`demo.tsx` inlines ten free Unsplash photos as small WebP data URIs (about
100 KB in all), so it fetches nothing off-origin and 21st's capture sandbox can
render it. The photos are under the Unsplash License, and each one's
`unsplash.com/photos/…` ID is in a comment above it.

## Install safety

- The root takes an explicit `height`, never a percentage.
- All styles live in one scoped `<style>` (`.acc-*`) with no `@import`, no
  global reset, and no token beyond those in `dev/styles.css`.
- Photos set `max-width: none` against Preflight and fill their card.
- Frames are written straight to each card's `transform`; React renders only
  when the flat card changes.

## Credit

Motion and layout follow a Pinterest video by The Bite Creative
([pin 920563980091377064](https://www.pinterest.com/pin/920563980091377064/)).
The photos and code are new.
