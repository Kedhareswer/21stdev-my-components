# Lunar Boarding Pass

A two-sided ticket to the Moon: a black **VIP pass** on the front, a silver
**boarding pass** with a perforated stub on the back.

- **Front**: a halftone Moon in the stub, its seas and bright craters placed
  from real selenographic coordinates, with the landing site ringed. A
  clarinet and a Saturn V float in a star field, with "Space" and "Jazz".
- **Back**: passenger, route, spacecraft, gate / group / seat, boarding time,
  landing site in decimal degrees, and a stub that tears off along its
  perforation.

**No dependencies.** React is the only import. No images, fonts or network
requests: the Moon is canvas, the clarinet, rocket, stars and paper grain are
SVG built from numbers.

## Interaction

| Do | What happens |
|---|---|
| Sweep the pointer across the front | The light moves around the Moon and runs it through its phases: crescent at the left edge, full in the middle, lit from the right at the right edge. Left alone, it sways gently around gibbous. |
| Hover | The ticket tilts toward the pointer (mouse only). A glow follows on the black face, and a foil sheen slides across the silver one. |
| Point at the clarinet | It plays: notes drift out of the bell. |
| Point at the rocket | The engines light and it pushes forward. |
| Click either face, or use the `01 / 02` switch | The ticket turns over. The first time the back shows, its values type themselves in. |
| **Drag the stub** to the right (or click it, or focus it and press <kbd>Enter</kbd>) | It tears along the perforation, and the pass gets a `Boarded` stamp. Click the stub again to put it back. |

`onSideChange(side)` and `onTear(torn)` report both.

## Usage

```tsx
import LunarBoardingPass from "@/components/ui/lunar-boarding-pass"

<LunarBoardingPass />
```

Give it a parent with a width (see `demo.tsx`). Its height follows the
1000 : 330 ticket.

Personalise it through props (see `demo.tsx`). The landing-site
coordinates are printed on both faces and also move the marker on the Moon:

```tsx
<LunarBoardingPass
  passenger="Alan Bean"
  site="Ocean of Storms" lat={-3.01239} lon={-23.42157}
  words={["Blue", "Note"]} headline="Blue Note" stamp="Landed"
  night="#0e1a2c" starInk="#f3e8cf" paper="#e6dcc4" paperInk="#1c2738" stampColor="#2b5ea6"
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `title` | `"Fly me to the moon"` | Headline on both faces. |
| `tier` | `"VIP"` | Front corner and back header. |
| `date` | `"20 July '69"` | Front. |
| `welcome` / `eyebrow` | `"Welcome\naboard"` / `"The 1st station of\nthe space tour"` | `\n` breaks a line. |
| `words` | `["Space", "Jazz"]` | The two words in the art. |
| `notes` | two lines in Chinese | Fine print along the front's foot. |
| `passenger`, `from`, `to`, `craft`, `dateCode`, `gate`, `group`, `seat`, `boardingTime` | Apollo 11 | Fields on the back. Long values get an ellipsis. |
| `site`, `lat`, `lon` | Tranquility Base, `0.67416`, `23.47314` | Printed as DMS on the front and decimal on the back, and marked on the Moon. If the site is on the western side, which the stub crops off, the globe turns to bring it into view. |
| `seq`, `featuring`, `headline` | reference copy | Back footer. |
| `stamp` | `"Boarded"` | Shown once the stub is torn off. |
| `sideLabels` | `["VIP pass", "Boarding pass"]` | The switch under the ticket. |
| `night` / `starInk` | `#0b0b0c` / `#f1f0eb` | Front stock and ink. |
| `paper` / `paperInk` | `#c9c9c6` / `#1b1b1b` | Back stock and ink. Rules are mixed from `paperInk`. |
| `stampColor` | `#a3362a` | |
| `fontCondensed` / `fontMono` / `fontDisplay` | system stacks | Nothing is loaded. Pass families your page already loads (e.g. Oswald, Courier Prime, Futura). |
| `defaultSide` / `onSideChange` | `"front"` / none | |
| `defaultTorn` / `onTear` | `false` / none | |
| `tilt` | `6` | Largest tilt in degrees. `0` holds it flat. |
| `maxWidth` | `960` | |
| `className` | `""` | Appended to the root. |

## Notes

- **Intrinsic height.** It has no `height` prop and no percentage heights: the
  height comes from the width and the aspect ratio. Type is sized in `cqw`
  off the ticket, so it scales like a printed object. It reads well from
  about 560px wide. Below that the fine print gets very small, so give it the
  widest column you have on phones.
- The CSS is one scoped `<style>` block, and every rule sits under `.lbp`.
  The switch uses only the `foreground` / `muted-foreground` tokens. Both
  ticket faces paint their own palette, so they look the same in light and
  dark themes.
- The perforation is real. The main piece and the stub each have half-holes
  masked into their edges, so the page shows through the holes, and each
  piece keeps its own edge when the stub is torn off.
- The Moon pauses when it's off screen or turned away. It redraws from a
  cached dot grid, so a frame costs only the lighting.
- `prefers-reduced-motion`: no tilt, drift, pulse, twinkle, flame, notes,
  type-in or stamp animation, and the flip and tear happen instantly. The
  light still follows the pointer, because only the reader moves it.
- Keyboard: the stub is a toggle button (`aria-pressed`) that drops out of
  the tab order while its face is turned away. The side switch reports
  `aria-pressed`, and the face that's turned away is `aria-hidden`.

## Credit

Layout after a reference shot of a "Fly Me to the Moon / Space Jazz" ticket
pair. The Moon, illustrations, interactions and code are original.
