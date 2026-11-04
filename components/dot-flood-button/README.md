# Dot Flood Button

An editorial outline button with a small breathing dot in front of the label. On hover the dot swells into a grained ink flood that fills the pill from the dot's own centre outward, the label slides into the space the dot left and its letters ripple once as they turn ivory, and an accent arrow swings in at the right. On leave the flood drains back into the dot. The whole button leans a few pixels toward the pointer.

Two tones: `ivory` (outline that floods ink) and `ink` (dark pill that floods ivory). Under `prefers-reduced-motion` the colours swap without the flood or ripple, and nothing leans.

```tsx
import DotFloodButton from "@/components/ui/dot-flood-button"

<DotFloodButton size="lg" href="/contact">Start a project</DotFloodButton>
<DotFloodButton tone="ink" accent="#ffb347" onClick={openWork}>See our work</DotFloodButton>
```

## Props

| Prop | Default | |
|---|---|---|
| `children` | `"Start a project"` | Label (a string; each letter ripples). |
| `href` | none | Renders an `<a>` instead of a `<button>`. |
| `onClick` | none | Click handler. |
| `tone` | `"ivory"` | `"ivory"` or `"ink"`. |
| `accent` | `#ff5a36` | Dot pulse and arrow colour. |
| `size` | `"md"` | `"md"` (46 px) or `"lg"` (64 px). |
| `pull` | `6` | How far the button leans toward the pointer, in px. `0` turns it off. Mouse only. |
| `font` | system sans stack | CSS `font-family`. |

The hover never changes the button's size, so nothing around it shifts. The grain is an inline SVG data URI; nothing is fetched. The lean measures once on pointer enter and reads only that cache while the pointer moves. No dependencies beyond React.
