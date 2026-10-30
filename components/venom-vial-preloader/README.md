# Venom Vial Preloader

A loading gate in pixel art. A glass vial fills with glowing venom while a
black widow walks along it and wraps it in silk. When it's full you pull the
emerald stopper, venom fog floods the screen, and the fog clears onto your
portfolio.

1. **Arrive.** Spores and stars fade up out of the dark. A scanning pixel
   draws the glass left to right. The steel ring and brass collar click on,
   the stopper pops into place and its chain settles. The widow abseils down
   on a thread onto the rounded end.
2. **Fill.** Venom pours in as a glowing plug. It swirls in four dithered
   shades, froths at the front and sends vapour creeping up the empty glass
   ahead of it. The widow walks the glass with the meniscus and wraps silk
   round everything behind her, one strand at a time. A toxic haze of curling
   ribbons thickens behind the vial. A chunky pixel count and a size readout
   (`21.1 of 48.2 MB`) sit underneath.
3. **Brewed.** At 100% the venom flashes and sparks fly off the glass. The
   widow climbs onto the collar. The vial waits with *Pull the stopper to
   enter*. Otherwise it goes in on its own.
4. **Uncork.** The stopper pops and swings on its chain. A jet of venom
   bursts from the neck and the fog floods out from it across the whole
   screen. The widow climbs away up her thread. The fog thins out in a
   blotchy dither onto whatever the gate was guarding. With `loop`, the dark
   closes back in and it brews again.

You can play with it while it loads:

- **Grab the gem.** It comes off on its chain (a verlet rope that swings and
  sags). Mist pours from the open neck while it's off, and it snaps home when
  you let go. Once the vial is full, pulling it well clear opens the gate.
- **Swipe across the glass** to slosh the venom. The front tilts and the
  bubbles pick up. Tapping the glass knocks it too.
- **Poke the widow** and she hops.
- **Drag a file over it.** The stopper pops, the label reads *Release to drop
  it in*, and a dropped file flies into the neck and rushes the load to 100%.
  `onFeed` gets the files.
- **Enter or Space** rushes the load, then uncorks.

```tsx
import VenomVialPreloader from "@/components/ui/venom-vial-preloader"

// Looping showcase, nothing else on screen
<VenomVialPreloader loop />

// Portfolio gate, driven by real progress
<VenomVialPreloader progress={loaded} total={18.6} onComplete={() => {}}>
  <YourPortfolio />
</VenomVialPreloader>

// Your own colours: a golden elixir under a ruby stopper
<VenomVialPreloader
  total={3.4}
  unit="GB"
  doneLabel="The elixir is ready."
  palette={{ venom: "#ffb238", gem: "#ff3b6b", brass: "#c7ccd8", mark: "#ffcf3a" }}
/>
```

**Requires only React.** There are no images. Everything (the glass, venom,
widow, gem, chain, haze and fog) is drawn every frame into a low-resolution
pixel buffer, which is scaled up with `image-rendering: pixelated`. A second
buffer holds only what glows and is blurred on top. The layout is measured
from the box, so the vial fits portrait, landscape and ultra-wide screens.
The labels use Pixelify Sans, loaded with an injected Google Fonts `<link>`,
never a CSS `@import`. Pass `fontHref={null}` to load nothing and fall back
to the monospace stack.

## Props

| Prop | Default | Description |
|---|---|---|
| `children` | — | Content revealed once the fog clears. It's `inert` until then. Ignored while `loop` is set. |
| `loop` | `false` | Brew → uncork → clear → close back in, forever. `onComplete` never fires. |
| `progress` | — | Real progress, `0`–`100`. Leave it out to run a simulated load that surges and stalls. |
| `durationMs` | `5600` | Length of the simulated load (after the 1.7s arrival). |
| `total` | `48.2` | Size for the readout under the count. `0` hides it. |
| `unit` | `"MB"` | Unit for `total`. |
| `doneLabel` | `"Brewed. Ready when you are."` | Shown under the count once the vial is full. |
| `hint` | `"Pull the stopper to enter"` | Shown at the foot while the full vial waits. |
| `tip` | `"Tug the gem · drop a file in"` | Shown at the foot while loading. `null` hides it. |
| `dropLabel` | `"Release to drop it in"` | Shown while a file is dragged over. |
| `feedable` | `true` | Accept dropped files (they rush the load). |
| `onFeed` | — | Called with the dropped `File[]`. |
| `palette` | see below | Partial overrides, as hex colours. Shades are derived from each one. |
| `pixel` | `1` | Pixel size multiplier. `0.75` is finer and `1.5` chunkier. |
| `counter` | `true` | Show the pixel count. |
| `label` | `"Portfolio"` | Announced as "Portfolio is loading". |
| `fontHref` | Google Fonts URL | Stylesheet for the label face. `null` loads nothing. |
| `font` | Pixelify Sans stack | Face for the labels. |
| `height` | `"100svh"` | Root height. Always a definite length, never `h-full`. |
| `onComplete` | — | Fired once, after the fog has cleared. |
| `className` | `""` | Extra root classes. |

### Palette

| Key | Default | Used for |
|---|---|---|
| `void` | `#06060d` | The dark behind everything. |
| `glass` | `#a6acb7` | The glass, the steel ring, stars and muted labels. |
| `venom` | `#5cf03d` | The venom, its vapour, the haze and the fog of the exit. |
| `gem` | `#2fdc66` | The stopper's stone. |
| `brass` | `#e39a2d` | The collar and the chain. |
| `spider` | `#14141c` | The widow. |
| `mark` | `#e8233d` | Her hourglass and eyes. |
| `silk` | `#eef7ef` | Her silk, and the count. |

## Notes

- The stage has its own colours, so it reads the same in light and dark
  hosts.
- `prefers-reduced-motion` drops the arrival, the slosh, the bubbles, the
  gait and the mist. The fog flood becomes a plain cross-fade.
- The gate exposes `role="progressbar"` with its value. It's focusable and
  works with Enter and Space. The brewed state is announced.
- `21st render` capture blocks off-site fonts, so supply the cover with
  `--preview` when publishing (`media/venom-vial-preloader/cover.png`).
