# Sticker Swap Headline

A poster-weight hero headline whose last word keeps changing. The outgoing letters tip and drop off the line, the next word springs up from the baseline letter by letter, and a round photo sticker slaps down in place of its "O": it lands from above, squashes as it hits the paper, and settles at a tilt with its shadow pulling in. Under it sit a line of copy, two buttons, printer's crop marks and a caption naming the current sticker, all on warm grained paper.

Click the word (or focus it and press Enter) to move on. Autoplay pauses while the hero is off-screen or the tab is hidden. Hovering a sticker wiggles it; `spin` turns it slowly like a record.

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
  eyebrow="Ripe Studio — brand & packaging"
  description="We make labels, boxes and whole brands for food and music people."
  primaryCta={{ label: "Start a project", href: "/contact" }}
  secondaryCta={{ label: "See the work", href: "/work" }}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `words` | required | `{ word, sticker, alt?, spin?, tilt? }[]`. The sticker replaces the word's first "O"; with no "O" it lands after the word. Use square photos with the subject centred; they are cut round with a white die-cut edge. |
| `lead` | `"Stay"` | The fixed first line. |
| `eyebrow` | `"Independent studio"` | Small line above, with a progress bar and counter. |
| `description` | none | Copy under the headline. |
| `primaryCta` / `secondaryCta` | none | `{ label, href?, onClick? }`. |
| `interval` | `2800` | Milliseconds per word. `0` turns autoplay off. |
| `paper` / `ink` / `accent` | `#efe5d3` / `#1b140e` / `#e2532d` | Background, text and button colours. |
| `fontFamily` | embedded Anton | Any condensed display face works best. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |
| `onChange` | none | `(index)` on every word change. |

With `prefers-reduced-motion`, words cross-fade and the stickers neither spring, spin nor wiggle.
