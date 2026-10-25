# Darwaza Preloader

A loading screen and scroll entrance styled after a Jaipur doorway. It has a
hot-pink stucco wall, a cusped Mughal arch framed in powder blue with raised
white plaster acanthus, and a pair of weathered rose doors with brass studs.

## Storyboard

1. **The drawing.** While your page loads, the doorway is drawn as fine white
   linework on the wall: frame, mouldings, arch, doors, then the ornament.
   Scrolling is held during the load.
2. **The paint.** Colour rises from the floor behind a soft wet edge and
   replaces the sketch: blue plaster, white mouldings, rose timber, brass. Each
   plaster ornament swells out of the wall as the paint reaches it.
3. **Pesh karte hain.** At 100 the title settles letter by letter along the
   arch. Two gold rings drop onto the door plates and swing to rest, and a
   "Scroll to enter" cue appears.
4. **The entrance.** Scrolling swings both doors inward in real 3D and lets
   warm light spill out. The camera then walks through the doorway onto your
   page, which waits pinned behind the doors. Once the gate has faded, your
   page scrolls on as normal. Scrolling back up closes the doors again.

**No dependencies.** React is the only import. Every surface is SVG lit by
SVG filters: stucco, plaster relief and wood grain. They are rasterised once,
so the load and the scroll only move transforms and opacity. Nothing is
fetched.

```tsx
import DarwazaPreloader from "@/components/ui/darwaza-preloader"

<DarwazaPreloader>
  <YourPortfolio />
</DarwazaPreloader>

<DarwazaPreloader progress={loaded} onReady={() => warmUp()} onComplete={() => setInside(true)}>
  <YourPortfolio />
</DarwazaPreloader>

<DarwazaPreloader preset="neel" monogram="ns" title="Aaiye Tashreef Laiye" />
```

Click or press Enter while it loads to rush it to 100. Once it is ready, a
click or Enter walks through the doors for you.

## Props

| Prop | Default | |
|---|---|---|
| `children` | — | The page behind the doors. It is pinned while they open, then scrolls on. |
| `progress` | — | Real progress, 0–100. Leave it out to simulate over `durationMs`. |
| `durationMs` | `6400` | Length of the simulated load. |
| `scrollDistance` | `1.6` | How much scrolling opens the doors, in gate heights. |
| `lockScroll` | `true` | Hold the page's scroll while loading. |
| `preset` | `"gulabi"` | `gulabi` is Jaipur pink and blue. `neel` is an indigo wall with a turquoise frame and mustard doors. `haldi` is a turmeric wall with a green frame and rose doors. |
| `palette` | — | Override any of `wall`, `frame`, `plaster`, `door`, `brass`, `ink`. |
| `title` | `"Pesh Karte Hain"` | The line arched over the doors. Long lines shrink to fit the curve. |
| `monogram` | `"etc"` | `"etc"` draws the built-in didone ligature. Anything else is set in type. |
| `logo` | — | Your own node in place of the monogram. |
| `meta` | `"Portfolio · 2026"` | Top-left line. |
| `cue` | `"Scroll to enter"` | The prompt once ready. `""` hides it. |
| `message` | `"Khush aamdeed."` | Behind the doors when there are no children. |
| `hud` | `true` | Corner type, the counter and the cue. |
| `label` | `"Loading"` | Accessible name of the gate. |
| `displayFamily` / `displayWeight` | Playfair Display → Georgia, `700` | Face for the arched title. For the poster look, load a display face such as Rye and pass `displayWeight={400}`. |
| `serifFamily` / `monoFamily` | Bodoni Moda / JetBrains Mono → system | Faces for the typeset monogram, the closing line and the corner type. |
| `height` | `100svh` | Height of the gate. A definite length. |
| `onReady` | — | Fired once, when the load reaches 100. |
| `onComplete` | — | Fired once, the first time the doors are fully open. |

## Notes

- **Layout.** The gate and your page are both `position: sticky` inside one
  wrapper, followed by `scrollDistance` gate heights of scroll room. Don't
  give an ancestor `overflow: hidden`, or sticky stops working. Use
  `overflow: clip` if you need clipping.
- **Scroll lock.** While loading, the component sets `overflow: hidden` on
  `<html>` and restores the previous value when ready.
- **Performance.** The textures are SVG filters, painted once into layers
  that never repaint. The paint wipe, the doors and the camera are all
  composited transforms.
- **Accessibility.** The gate is a focusable `progressbar` with its value.
  Enter and Space rush the load or walk through, and the title and cue are
  announced when ready.
- **Reduced motion.** The load follows real progress directly and the rings
  appear without swinging. The doors fade with scroll instead of swinging,
  and there is no camera move.
