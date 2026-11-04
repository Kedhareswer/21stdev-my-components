# Aurora Feature Bento

A three-card SaaS feature bento over slow-drifting aurora light. Each card holds a small live interface in frosted glass, above a title and a line of copy.

1. **Prompt.** A message types itself out, bold phrases and all. Then the Generate button catches a sheen of light. Click Generate to type it again.
2. **Integrations.** A field of round tool tiles. The one under the pointer swells with a spring and glows in its colour, the rest shrink back, and the footer names the tool.
3. **Collaboration.** A shared form with a blinking caret and an access toggle, while two teammates' named cursors wander across it.

The cards rise in one after another, coming out of a blur, when the bento scrolls into view.

```tsx
import AuroraFeatureBento from "@/components/ui/aurora-feature-bento"

<AuroraFeatureBento
  prompt="Add a *step that asks for company size* before the *pricing question*."
  tools={["Relay", "Grid", "Hive", "Bolt", "Wave"]}
  people={["Meera Shah", "Theo Lund"]}
  features={[
    { title: "Forms that write themselves", description: "…" },
    { title: "Every tool, one canvas", description: "…" },
    { title: "Build it together", description: "…" },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `features` | three sample cards | `[{ title, description }] × 3`, in card order. |
| `prompt` | sample prompt | Typed in card one. Wrap words in `*stars*` to bold them. |
| `tools` | 15 sample names | Up to 15 tiles. Names are announced and shown on hover. The glyphs are built-in abstract marks, not brand logos. |
| `people` | `["Meera Shah", "Theo Lund"]` | The two cursor tags. |

## Notes

- React only. The aurora is three blurred blobs per card drifting on CSS transforms. Typing is a 38 ms interval, and the cursors are CSS keyframes. Nothing reads layout.
- The prompt is in an `sr-only` span, so screen readers get the full text, not the typing.
- Below 860 px the cards stack.
- `prefers-reduced-motion` shows the prompt typed out and stops the aurora, cursors, sheen and springs.
