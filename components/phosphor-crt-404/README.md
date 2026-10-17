# Phosphor CRT 404

A full-screen "page not found" on a pink-phosphor tube. The whole component is
the glass: an eyebrow between double rules, a chunky extruded error code ringed
by bobbing music notes, a message between two beating hearts, and a pyramid
between palm trees and drifting clouds, lit as round phosphor dots with a soft
bloom. A small CH + button and power switch sit in the top-right corner.

The pixel grid sizes itself to the screen, so nothing is cropped or stretched.
On wide screens it keeps 150 rows and adds columns, with more palms and clouds
toward the edges. On tall ones it keeps about 200 columns and adds rows, and a
striped sun rises into the extra sky.

**No dependencies.** React is the only import. Nothing is downloaded and no web
fonts are used: the 5 × 7 font, the thick code digits and every sprite are
bitmaps in the file. Each frame is built into a tone buffer, pushed to a
small canvas (one pixel per dot), scaled up and masked by a dot pattern drawn once per size at
device resolution. That same small canvas, blurred, is the bloom.

## Interaction

| Input | What happens |
|---|---|
| Hover / focus the pyramid | It brightens through an ordered dither and arrows blink beside the label. It is a real `<a href>`, so Tab + Enter works. |
| Click the screen, or **CH +** | Channel change: static, a vertical roll and torn rows, then the next message and the next channel number on the on-screen display. Announced to screen readers. |
| Move the pointer | A phosphor trail follows it, and the layers shift by whole pixels for parallax. |
| Power button | The picture collapses to a line, then a dot that fades. Press it again to turn it back on. |

Sound (a short burst of tube noise) only plays after a click, never on load. Pass `sound={false}` to turn it off.

Runs at 30 fps and pauses off-screen and in hidden tabs. With
`prefers-reduced-motion` the scene is a still frame: no bobbing, sway,
parallax, static or power animation, and channel changes cut straight to the
next message.

## Usage

```tsx
import PhosphorCrt404 from "@/components/ui/phosphor-crt-404"

<PhosphorCrt404 />

// Client-side routing
<PhosphorCrt404 onHome={(e) => { e.preventDefault(); router.push("/") }} />

// An amber 500 page
<PhosphorCrt404
  code="500"
  eyebrow="SERVER ERROR"
  messages={["WE BLEW A FUSE", "ENGINEERS ON SITE", "PLEASE STAND BY"]}
  homeLabel="BACK TO START"
  phosphor="#ffb04a"
  channel={50}
  brand="AMBERLINE"
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `code` | `"404"` | The big extruded code. Up to 5 characters; it scales down to fit. Digits use a thick face, anything else falls back to the small font. |
| `eyebrow` | `"PAGE NOT FOUND"` | Between the double rules. Up to 24 characters. |
| `messages` | 4 lines | One per channel; up to 24 characters each (a little fewer on phones). |
| `homeLabel` | `"TAKE ME HOME"` | Written across the pyramid, which widens to fit (up to 18 characters). Also the link's accessible name. |
| `homeHref` | `"/"` | |
| `onHome` | — | Click handler for the link. Call `preventDefault()` to route client-side. |
| `onRetune` | — | `(index) => void`, after each channel change. |
| `phosphor` | `"#ff8fab"` | Tube colour. The five dot tones, the glass, the controls and the LED all derive from it. |
| `channel` | `4` | Starting number on the on-screen display. |
| `brand` | `"PHOSPHOR"` | Small label beside the controls, top right. Hidden on narrow screens; `""` hides it. |
| `hint` | `"Click the screen to change the channel"` | Small line under the controls. Hidden on narrow screens; `""` hides it. |
| `sound` | `true` | Static and power sounds, only after a click. |
| `height` | `"100svh"` | Must be a definite length. The screen fills it edge to edge. |
| `className`, `style` | — | On the root `<section>`. |

The screen font covers A–Z, 0–9, space and `! ? . , ' - : / & # < > ( ) + = _`.
Text is upper-cased and anything else is dropped.

## Notes

- The screen paints its own dark glass on purpose, so it looks the same in light and dark themes.
- The canvases set `max-width: none` against Tailwind Preflight.
