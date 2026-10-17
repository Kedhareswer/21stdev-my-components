# Phosphor CRT 404

A "page not found" screen on an old pink-phosphor television. The picture is a
200 × 150 pixel scene: an eyebrow between double rules, a chunky extruded
error code ringed by bobbing music notes, a message between two beating hearts,
and a pyramid between palm trees and drifting clouds. It is lit as round
phosphor dots with a soft bloom, inside a dark plastic set with a working
CH + button and power switch.

**No dependencies.** React is the only import. Nothing is downloaded and no web
fonts are used: the 5 × 7 font, the thick code digits and every sprite are
bitmaps in the file. Each frame is built into a tone buffer, pushed to a
200 × 150 canvas, scaled up and masked by a dot pattern drawn once per size at
device resolution. That same small canvas, blurred, is the bloom.

## Interaction

| Input | What happens |
|---|---|
| Hover / focus the pyramid | It brightens through an ordered dither and arrows blink beside the label. It is a real `<a href>`, so Tab + Enter works. |
| Click the screen, or **CH +** | Channel change: static, a vertical roll and torn rows, then the next message and the next channel number on the on-screen display. Announced to screen readers. |
| Move the pointer | A phosphor trail follows it, and the layers shift by whole pixels for parallax. |
| Power button | The picture collapses to a line, then a dot that fades. Press it again to boot back up. |

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
| `messages` | 4 lines | One per channel; up to 24 characters each. |
| `homeLabel` | `"TAKE ME HOME"` | Written across the pyramid, which widens to fit (up to 18 characters). Also the link's accessible name. |
| `homeHref` | `"/"` | |
| `onHome` | — | Click handler for the link. Call `preventDefault()` to route client-side. |
| `onRetune` | — | `(index) => void`, after each channel change. |
| `phosphor` | `"#ff8fab"` | Tube colour. The five dot tones, the glass, the bezel tint, the LED and the room glow all derive from it. |
| `channel` | `4` | Starting number on the on-screen display. |
| `brand` | `"PHOSPHOR"` | Embossed on the chin. |
| `hint` | `"Click the screen to change the channel"` | Small line under the set. `""` hides it. |
| `sound` | `true` | Static and power sounds, only after a click. |
| `height` | `"100svh"` | Must be a definite length. The set scales to fit it. |
| `className`, `style` | — | On the root `<section>`. |

The screen font covers A–Z, 0–9, space and `! ? . , ' - : / & # < > ( ) + = _`.
Text is upper-cased and anything else is dropped.

## Notes

- The set paints its own dark room on purpose, so it looks the same in light and dark themes.
- The canvases set `max-width: none` against Tailwind Preflight.
- The room glow and bezel tint use `color-mix()`, which needs a 2023 or later browser.
