# Crab Perch Buttons

A small red crab sits on top of every button. Its claws and front legs hang
over the front edge. It has a personality, and it reacts to whatever you do:

- **Rest.** It breathes, blinks, and now and then taps a claw on the rim.
- **Hover.** It scuttles along the edge after your pointer and leans into the
  walk while its legs patter. It lifts the claw on your side and snips at
  you. Its eyes follow the pointer.
- **Press.** It ducks flat and squints, and three shock lines pop over its
  head.
- **Click.** It lets out a few bubbles.
- **Loading.** It drums both claws on the rim.
- **Disabled.** It falls asleep (eyes shut, a drifting *z z*).

One drawing, five pieces:

| Export | What it is |
|---|---|
| `CrabButton` (default) | `solid` · `outline` · `ghost` · `icon`. Takes an optional leading icon. The ghost crab stands beside the label and waves. The icon crab hugs the side of the circle. |
| `CrabToggle` | A switch (`role="switch"`). The crab sits on the side away from the knob, watches it, and hops over it every time the switch flips. |
| `CrabDropdown` | A select (`listbox`). The crab peers down into the open list. Supports arrows, Home/End, type-ahead and Escape. |
| `CrabMascot` | The crab on its own (`stand` or `peek`). Its eyes follow the pointer, and poking it makes bubbles. |

```tsx
import CrabButton, { CrabToggle, CrabDropdown, CrabMascot } from "@/components/ui/crab-perch-buttons"

<CrabButton onClick={go}>Button</CrabButton>
<CrabButton variant="outline">Button</CrabButton>
<CrabButton variant="ghost">Button</CrabButton>
<CrabButton variant="icon">Next</CrabButton>            {/* children become the accessible name */}
<CrabButton icon={<BagIcon />}>Add to bag</CrabButton>
<CrabButton loading>Saving</CrabButton>

<CrabToggle checked={on} onCheckedChange={setOn} aria-label="Crab mode" />
<CrabDropdown options={["Low tide", "High tide"]} onValueChange={setTide} aria-label="Tide" />

// Make it yours: a blue crab on an ink button, bigger
<CrabButton crab="blue" tone="ink" size="lg">Dive in</CrabButton>
<CrabButton crab="#ff7ab6" tone="#1b4d3e" ink="#fdf6e3">Any hex works</CrabButton>
```

**Requires only React** and Tailwind's preflight is fine. There are no
images, fonts or network requests. The crab is SVG, built once at module load
from a few curves: a smooth shell with soft teeth, tapered jointed legs, and
glossy eyes. Its body sits *behind* the button's top edge and its claws hang
*in front*, so it really looks perched. Labels use your page's font.

## `CrabButton` props

Every native `<button>` attribute passes through, and the ref goes to the `<button>`.

| Prop | Default | Description |
|---|---|---|
| `variant` | `"solid"` | `solid` · `outline` · `ghost` · `icon`. |
| `size` | `"md"` | `sm` 44px · `md` 56px · `lg` 68px tall. |
| `icon` | — | Leading icon. |
| `trailing` | arrow | Trailing icon. `null` hides it. For `icon`, the glyph in the circle. |
| `crab` | `"red"` | Shell: `red` `blue` `gold` `pearl` `violet` `mint`, or any hex. Every shade is derived from it. |
| `tone` | `"moss"` | Button: `moss` `ink` `clay` `sea` `plum` `sand`, or any hex. |
| `ink` | auto | Label colour. Picked for contrast with `tone` when left out. |
| `crabAt` | `0.42` | Where the crab rests along the edge, 0–1. |
| `crabScale` | `1` | Crab size multiplier. |
| `follow` | `true` | Scuttle after the pointer (mouse and pen; touch just reacts). |
| `bubbles` | `true` | Bubbles on click. |
| `hideCrab` | `false` | Just the button. |
| `loading` | `false` | Drums the claws, shows dots, sets `aria-busy`. |
| `state` | — | Freeze a pose (`hover`, `press`, `sleep`) for docs and showcases. The button still works. |

## `CrabToggle` props

`checked`, `defaultChecked`, `onCheckedChange(checked)`, `size`, `crab`, `tone`
(the track when on), `offTone` (the track when off, default `#d9d4ca`), `state`,
and native button attributes. Give it an `aria-label`.

## `CrabDropdown` props

`options` (strings or `{ value, label?, disabled? }`), `value`, `defaultValue`,
`onValueChange(value)`, `placeholder`, `size`, `crab`, `tone` (default `sand`),
`ink`, `crabAt`, `disabled`, `aria-label`, `state`.

## `CrabMascot` props

`size` (width px, default 160), `crab`, `pose` (`stand` | `peek`), `mood`,
`title` (makes it an `img` with that name, otherwise it's decorative).

## Notes

- **Leave room above.** The crab sits on top of the button, outside its box,
  about 0.85× the button's height. Give the row above some breathing space
  (the demos use `pt-20`).
- The crab is `aria-hidden` and ignores the pointer, so the hit area is the
  button and nothing else. Focus rings sit on the button face, and
  keyboard focus counts as hover (the crab looks up at you).
- `prefers-reduced-motion` stops the breathing, blinking, tapping, walking
  and hopping. The crab jumps to place instead of walking, and there are no
  bubbles.
- The faces have their own colours, so they read the same on light and dark
  pages. The ghost label and the shock lines follow `--color-foreground`.
- No external assets, so `21st render` can capture its own cover.
