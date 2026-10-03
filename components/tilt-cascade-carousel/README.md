# Tilt Cascade Carousel

Square cards laid out along a slanted line. The card in front sits upright at
full size. Each card after it drops down and to the right, turns clockwise and
shrinks, and each card before it climbs up and to the left the other way. When
you move through them, the line slides along and every card swings into place
a moment behind it. The title fades in above the card in front, and a caption
appears below it.

It ships ten illustrated travel-journal scenes, drawn in SVG, so
`<TiltCascadeCarousel />` works with no props, no images and no network
requests. The scene on the card in front comes alive:

| Scene | What moves |
|---|---|
| cable car station | the gondola swings on its cable |
| light-colored house | the cat in the window flicks its tail |
| cherry blossoms | petals drift down |
| bottles of drinks | the ramune fizzes |
| tree-lined road | the low sun glows |
| train window view | telegraph poles and hedges stream past |
| sunlight streams | the light breathes and dust motes float |
| seagulls | the gulls flap |
| pink flowers | a flower nods and a butterfly passes by |
| paddleboarding | the water drifts and the paddle sends out rings |

```tsx
import TiltCascadeCarousel from "@/components/ui/tilt-cascade-carousel"

<TiltCascadeCarousel />                                         // the ten scenes
<TiltCascadeCarousel items={photos} />                          // your own photos
<TiltCascadeCarousel items={trip} loop autoplay={2600} />       // a slideshow
<TiltCascadeCarousel angle={22} drop={0.62} radius={28} />      // a different slant
<TiltCascadeCarousel height="560px" />                          // inside a section
```

```ts
type TiltCascadeItem = {
  title: string
  caption?: string
  src?: string          // your own image; without it the card draws `art`
  alt?: string
  art?: "cable-car" | "house" | "blossoms" | "bottles" | "avenue"
      | "train-window" | "sunbeams" | "seagulls" | "pink-flowers" | "paddleboard"
}
```

**No dependencies beyond React.** The original pen used `motion` and
`lucide-react`. This version replaces both with about 40 lines of spring code
and two inline chevrons, so it adds nothing to an installer's `package.json`.

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | ten drawn scenes | `src` for a photo; otherwise `art`, which defaults to the scenes in order. |
| `height` | `"100svh"` | **Must be a definite length.** |
| `slideSize` | `"clamp(120px, 80vmin, 300px)"` | Width and height of the card in front. |
| `angle` | `30` | Degrees each step away from the front turns a card. |
| `drop` | `0.5` | How far each step drops a card, as a fraction of the card. |
| `inactiveScale` | `0.6` | Scale of every card that isn't in front. |
| `radius` | `16` | Card corner radius in px. |
| `bounce` / `duration` | `0.2` / `0.8` | Spring feel, in the same terms as `motion`. |
| `loop` | `false` | Wrap past the ends, taking the short way round. |
| `autoplay` | `0` | Milliseconds between moves. `0` is off. |
| `titles` / `captions` / `controls` | `true` | Title above, caption below, and the prev / dots / next pill. |
| `background` | a 7% tint of the foreground | Any CSS colour or gradient. |
| `color` | the theme foreground | Text, dots and buttons. Captions and the pill are derived from it. |
| `fontFamily` | Bricolage Grotesque, then system sans | |
| `fontHref` | `null` | A stylesheet for `fontFamily`, loaded with a `<link>`. Nothing loads by default. |
| `index` / `defaultIndex` / `onIndexChange` | — / `3` / — | Controlled or uncontrolled. |
| `onSelect` | — | Clicking, or pressing Enter on, the card that's already in front. |
| `ariaLabel` / `className` | `"Photo carousel"` / `""` | |

## Interaction

- **Drag or swipe** anywhere. The line follows your finger, and the cards'
  tilt chases it. A flick carries on for up to three cards. Past either end
  the line follows at a third of the speed and springs back.
- **Click a card** to bring it to the front. Click the one in front to call
  `onSelect`.
- **Trackpad swipes sideways** step through the cards. The vertical wheel is
  left alone, so the page still scrolls.
- **Keyboard**: ← → (and ↑ ↓) step, Home and End jump. Focus the stage first.
- **The pill**: prev, a dot per card (a `04 / 20` counter past 14 cards), next.
  Without `loop`, the arrows disable at the ends.

## How it moves

All of it is one number, the position, chased by two springs. A stiff spring
(damping `1 − bounce/2`) slides the line, and a looser one (`1 − bounce`)
drives the tilt, drop and scale. The tilt spring chases the slide spring, not
the target, so it trails it slightly and overshoots a little. That is the
swing. In the original this came from `motion` animating the track and each
slide separately with different bounces.

Frames are written straight to each card's `transform`, with no React render
per frame, and the loop stops once both springs settle. Cards more than six
steps out are hidden. Scene animations run only on the card in front.

Autoplay doesn't pause just because the pointer is resting on the stage. On a
full-bleed hero the pointer almost always is. It pauses while focus is inside
the carousel, during a drag, in a hidden tab and off-screen. Once the visitor
drags, clicks, swipes or presses a key, it stops for good.

## Reduced motion

Moves land in one frame, scenes stand still, and the title and dots stop
transitioning. Dragging still follows the finger, because that motion is the
visitor's own.

## Demos

- **`demo.tsx`**: the ten drawn scenes, as shipped.
- **`demo-custom.tsx`**: new titles and captions over the scenes, a steeper
  slant, looping autoplay and an evening gradient. Everything here comes from
  props.
- **`demo-original.tsx`**: the pen's own Unsplash photos, Bricolage Grotesque
  font and `#ececec` page. **Local check only.** 21st's capture sandbox
  refuses off-origin requests, so it can't be published as a demo.

## Install safety

- The root takes an explicit `height`, never a percentage.
- All styles live in one scoped `<style>` (`.tcc-*`) with no `@import`, no
  global reset, and no token beyond those in `dev/styles.css`. Colours are
  derived from `currentColor`, so the pill and captions follow `color` and
  work on any background.
- Images and scene SVGs set `max-width: none` against Preflight and fill their
  card explicitly.
- SVG ids are prefixed per instance with `useId`, so two carousels on one page
  don't share gradients.

## Credit

Based on the [CodePen pen](https://codepen.io/vii120/pen/wBooYGr) by
[vii120 (Vivi Tseng)](https://codepen.io/vii120). The slanted layout, the
spring-driven swing and the title-and-dots design come from that pen.
