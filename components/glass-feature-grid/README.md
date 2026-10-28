# Glass Feature Grid

A features section of frosted-glass cards. A small kicker, a title set in a pixel face drawn in code (it assembles from its pixels when reached), a lede, then the cards. They drop into the grid one after another like tiles falling into place. Each card tilts toward a mouse pointer and carries a spotlight that follows it.

The section paints its own slate-and-spectrum backdrop. Pass `background="transparent"` to sit it on yours, for example over `mosaic-shader-background` in its `prism` scene.

**Requires `gsap`.** No fonts or images are loaded.

```tsx
import GlassFeatureGrid from "@/components/ui/glass-feature-grid"

<GlassFeatureGrid
  title="Built to ship"
  features={[{ icon: "spark", title: "Plain words in", body: "Describe it like you would to a teammate." }]}
/>
```

## Props

| Prop | Default | What it does |
|---|---|---|
| `kicker` | `"Features"` | The small label above the title. Empty to hide. |
| `title` | `"Built to ship"` | Drawn in the pixel face. |
| `lede` | one line | Under the title. |
| `features` | six | `{ icon, title, body }`. Icons: `spark`, `eye`, `code`, `chat`, `phone`, `rocket`, `window`, `bars`, `game`, `bolt`, `shield`, `globe`. |
| `columns` | `3` | `2` or `3` on wide screens. Two on tablets, one on phones. |
| `numbered` | `true` | Numbers each card 01, 02... |
| `accent` | `"#a9dcff"` | Kicker dot and icon on hover. |
| `background` | slate with spectral streaks | Any CSS background. |
| `className` | | On the root. |

Reduced motion shows the finished section with no entrance or tilt. Part of the Mosaic kit. The full page is `mosaic-prompt-template`.
