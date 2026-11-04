# Aurora Ring Button

A dark call-to-action with a living gradient. A thin ring of four colours turns slowly around the pill while a blurred copy of it glows underneath. Inside, three soft blobs of the same colours drift like an aurora behind a darkening veil. On hover the aurora brightens, the glow swells, the pointer cuts a bright pool through the veil wherever it moves, a gold glint sweeps across the label, the star turns, and three sparkles twinkle around the edge. Pressing flashes the core.

It reads on dark and light pages alike. Under `prefers-reduced-motion` the ring, aurora and sparkles hold still.

```tsx
import AuroraRingButton from "@/components/ui/aurora-ring-button"

<AuroraRingButton size="lg" onClick={upgrade}>Get Pro</AuroraRingButton>
<AuroraRingButton href="/trial" colors={["#ff7a59", "#ff3d81", "#8a5cff", "#2ec5ff"]}>Start free trial</AuroraRingButton>
```

## Props

| Prop | Default | |
|---|---|---|
| `children` | `"Get Pro"` | Label. |
| `href` | none | Renders an `<a>` instead of a `<button>`. |
| `onClick` | none | Click handler. |
| `size` | `"md"` | `"md"` (46 px) or `"lg"` (62 px). |
| `colors` | teal, violet, pink, amber | Four colours for the ring, glow and aurora. |
| `sparkles` | `true` | Twinkling sparkles on hover. |
| `font` | system sans stack | CSS `font-family`. |

The ring is a CSS `@property` angle animation. The spotlight measures the button once when the pointer enters and only reads that cache while it moves. No dependencies beyond React.
