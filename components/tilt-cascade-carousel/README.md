# Tilt Cascade Carousel

A minimal photo carousel. Square photos sit on a slanted line. The one in
front is upright at full size. Each photo after it drops down and to the
right, turns clockwise and shrinks, and each photo before it climbs up and to
the left the other way. When you move through them, the line slides along and
every card swings into place a moment behind it. A title fades in above the
front card, and a small glass pill holds prev, the dots and next.

```tsx
import TiltCascadeCarousel from "@/components/ui/tilt-cascade-carousel"

<TiltCascadeCarousel items={photos} />                              // as in the pen
<TiltCascadeCarousel items={photos} loop autoplay={2800} />         // a slideshow
<TiltCascadeCarousel items={photos} angle={20} drop={0.4} />        // a gentler slant
<TiltCascadeCarousel items={photos} background="#0e0e10" color="#f4f4f5" />
<TiltCascadeCarousel items={photos} height="560px" />               // inside a section
```

```ts
type TiltCascadeItem = { title: string; caption?: string; src?: string; alt?: string }
```

An item without `src` shows a soft gradient, so a missing photo never leaves a
hole.

**No dependencies beyond React.** The original pen used `motion` and
`lucide-react`. This version replaces both with about 40 lines of spring code
and two inline chevrons, so it adds nothing to an installer's `package.json`.

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | — | Required. |
| `height` | `"100svh"` | **Must be a definite length.** |
| `slideSize` | `"clamp(120px, 80vmin, 300px)"` | Width and height of the front card. This is the pen's size. |
| `angle` | `30` | Degrees each step away from the front turns a card. |
| `drop` | `0.5` | How far each step drops a card, as a fraction of the card. |
| `inactiveScale` | `0.6` | Scale of every card that isn't in front. |
| `radius` | `16` | Card corner radius in px. |
| `bounce` / `duration` | `0.2` / `0.8` | Spring feel, in the same terms as `motion`. |
| `loop` | `false` | Wrap past the ends, taking the short way round. |
| `autoplay` | `0` | Milliseconds between moves. `0` is off. |
| `titles` / `captions` / `controls` | `true` | Title above, caption below, and the pill. |
| `background` | a 7% tint of the foreground | Any CSS colour or gradient. |
| `color` | the theme foreground | Text, dots and buttons. The pill and captions are derived from it. |
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
- **Keyboard**: ← → (and ↑ ↓) step, Home and End jump.
- **The pill** has prev, a dot per card (a `04 / 20` counter past 14 cards),
  and next. Without `loop`, the arrows disable at the ends.

## How it moves

All of it is one number, the position, chased by two springs. A stiff spring
slides the line, and a looser one drives the tilt, drop and scale. The tilt
spring chases the slide spring rather than the target, so it trails slightly
and overshoots a little. That is the swing. The pen got the same effect from
`motion` animating the track and each slide with different bounces.

Frames are written straight to each card's `transform`, with no React render
per frame, and the loop stops once both springs settle. Cards more than six
steps out are hidden.

Autoplay doesn't pause just because the pointer is resting on the stage. It
pauses while focus is inside the carousel, during a drag, in a hidden tab and
off-screen. Once the visitor drags, clicks, swipes or presses a key, it stops
for good.

**Reduced motion:** moves land in one frame and the title and dots stop
transitioning. Dragging still follows the finger.

## Demos

- **`demo.tsx`**: the pen's ten Unsplash photos, as in the pen.
- **`demo-custom.tsx`**: the same photos with looping autoplay, a gentler
  slant, larger cards, captions and a dark stage.

Both load photos from Unsplash. 21st's capture sandbox refuses off-origin
requests, so its server cover can't be generated. Capture a cover locally from
`npm run dev` and pass it with `--preview` (see CONTRIBUTING §4).

## Install safety

- The root takes an explicit `height`, never a percentage.
- All styles live in one scoped `<style>` (`.tcc-*`) with no `@import`, no
  global reset, and no token beyond those in `dev/styles.css`.
- Photos set `max-width: none` against Preflight and fill their card
  explicitly.

## Credit

Based on the [CodePen pen](https://codepen.io/vii120/pen/wBooYGr) by
[vii120 (Vivi Tseng)](https://codepen.io/vii120). The layout, the swing, the
photos and the title-and-pill design all come from there.
