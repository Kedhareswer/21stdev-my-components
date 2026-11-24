# Molten Ink Template

A one-page studio site in hot yellow and black, built around liquid.

- **Loader.** On navy, one dot splits into an X mark, which turns yellow and melts away. A field of dots grows out from the centre, merges row by row into wavy stripes, and floods the screen yellow.
- **Hero.** A huge wordmark appears, and a script word writes itself after it. A stroke of black ink sweeps across the page and retracts. After that, the ink follows the pointer. Wherever it crosses the letters, they turn to iridescent chrome. A transparent gadget floats in the middle.
- **Showreel.** A panel that grows from an inset card to full bleed as you scroll.
- **Manifesto.** It sits under a curved yellow edge that bulges with the scroll, and its lines rise in one by one.
- **Work grid.** Twelve gadgets. A roaming liquid blob uncovers a coloured tile behind each one, with the client name on it. It follows the pointer when the pointer is over the grid.
- **Footer.** Black, with a big sign-off and a gloved peace sign. Yellow ink drifts across the sign-off and follows the pointer.

Everything liquid comes from one small WebGL metaball renderer, used in three modes; the loader has its own shader. React is the only dependency.

## Usage

```tsx
import { MoltenInkTemplate } from "@/components/ui/molten-ink-template"

export default function Page() {
  return <MoltenInkTemplate />
}
```

```tsx
<MoltenInkTemplate
  name="Kedhar"
  script="studio"
  tagline="A small studio for interfaces, motion and components"
  manifesto={["Kedhar is a one-person", "design studio built on craft and curiosity."]}
  works={[{ image: "/work/01.webp", title: "Client 1", kind: "Interface", year: "2026", tile: "#ff4b3a" } /* twelve read best */]}
  email="you@example.com"
  signoff="Reach out"
/>
```

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `height` | `string` | `"100svh"` | Height of the hero and the loader. Must be a definite length. |
| `name` | `string` | `"Kedhar"` | The bold half of the wordmark. Also used in the footer. |
| `script` | `string` | `"studio"` | The script word that writes itself after the name. |
| `tagline` | `string` | a short line | Shown under the wordmark. |
| `manifesto` | `string[]` | four lines | One string per line. The first line is indented on wide screens. |
| `works` | `MoltenWork[]` | 12 hosted gadgets | `{ image, title, kind, year, tile }`. `tile` is the colour the blob uncovers. Images should be transparent cut-outs. |
| `email` | `string` | Kedhar's address | Contact link in the footer. |
| `signoff` | `string` | `"Reach out"` | Big footer line. |
| `skipLoader` | `boolean` | `false` | Start on the hero without the navy loader. |
| `className` | `string` | | Added to the root. |

## Timeline (seconds after mount)

| Phase | Time |
|---|---|
| Dot, then the X mark | 0 – 0.8 |
| X turns yellow, then melts | 0.82 – 1.35 |
| Dot field grows and merges into stripes | 1.2 – 2.25 |
| Yellow flood, loader fades | 1.95 – 2.75 |
| Hero in, ink swoosh | 2.4 – 3.9 |
| Script word writes, gadget rises | 2.75 – 3.6 |

## Notes

- Fonts (Inter Tight and Caveat) load from Google Fonts through a `<link>` the component adds once.
- The default pictures are hosted at `kedhar-components.pages.dev/molten-ink-template/`. Pass your own `works` to replace them.
- With `prefers-reduced-motion: reduce`, the loader is skipped. The ink, blob and drift stop, and every section shows its final state.
- If WebGL is unavailable or the context is lost, the liquid canvases hide themselves, leaving the page without the ink layers.
- The colours are fixed (yellow, black and navy), so the page looks the same in light and dark themes.
