# Engraved Ticket

A die-cut poster ticket with a heavy condensed headline that breathes. Two
prints of the same stub:

- **`paper`**: an engraving on white stock, red figures under the line work,
  and red ink spattered across the plate and into the type.
- **`crimson`**: a mirrored red ornament plate (acanthus scrolls, rosettes, a
  candelabrum) on black, with the headline knocked out in white and a
  misregistered red plate behind it.

**No dependencies.** React is the only import. There's no font, no image and no
network request: everything on the ticket is generated.

## It's a control, not a picture

| Do | What happens |
|---|---|
| Leave it | It breathes on its own rhythm. The letters inhale left to right from the baseline, the barcode fills in red as a breath meter, and the label counts down `INHALE · 3` → `HOLD` → `EXHALE`. |
| **Hold** it (pointer, touch or <kbd>Space</kbd>/<kbd>Enter</kbd>) | You take over and breathe in for as long as you hold. |
| Let go | It breathes out at the exhale rate, then goes back to the rhythm. |
| **Tap** it | Throws the ink again: new spatter, with drips running down. |
| Hover | It tilts toward the pointer. The plate, the spatter and the type each sit at a different depth, and a glare follows the light. |

Every completed breath advances the `Nº 000` counter and calls `onBreath`.

## Usage

```tsx
import EngravedTicket from "@/components/ui/engraved-ticket"

<EngravedTicket />                                   // paper, "BREATHE"
<EngravedTicket variant="crimson" />
<EngravedTicket word="Exhale" accent="#2346d8" rhythm={[4, 4, 4, 4]} />
<EngravedTicket word="Stay" variant="crimson" accent="#b8f23a" breathe={false} />
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `word` | `"Breathe"` | The headline. A–Z, 0–9 and `. , - ! ? '` are drawn; anything else prints as a gap. |
| `variant` | `"paper"` | `paper` \| `crimson`. |
| `dot` | `1` | Index of the letter that carries the square dot, as in the print. `-1` for none. |
| `tagline`, `quote`, `body`, `notes` | — | The fine print. `\n` breaks a line. |
| `code` | word + seed | What the barcode encodes. Same text, same bars. |
| `rhythm` | `[4, 2, 6, 1]` | Seconds of inhale, hold, exhale, rest. |
| `phases` | `["Inhale", "Hold", "Exhale", "Rest"]` | The four labels. |
| `breathe` | `true` | Breathe automatically. With `false` it waits to be held. |
| `splats` | `5` paper / `0` crimson | How many ink marks. |
| `seed` | `7` | Seeds the engraving, the ornament and the first spray. |
| `accent` | red | The ink colour: figures, spatter, ornament, meter. |
| `ink` | near-black | The engraving line colour, and the headline on paper. |
| `ground` | off-white / near-black | The stock. |
| `type` | off-white | The headline on crimson. |
| `tilt` | `7` | Largest tilt in degrees. `0` holds it flat. |
| `width` | `min(100%, 1080px)` | The height follows the 1200 : 460 stub. |
| `onBreath` | — | `(count) => void`, called after each full breath. |

`breathAt`, `letterBreath`, `ticketPath`, `layoutWord`, `glyphPath` and
`barcode` are exported, so you can use the same rhythm or the same face in
something of your own.

## Notes

- **The headline is its own typeface.** Each glyph is a polygon with a few
  rounded corners, drawn from a table in the file. A heavy condensed grotesque
  is mostly slabs and stadiums, so polygons are enough. The upside is that the
  word looks identical on every machine, whatever fonts the installer has, and
  each letter can be scaled from its own baseline. Holes wind against their
  outlines, and the test checks that for every glyph.
- **The engraving is traced from a flow field**, not filtered from a photo.
  Its line weight follows a tone map, the darkest passages are cross-hatched,
  and the edge dithers out into bare stock like a wiped plate. The red figures
  are printed first and then shaded with line work on one side, so they read as
  form rather than cut-outs.
- **The ornament is composed once and printed twice**, the second time
  mirrored, which is how grotesque panels were actually cut.
- The stub is a true parallel offset: the printed frames run at an even
  distance from the punched corners.
- The fine print is real DOM text sized in container units (`cqw`), so it
  scales with the ticket rather than with the viewport, stays selectable, and
  is read out. The headline is repeated as `sr-only` text.
- Sized by `width` and an aspect ratio, never a percentage height.
- `prefers-reduced-motion` stops the automatic breath and the spray animation.
  Holding still works, because that motion is started by the reader.
- `touch-action: pan-y`, so the page still scrolls under a finger on a phone.
  A long press holds; a scroll cancels the hold cleanly.
- The loop pauses when the ticket is off screen and stops once there's nothing
  left to animate.
