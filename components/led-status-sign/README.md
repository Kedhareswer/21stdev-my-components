# LED Status Sign

A desk "ON CALL" light: a brushed-metal bar with a black glass face and a red
dot-matrix behind it, white pixels for the words, a knurled dial on top and a
push bar for power. Turn the dial to change status, or double-click the glass
and type your own.

**No dependencies.** React is the only import. Nothing is downloaded: the
housing is CSS and one inline SVG, and the matrix is painted dot by dot on a 2D
canvas from a built-in bold pixel font and pixel icons, with a blurred twin
canvas for the bloom.

## Interaction

| Input | What happens |
|---|---|
| Dial (top right) | Click for the next status, shift-click for the previous one, or scroll it. The knurling turns. |
| Pips on the glass | Left / right: previous / next status. |
| Bar (top) | Power. Off fades the panel to black glass; on sparkles the message back in. |
| Double-click the glass, or focus it and press Enter | **Write your own.** Type, Enter to keep it, Escape to cancel. `onTextChange` gets the result. |
| Arrow keys / Space on the focused glass | Step through statuses. |
| Pointer | The device leans toward it, the glare follows, and the LEDs under it brighten. |

## Usage

```tsx
import LedStatusSign from "@/components/ui/led-status-sign"

<LedStatusSign />

<LedStatusSign
  palette="amber"
  finish="graphite"
  transition="wipe"
  autoCycle={6}
  statuses={[
    { text: "ON AIR", icon: "rec", effect: "pulse" },
    { text: "FREE", icon: "check", palette: "lime" },
    { text: "LUNCH 12:30", icon: "coffee" },                     // too long: scrolls on its own
    { text: "HI", icon: [".#.#.", "#####", "#####", ".###.", "..#.."] },  // your own icon
  ]}
/>

// Controlled, e.g. from presence in your app
<LedStatusSign index={busy ? 0 : 6} onIndexChange={setIndex} />
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `statuses` | 7 presets | `{ text, icon?, effect?, palette? }[]`. ON CALL, IN A MEETING, FOCUS, BRB, DO NOT DISTURB, ON AIR, FREE. |
| `index` / `defaultIndex` / `onIndexChange` | — / `0` / — | Controlled or uncontrolled status. |
| `palette` | `"crimson"` | `crimson`, `amber`, `lime`, `ice`, `violet`, `mono`, or `{ lit, dim }` hex. Per-status `palette` wins; changes fade. |
| `finish` | `"silver"` | Housing: `silver`, `graphite`, `white`. |
| `cols` / `rows` | `64` / `13` | Matrix size. 13 rows fits the 9-dot font and 11-dot icons with a margin. |
| `transition` | `"roll"` | `roll` (columns spin like a drum, left to right), `wipe`, `dissolve`, `cut`. |
| `scrollSpeed` | `16` | Marquee speed, dots per second. |
| `autoCycle` | `0` | Seconds between automatic changes. Pauses on hover, while editing, and while off. |
| `powered` / `defaultPowered` / `onPowerChange` | — / `true` / — | Controlled or uncontrolled power. |
| `editable` / `onTextChange` | `true` / — | Let the viewer write on the sign. Edits are kept per status. |
| `tilt` | `true` | Lean toward the pointer. |
| `backdrop` | `"studio"` | Grey sweep (dark under `.dark`), `"none"`, or any CSS background. |
| `maxWidth` | `820` | Device width cap, CSS px. The device is 92% of the stage below that. |
| `label` | `"LED status sign"` | Accessible name. |
| `height` | `"100svh"` | **Must be a definite length.** |
| `className` / `children` | — | Appended to the root / rendered above the stage. |

### Status fields

| Field | Notes |
|---|---|
| `text` | A–Z, 0–9 and common punctuation (`! ? . , : ; - + = _ ' " / ( ) < > % # & @`). Lowercase draws as capitals; anything else shows as `?`. |
| `icon` | `mic`, `phone`, `video`, `coffee`, `focus`, `dnd`, `check`, `moon`, `heart`, `rec`, `music`, or your own bitmap: one string per row, `#` lit. Up to `rows` tall. |
| `effect` | `auto` (still when it fits, marquee when not), `static`, `scroll`, `blink` (text blinks, icon stays), `pulse` (icon breathes). |
| `palette` | As above, for this status only. |

## Notes

- Scrolling steps whole dots, like a real panel. LEDs rise fast and fall slow,
  so moving text leaves a faint afterglow.
- Device pixel ratio is capped at 2. The loop stops while the tab is hidden or
  the sign is off screen, and skips painting when nothing changed.
- Reduced motion: no lean, blink or pulse, transitions cut, and long messages
  page every few seconds instead of scrolling.
- Everything is sized in container units, so the sign scales cleanly from a
  phone to a desktop hero.
