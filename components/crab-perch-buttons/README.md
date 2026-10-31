# Crab Perch Buttons

A small red crab sits on top of every button. Its claws and front legs hang
over the front edge. It's alive, and it reacts to whatever you do:

- **Rest.** It's never quite still. It bobs as it breathes. Its eyes wander
  on their own, one at a time. Its antennae twitch, its mouthparts keep
  working, and its legs shift their weight. Every few seconds it does
  something: raps a claw on the rim, flexes its pincers, wipes an eye,
  stretches, glances around, shuffles along the edge, ducks behind the rim
  and peeps back over, or burps a bubble.
- **Your pointer.** Its eyes follow you from anywhere nearby, not just over
  the button.
- **Hover.** It scuttles along the edge after your pointer and leans into the
  walk while its legs patter. Its eyes pop up, it lifts the claw on your side
  and snips at you, and its antennae and mouthparts speed up.
- **Press.** It ducks flat and its eyes fold down into their sockets, and
  three shock lines pop over its head.
- **Click.** A happy hop, a double snip, and a few bubbles.
- **Loading.** It drums both claws.
- **Disabled.** It falls asleep (eyes tucked away, a drifting *z z*).

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

**Requires only React.** There are no images, fonts or network requests. The
crab is SVG, built once at module load:

- **Anatomy.** A saw-edged carapace, a broad tan front, plated mouthparts,
  antennae, big glossy eyes in their sockets, jointed legs with dark tips, and
  swollen claws with toothed, open pincers.
- **Texture.** Seeded granules (raised) and pits (sunken) on the shell, palms
  and arms, seams at every leg joint, and blotchy mottling, so every crab is
  drawn the same way.
- **Light.** A relief filter builds a height map from three things: the
  silhouette (a tight bevel plus a wide dome), soft noise (pebbling), and the
  paint's own brightness (so painted granules rise and painted seams sink).
  It then adds diffuse light, a wet specular sheen from the top left, and a
  soft cast shadow.

The body sits *behind* the button's top edge and the claws and legs hang *in
front*, so it really looks perched.

**Performance.** Every moving part (each eye, antenna, mouthpart, arm, hand,
pincer finger and set of legs) is its own small layer, and an HTML wrapper
around it is what moves. The lighting renders once, and all motion runs on
the compositor. Per-frame motion is written straight onto the moving
elements, never as a CSS variable on the root, which would repaint every lit
layer. Idle routines pause while the crab is off-screen or the tab is hidden.
A sheet of nine crabs holds 60fps.

## `CrabButton` props

Every native `<button>` attribute passes through, and the ref goes to the `<button>`.

| Prop | Default | Description |
|---|---|---|
| `variant` | `"solid"` | `solid` · `outline` · `ghost` · `icon`. |
| `size` | `"md"` | `sm` 44px · `md` 56px · `lg` 68px tall. |
| `icon` | — | Leading icon. |
| `trailing` | arrow | Trailing icon. `null` hides it. For `icon`, the glyph in the circle. |
| `crab` | `"red"` | Shell: `red` `blue` `gold` `pearl` `violet` `mint`, or any hex. Every shade (face, plates, palms, tips) is derived from it. |
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
  about 0.9× the button's height. Give the row above some breathing space
  (the demos use `pt-20`).
- The crab is `aria-hidden` and ignores the pointer, so the hit area is the
  button and nothing else. Focus rings sit on the button face, and
  keyboard focus counts as hover (the crab looks up at you).
- `prefers-reduced-motion` stops all of it: breathing, blinking, idle
  routines, pointer tracking, walking and hopping. The crab jumps to place
  instead of walking, and there are no bubbles.
- The faces have their own colours, so they read the same on light and dark
  pages. The ghost label and the shock lines follow `--color-foreground`.
- No external assets, so `21st render` can capture its own cover.
