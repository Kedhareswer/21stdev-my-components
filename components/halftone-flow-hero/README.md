# Halftone Flow Hero

A SaaS hero card whose background is liquid marbling printed through a halftone screen. One WebGL fragment shader warps the flow and draws it as a rotated dot grid: dots swell where the colour runs thick, turn hot at the crests, and bloom under the pointer. On load the card settles in, the dots grow out of the dark, and the serif headline blurs in word by word. Below it, a glass prompt bar types example prompts out, holds, deletes them, and moves on; it is a real input, so typing your own replaces the placeholder.

Raw WebGL 1, no dependencies. The serif (Instrument Serif, regular and italic, Latin subset) is embedded.

```tsx
import HalftoneFlowHero from "@/components/ui/halftone-flow-hero"

<HalftoneFlowHero
  badge="Writing that sounds like you"
  title={"Your words,\n*only sooner.*"}
  prompts={["Rewrite this launch email…", "Turn my notes into an update…"]}
  ctaLabel="Start writing"
  onSubmit={(text) => router.push("/new?prompt=" + encodeURIComponent(text))}
  palette="ember"
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `title` | `"Your words,\n*only sooner.*"` | `*word*` sets italic in the hot colour, `\n` breaks the line. |
| `badge` / `description` | sample copy | Pill above and copy below the headline. |
| `prompts` | three writing prompts | Placeholders the bar types in turn. |
| `ctaLabel` | `"Start writing"` | Button label (hidden under 560 px, the arrow stays). |
| `onSubmit` | none | `(value)`: the typed text, or the prompt on show if the field is empty. |
| `proof` / `avatars` | sample line / `["MK","JL","AS"]` | Social-proof line and up to three initials. |
| `palette` | `"ember"` | `"ember"`, `"cobalt"`, `"jade"`, or `{ ground, flow, hot, text }`. |
| `dotSize` | `7` | Halftone cell in CSS pixels. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |

The card sits on the host's `--color-background` with a 12 px margin, so it frames itself in light and dark pages. The render loop stops while it is off-screen or the tab is hidden, the pixel ratio is capped at 2, and the GL context is released on unmount. Without WebGL it shows soft gradients in the palette. With `prefers-reduced-motion` the flow is drawn once, the placeholder shows in full, and nothing moves in.
