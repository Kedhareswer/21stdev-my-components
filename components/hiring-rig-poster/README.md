# Hiring Rig Poster

A "now hiring" poster built as a piece of hardware. A frosted acrylic panel
hangs from a chrome rig on orange cables. It carries a dot-matrix LED header,
the role on a lilac band, a seven-segment date window and the recruiting
e-mail, plus a field of glyphs and a black info card. An amber meter, a
speaker and a glass capsule of glowing fluid are bolted around it.

Everything is drawn in code, with no images. The hardware is SVG and the LED
header is two canvases: the lit dots, then their bloom. The words and controls
are real HTML, so they stay crisp, readable to screen readers and reachable by
keyboard.

## What it does

- **The rig turns toward you.** It tilts with the pointer, and a highlight
  slides across the acrylic.
- **Drag the panel sideways and it swings** on its cables and springs back.
  The cables bend between the fixed rig and the moving panel, and the fluid in
  the capsule stays level and sloshes. A fast swipe across the panel nudges it.
- **The LED screen** boots with a scan, glints now and then, and brightens
  under the pointer like a torch. A short first line trails a running dash
  toward the star. **Click it** (or press Enter) for the next message. A line
  too wide for the screen runs as a marquee.
- **Click the date** to flip it to a live countdown when `deadline` is set.
  Without one, the click re-rolls the digits.
- **Click the e-mail** to copy it to the clipboard. The ◀ beside it opens a mail.
- **The glyph field** turns over under the pointer and ripples outward from a click.
- **Press the orange ✦ button to apply.** The screen thanks you, the meter
  jumps, the capsule boils and `onApply` fires. With `applyHref`, it opens that
  link too.
- **Hover the info card** to lift it up and read it, and **click the speaker**
  to mute the blips.

```tsx
import HiringRigPoster from "@/components/ui/hiring-rig-poster"

// As printed
<HiringRigPoster />

// Your own
<HiringRigPoster
  headline={["WE ARE", "NOW HIRING!"]}
  messages={[["SEND THE", "REEL ✦"], ["NO COVER", "LETTERS"]]}
  role="Senior Motion Designer"
  from="10.02"
  to="10.14"
  deadline="2026-10-14T18:00:00Z"
  email="jobs@yourstudio.com"
  requirements={[
    { label: "Tools", value: "Houdini" },
    { label: "Renderer", value: "Redshift" },
    { label: "Bonus", value: "Real-time / UE5" },
  ]}
  palette={{ backdrop: "#0e0f13", glow: "#ff3b6b", cable: "#ff3b6b" }}
  applyHref="https://yourstudio.com/jobs/motion-lead"
  onApply={() => track("apply")}
/>
```

**No dependencies beyond React.**

## Props

| Prop | Default | Description |
|---|---|---|
| `headline` | `["WE ARE", "NOW HIRING!"]` | The LED header, one string per line. Two lines of up to ~10 characters fit. A short first line trails off toward the star. A longer line runs as a marquee. |
| `messages` | three built from the props | More LED messages, shown in turn when the screen is clicked. |
| `thanks` | `["THANK YOU", "TALK SOON!"]` | What the screen says after the ✦ button is pressed. |
| `role` | `"3D Motiongraphic Designer"` | The role band. Squeezed horizontally if it is too long. |
| `from` / `to` | `"09.05"` / `"09.15"` | The dates in the seven-segment window. Digits, `.`, `-`, `:` and a few letters display. |
| `deadline` | — | ISO string, timestamp or `Date`. When set, clicking the date toggles a live `DDdHH:MM:SS` countdown. |
| `emailLabel` / `email` | `"Recruit E-mail"` / `"careers@novaforma.studio"` | The line above the e-mail, and the address copied on click. |
| `lookingFor` | `"We are looking for"` | The info card's heading. |
| `requirements` | Cinema 4D / Octane / Unreal | `{ label, value }[]`, laid out three to a row. |
| `addressLabel` / `address` | `"Address"` / a fictional studio | The info card's second block. |
| `tagline` / `studio` | `"Expand your Horizon"` / `"with nova ✦forma"` | The info card's footer. A `✦` is drawn as the star. |
| `site` | `"novaforma.studio"` | Small print on the foot of the panel and in the corner caption. |
| `applyLabel` | `"Apply now"` | Accessible name of the ✦ button. |
| `applyHref` | — | Where the ✦ button goes, in a new tab. Without it the button only fires `onApply`. |
| `onApply` | — | Called when the ✦ button is pressed. |
| `palette` | see below | Partial hex overrides. |
| `sound` | `true` | Whether the speaker starts on. Blips only ever follow a click, and the speaker toggles them. |
| `interactive` | `true` | Pointer tilt, drag-to-swing and the LED torch. The buttons always work. |
| `captions` | `true` | The technical captions and the hint in the corners. |
| `fontHref` | Google Fonts URL | Stylesheet for Tektur. `null` loads nothing. |
| `font` | Tektur stack | Font stack for every word on the poster. |
| `height` | `"100svh"` | Root height. Must be a definite length, never a percentage. |
| `className` | `""` | Extra root classes. |

| Palette key | Default | Used for |
|---|---|---|
| `backdrop` | `#dfe4e9` | the studio wall (a dark one flips the captions light) |
| `glow` | `#ff7a1a` | the hot half of the print, the ✦ button, the meter, the fluid |
| `blush` | `#ece2f1` | the cool top of the print |
| `lilac` | `#c6c0ff` | the cool end of the LED gradient, the role band |
| `led` | `#ffc79c` | the warm end of the LED gradient |
| `ink` | `#58121b` | the date, the e-mail, the glyphs and the line work |
| `band` | `#28235a` | the role |
| `screen` | `#0b0a0f` | the LED screen and the info card |
| `hardware` | `#16171b` | black plastic: the spine, the fins, the speaker, the caps |
| `cable` / `cableAlt` | `#ff7a12` / `#ffb21a` | the cables |
| `signal` | `#4fd8ff` | the status light, the focus ring |

Palette values must be hex (`#rgb` or `#rrggbb`), because the shading is mixed
from them. Any other value falls back to the default.

## Notes

- **The rig is drawn on a fixed 1200 × 1950 stage** and scaled to fit the root.
  On narrow screens the capsule's end caps and the speaker run off the sides
  before the panel shrinks any further.
- **Fonts** load through an injected `<link>`, never `@import`. On the fallback
  stack (Bahnschrift, DIN, Arial Narrow) the role and e-mail are squeezed to fit,
  and the LED and the date need no font at all. The 21st capture sandbox blocks
  external origins, so render covers with `fontHref={null}` or supply your own
  `--preview`.
- **Reduced motion** holds the rig still: no tilt, no swing, no idle animation.
  Messages and dates change without the dissolve or the roll.
- The loop pauses off-screen and in background tabs. Canvas DPR is capped at 2.
- The poster has its own palette, so it looks the same in light and dark themes.
- The studio, address and e-mail in the defaults are made up. Replace them with yours.
