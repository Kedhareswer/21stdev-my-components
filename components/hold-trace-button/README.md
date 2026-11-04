# Hold Trace Button

A press-and-hold delete button. At rest it's a soft rose pill with a bin icon; on hover the lid tips open, a fine dotted border starts to march, and a hint appears above. Press and hold, and a glowing crimson line traces the whole border while the fill floods in from the left, turning the label white as it passes. The bin rattles and the hint counts down. Let go early and it all unwinds; hold to the end and the pill pops, swaps to a drawn check and "Removed", rings out once, and offers Undo for a few seconds.

Space and Enter hold it from the keyboard. Under `prefers-reduced-motion` nothing shakes or bounces; the trace and fill still show progress.

```tsx
import HoldTraceButton from "@/components/ui/hold-trace-button"

<HoldTraceButton
  label="Remove brand book"
  onConfirm={() => removeFile(id)}
  onUndo={() => restoreFile(id)}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `label` | `"Remove"` | Button label. |
| `hint` | `"Hold to remove"` | Bubble above on hover; becomes a countdown while held. `""` hides it. |
| `doneLabel` | `"Removed"` | Label after the hold completes. |
| `undoLabel` | `"Undo"` | Undo link text. |
| `holdMs` | `1100` | How long the press must be held. |
| `onConfirm` | none | Fires once when the hold completes. |
| `onUndo` | none | Fires when Undo is pressed. |
| `undoMs` | `4000` | How long Undo is offered before the button resets. `0` hides Undo and keeps the done state. |
| `color` | `#d0233a` | Trace, flood and text colour. |
| `font` | system sans stack | CSS `font-family`. |

The progress is one registered CSS number (`@property --htb-p`) that transitions linearly while held and eases back on release; the trace, the flood and the white label all read it, so no JavaScript runs per frame. The border rect is sized from a `ResizeObserver`. No dependencies beyond React.
