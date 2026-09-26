# Pixel Portal 404

A pixel-art 404 page set in a violet starfield. The **0 is a door**: a marble
arch with the day sky showing through it, floating on a glowing cloud bank
between two stone **4**s. Click the door and you fly through it into the sky
and come out on the home page.

Every pixel is drawn at runtime on one low-resolution canvas and scaled up
crisp: the dithered nebula, twinkling stars, planets, the ringed planet, the
spiral galaxy, shooting stars, the fluted stone numerals and the pixel-font
caption. **No images, fonts or packages.** React is the only import.

## Interaction

- **Hover or focus the door.** It lights up, motes lift off the cloud and drift
  into the doorway, and the caption retypes itself (`hoverCaption`).
- **Click the door.** The scene zooms through the arch into the sky, then calls
  `onEnter`, or navigates to `href` if there is no `onEnter`. Cmd/Ctrl/Shift
  clicks and middle clicks are left to the browser, so "open in new tab" still
  works.
- **Click anywhere else** to send a shooting star.
- **Move the pointer** for a slight parallax: stars, planets and the 404 sit at
  different depths.

## Usage

```tsx
import PixelPortal404 from "@/components/ui/pixel-portal-404"

// app/not-found.tsx: a plain link home
<PixelPortal404 />

// with a client router, so the fly-through hands off without a reload
const router = useRouter()
<PixelPortal404 onEnter={() => router.push("/")} />

// re-dressed
<PixelPortal404
  leftDigit="5"
  rightDigit="3"
  caption="The stars are rebooting. Wait here?"
  hoverCaption="Or slip out the back."
  skyColors={["#e0567a", "#ffc38a"]}
  cloudColors={["#7a1050", "#c0287a", "#e6509a", "#ff8cc4", "#ffe1f0"]}
  seed={503}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `caption` | `"Are you ready to come back?"` | Typed out in the pixel font. Wraps to the width; `\n` is kept. |
| `hoverCaption` | `"Step through the door."` | Typed while the door is hovered or focused. `""` keeps `caption`. |
| `href` | `"/"` | Where the door goes when there is no `onEnter`. Also the link's real `href`. |
| `onEnter` | none | Called when the fly-through ends, instead of navigating. |
| `linkLabel` | `"Go back to the home page"` | Accessible name of the door. |
| `leftDigit`, `rightDigit` | `"4"`, `"4"` | Any digit (stone numerals). Letters fall back to the pixel font. |
| `skyColors` | `["#2a55c9", "#79acf7"]` | The sky through the door, top then bottom. |
| `cloudColors` | `["#3d10a8", "#6a22e6", "#8f45ff", "#b681ff", "#efdcff"]` | Cloud bank: shadow, body, light, glow, core. |
| `seed` | `404` | Rearranges the stars, dust, planets and galaxy. |
| `enterMs` | `1400` | Length of the fly-through. |
| `height` | `"100svh"` | **Must be a definite length.** |
| `className` | `""` | Appended to the root. |

## Notes

- The pixel size is picked from the component's box so the whole scene reads
  as one pixel grid: about 3–4 CSS px per art pixel on a laptop, 2 on a phone.
- Planets and the galaxy slide out of the way of the 404 and the caption on
  narrow screens. When there is no room, they are left out.
- Stars and planets are laid out by `seed` and never move between renders.
- The loop pauses while the tab is hidden or the component is off screen.
- Reduced motion gives a still frame with the caption already typed, no
  parallax, and the door goes home straight away with no fly-through.
- A screen reader hears the heading "404: page not found", the caption, and a
  link named by `linkLabel`. The canvas is `aria-hidden`.
