# gooey-delete-confirm

A soft clay "Delete" pill that asks before it acts. Moving the pointer over it presses a
dark, smoky hollow into the surface that follows the pointer. Clicking blurs the label into
"Delete file?", the pill stretches, and its right end swells into a gooey bulb that stays
joined by a neck, pulls away and pinches into two chips: ✕ on top, ✓ below. ✕ melts the
chips back into the pill; ✓ melts them back and shows "Deleted" for a moment.

## Props

| Prop | Default | Notes |
|---|---|---|
| `label` | `"Delete"` | Idle label. |
| `question` | `"Delete file?"` | Shown while the chips are out. Keep it short; the pill is 250 px wide. |
| `doneLabel` | `"Deleted"` | Shown after ✓. |
| `onConfirm` / `onCancel` | – | Called on ✓ / ✕. |
| `autoPlay` | `false` | Loops a hover sweep, the open, and alternating ✕ / ✓ until someone touches it. The demo turns it on. |
| `className`, `style` | – | |

## Notes

- No dependencies beyond React. The blobs are three rounded rectangles under one SVG metaball
  filter (blur, alpha threshold, then the original fill composited back), so the neck and the
  split are real geometry, not an image sequence.
- Every state is a real `<button>` (the pill, Cancel, Confirm) sitting over its blob, with a
  visible focus ring in `--color-primary`. The question and result are announced politely.
- The widget fills its row up to 520 px wide (aspect 520 : 220) and scales down below that. Its pills carry their own
  light clay colour and a soft drop shadow, so it reads on dark and light pages.
- `prefers-reduced-motion`: states switch instantly and the unattended loop is off.
