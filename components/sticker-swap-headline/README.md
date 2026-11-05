# Sticker Swap Headline

A poster-weight hero headline whose last word keeps changing. Each change runs as one quick sequence: the round photo sticker pops off, the word line rolls up to the next word (arriving pale and inking in), the letters part where its "O" was, and the next sticker pops into the gap with a small overshoot. About 0.9 s of motion, then the word holds.

Click the word (or focus it and press Enter) to move on. Autoplay pauses while the hero is off-screen or the tab is hidden. `spin` turns a sticker slowly like a record.

Requires `gsap`. The headline face (Anton, Latin subset) is embedded.

```tsx
import StickerSwapHeadline from "@/components/ui/sticker-swap-headline"

<StickerSwapHeadline
  lead="Stay"
  words={[
    { word: "Curious", sticker: "/orange.webp", alt: "A halved orange" },
    { word: "Loud", sticker: "/record.webp", alt: "A vinyl record", spin: true },
    { word: "Golden", sticker: "/sunflower.webp", alt: "A sunflower head" },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `words` | required | `{ word, sticker, alt?, spin?, tilt? }[]`. The sticker replaces the word's first "O"; with no "O" it lands after the word. Use square photos with the subject centred; they are cut round with a white die-cut edge. |
| `lead` | `"Stay"` | The fixed first line. |
| `description` | none | Copy under the headline. |
| `primaryCta` / `secondaryCta` | none | `{ label, href?, onClick? }`. |
| `interval` | `2800` | Milliseconds per word. `0` turns autoplay off. |
| `paper` / `ink` / `accent` | `#efe5d3` / `#1b140e` / `#e2532d` | Background, text and button colours. |
| `fontFamily` | embedded Anton | Any condensed display face works best. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |
| `onChange` | none | `(index)` on every word change. |

With `prefers-reduced-motion`, words cross-fade and the stickers neither pop nor spin.
