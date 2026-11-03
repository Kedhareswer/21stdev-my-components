# Arc Card Carousel

Photo cards hung on the rim of a big wheel whose hub sits off the left edge,
so only a gentle arc of them shows. The card on the wheel's equator lies flat.
Every card above it tips back and every card below tips forward, each turned
to face the hub.

The page scroll drives it. The section pins while you scroll through it, and
the wheel rolls one card per stretch of scroll: the next card swings down from
the top and settles flat while the rest ride the rim. When you stop scrolling,
the wheel eases onto the nearest card. Beside the flat card, its number, title
and a line of meta swap in.

```tsx
import ArcCardCarousel from "@/components/ui/arc-card-carousel"

<ArcCardCarousel items={projects} />                    // as in the demo
<ArcCardCarousel items={projects} scrollPerCard={1} />  // a slower roll
<ArcCardCarousel items={photos} caption={false} />      // cards only, as in the reference
<ArcCardCarousel items={projects} height="720px" />     // a shorter pinned stage
```

```ts
type ArcCardItem = { src: string; alt?: string; title?: string; meta?: string }
```

**Dependency: `gsap`** (declared in the root `package.json`). Its
`ScrollTrigger` scrubs the wheel's position and snaps it with a
`power2.inOut` ease.

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | — | Required. Lists shorter than ten are repeated round the rim, so the wrap always happens off screen. |
| `height` | `"100svh"` | Height of the pinned stage. **Must be a definite length.** The section is this tall plus `scrollPerCard` of it per card. |
| `scrollPerCard` | `0.6` | Scroll per card, as a fraction of the stage height. |
| `step` | `14` | Degrees of the wheel between neighbouring cards. |
| `radius` | `10` | Card corner radius in px. |
| `caption` | `true` | The number, title and meta beside the flat card. Left out when no item has a `title`. |
| `loop` | `true` | Scroll forever. Past the last card the wheel comes round to the first, and up past the first to the last. The page can't scroll beyond the section, so use it as the page or a full-screen view. `false` ends at the last card and lets the page carry on. |
| `onIndexChange` | — | Called with the flat card's index. |
| `ariaLabel` / `className` | `"Photo carousel"` / `""` | |

## Geometry

Measured off the reference at 680 px tall and kept as fractions of the stage
height: the flat card is 0.30 of the height wide (1.65 : 1), its centre sits
0.284 in from the left edge and 0.475 down, and the hub is 0.71 of the height
behind it. On a stage narrower than 0.47 of its height, everything shrinks to
fit the width.

The caption sits level with the flat card, just right of it. On a stage
narrower than 640 px (or taller than it is wide), it moves to the bottom over
a fade into the background.

## Interaction

- **Scroll** the page, with a wheel, trackpad, touch, keys or the scrollbar.
  Nothing is hijacked: it's ordinary page scroll, and the stage is
  `position: sticky`.
- **Click** a card (or Tab to it and press Enter) to scroll it flat.
- **Looping:** the section runs one step past the last card, back round to
  the first, so its bottom looks exactly like its top. Reaching the bottom, the
  scroll jumps to the top unseen. At the very top there's no scroll event to
  catch, so a wheel or trackpad scroll up jumps to the bottom instead. A touch
  swipe up at the very top does not wrap.

**Reduced motion:** the wheel follows the scroll exactly, with no smoothing and
no eased snap, and the caption swaps without moving.

## Demo

`demo.tsx` inlines ten free Unsplash photos as small WebP data URIs (about
100 KB in all), so it fetches nothing off-origin and 21st's capture sandbox can
render it. The photos are under the Unsplash License, and each one's
`unsplash.com/photos/…` ID is in a comment above it. The project names are
made up.

## Install safety

- The stage takes an explicit `height`, and the track a multiple of it, never a
  percentage.
- `position: sticky` needs no `overflow: hidden` or `auto` on any ancestor
  between the section and the scrolling page.
- All styles live in one scoped `<style>` (`.acc-*`) with no `@import`, no
  global reset, and no token beyond those in `dev/styles.css`.
- Photos set `max-width: none` against Preflight and fill their card.
- Frames are written straight to each card's `transform`; React renders only
  when the flat card changes.

## Credit

Motion and layout follow a Pinterest video by The Bite Creative
([pin 920563980091377064](https://www.pinterest.com/pin/920563980091377064/)).
The photos, copy and code are new.
