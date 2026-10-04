# Disc Cascade Carousel

A film catalogue told in printed discs. The discs sit on a slanted line that
climbs out of the page toward you. The chosen film is in the middle. The ones
before it shrink away down to the left, and the next one looms large, half off
the top right. When you move, the line slides, every disc rolls like a wheel
and swings into its new pose a moment behind. An editorial credits block
(title, directors, year, cast) and two press quotes change over with it. A
wordmark, nav links and an **Index** menu that jumps to any title sit on top.

Built on the [Tilt Cascade Carousel](../tilt-cascade-carousel) engine: the
same two-spring position, drag/flick and wheel handling, now in 3D.

```tsx
import DiscCascadeCarousel from "@/components/ui/disc-cascade-carousel"

<DiscCascadeCarousel items={films} brand="Lumen" nav={[{ label: "Films" }, { label: "Television" }]} />
<DiscCascadeCarousel items={films} loop autoplay={3600} />                 // a slideshow
<DiscCascadeCarousel items={films} depth={0.2} yaw={0} fan={0} />          // flatter, face-on
<DiscCascadeCarousel items={films} spin={0} roll={0} sheen={0} />          // still discs
<DiscCascadeCarousel items={films} background="#0b0b0d" color="#ecebe7" />
<DiscCascadeCarousel items={films} height="640px" discSize="300px" />      // inside a section
```

```ts
type DiscCascadeItem = {
  title: string
  credits?: { label: string; value: string | string[] }[]   // "Year" also feeds the Index menu
  reviews?: { source: string; quote: string; stars?: number }[]  // first two are shown
  src?: string                // label art; without it the label is generated
  alt?: string
  pattern?: "sunburst" | "rings" | "halftone" | "horizon" | "stripes" | "eclipse" | "mosaic"
  palette?: [string, string, string]  // ground, figure, accent
  label?: string              // print on the disc, defaults to title ("" for none)
  labelStyle?: "arc" | "block"
  ink?: string                // print colour, defaults to black/white by contrast
  fine?: string               // rim fine print, defaults to the credits
}
```

**No assets and no dependencies beyond React.** Without `src` each label is
drawn as SVG from one of seven patterns: a sunburst, rings, halftone, a tree
line at dusk, stripes, an eclipse, or a tile mosaic. Each takes your palette
and is seeded by position, so it renders the same on the server and the
client. The title is set on an arc or stacked above the hub. The credits run
round the rim as fine print, and the `brand` is stamped under the hole. The
hub (clear clamping ring, stacking ridge, mirror band) is drawn on top. The
hole is a real mask, so the page shows through it.

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | — | Required. |
| `height` | `"100svh"` | **Must be a definite length.** |
| `discSize` | `clamp(170px, min(50vmin, 38vw), 420px)` | Diameter of the chosen disc. |
| `spacing` / `rise` / `depth` | `1.02` / `0.24` / `0.42` | Each step along, up and toward you, as fractions of the disc. |
| `yaw` / `fan` / `tilt` | `22` / `-10` / `-6` | Turn of the chosen disc, extra turn per step, and lean, in degrees. |
| `roll` | `110` | Degrees a disc rolls per step travelled. |
| `spin` | `24` | Seconds per idle turn of the chosen disc. `0` stops it. |
| `sheen` | `0.6` | Strength of the glint that sweeps as discs move and follows the mouse. |
| `bounce` / `duration` | `0.22` / `0.9` | Spring feel, in `motion`'s terms. |
| `loop` / `autoplay` | `false` / `0` | Wrap past the ends. Milliseconds between moves, `0` is off. |
| `brand` | `""` | Wordmark at the top centre, also stamped on generated labels. |
| `nav` / `navActive` | `[]` / `0` | `{ label, href? }` links beside the wordmark. The current one gets a dot. |
| `indexLabel` | `"Index"` | The jump-to menu. `""` hides it. |
| `details` / `reviews` / `controls` / `frame` | `true` | Credits block, press quotes, prev/counter/next, and the hairline frame. |
| `hint` | `"Drag to browse"` | Bottom-left. `""` hides it. |
| `background` / `color` | a 5% tint / theme foreground | Any CSS colour or gradient. Hairlines and the menu are derived from them. |
| `serif` / `sans` / `display` | Instrument Serif / Inter / Oswald, then system fallbacks | Headline and quotes / UI / disc print. |
| `fontHref` | `null` | A stylesheet for those fonts, loaded with a `<link>`. Nothing loads by default. |
| `index` / `defaultIndex` / `onIndexChange` | — / `2` / — | Controlled or uncontrolled. |
| `onSelect` | — | Clicking, or pressing Enter on, the disc that's already chosen. |
| `ariaLabel` / `className` | `"Film catalogue"` / `""` | |

## Interaction

- **Drag or swipe** anywhere. The line follows your finger and the discs
  swing after it. A flick carries on for up to three discs. Past either end
  the line follows at a third of the speed and springs back.
- **Click a disc** to bring it to the middle. Click the chosen disc to call
  `onSelect`. Hovering it lifts it toward you.
- **Mouse**: the chosen disc leans toward the pointer and every disc's glint
  turns with it. Touch never triggers this.
- **Trackpad swipes sideways** step through. The vertical wheel is left to the
  page.
- **Keyboard**: ← → (and ↑ ↓) step, Home and End jump, Escape closes the menu.
- **Index menu** lists every title (number, title, year) and jumps to it.

## How it moves

One number, the position, is chased by two springs. A stiff one slides the
line. A looser one, chasing the first, drives each disc's depth, turn and
roll, so they trail a little and overshoot: that's the swing. Frames are
written straight to each disc's `transform` and two CSS variables (roll and
glint). React doesn't render per frame, and the loop stops once both springs
settle. Discs fade out four steps down the line, and the ones coming at you
stop approaching so perspective can't blow up.

Autoplay pauses while focus is inside the carousel, during a drag, while the
menu is open, in a hidden tab and off-screen. Once the visitor interacts it
stops for good.

**Reduced motion:** moves land in one frame. The idle spin, the credits
change-over and all transitions are off. Dragging still follows the finger.

## Demos

- **`demo.tsx`**: a made-up studio's seven films, every label generated. It
  loads nothing, so 21st's server cover can capture it.
- **`demo-photos.tsx`**: a record catalogue with Unsplash photos as labels, a
  dark stage, looping autoplay and Google Fonts via `fontHref`. 21st's capture
  sandbox refuses off-origin requests, so this one needs a local cover (see
  CONTRIBUTING §4).

## Install safety

- The root takes an explicit `height`, never a percentage.
- All styles live in one scoped `<style>` (`.dcc-*`). No `@import`, no global
  reset, and no token beyond those in `dev/styles.css`.
- Label images and SVGs set `max-width: none` against Preflight.
- SVG gradient and arc ids come from `useId`, so two carousels on one page
  don't collide.
- Disc titles are pinned with `textLength`, so a wide fallback font squeezes
  rather than spilling past the rim when the display font isn't loaded.
