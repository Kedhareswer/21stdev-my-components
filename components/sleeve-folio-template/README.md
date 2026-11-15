# Sleeve Folio

A one-page, dark portfolio for **Kedhareswer Naidu (Kedhar)**, AI engineer: a 3D collage of object studies that settles out of a steep tilt, photos that slide out of slanted coloured sleeves, a dealt hand of toolkit panels on a burnt-orange band, three drifting columns of kind words, and a fold-up contact card.

```tsx
import SleeveFolioTemplate from "@/components/ui/sleeve-folio-template"

export default function Page() {
  return <SleeveFolioTemplate />
}
```

## Props

| Prop | Default | |
|---|---|---|
| `height` | `"100svh"` | The root is its own scroll container, so it needs a definite height. |
| `imageBase` | `https://kedhar-components.pages.dev/sleeve-folio-template/` | Where the 22 pictures (`h-*.webp`, `w1..w11.webp`, `a-glass.webp`, `a-red.webp`) live. Point it at your own copies to self-host. |
| `className`, `style` | | Passed to the root. |

The two font subsets (Instrument Serif and IBM Plex Sans, both SIL OFL) load from the same base as `serif.woff2` and `sans.woff2`; Georgia and the system sans are the fallbacks.

## Motion

| Section | Trigger | What moves |
|---|---|---|
| Hero collage | load | stage `translateY(70) rotateX(-60deg) scale(1.5)` → rest, 4 s `cubic-bezier(0,.95,.2,.96)`; nine pieces flip in from `rotateY(20–180deg)` on springs, 0.5–1.3 s delays |
| Hero collage | scroll | tips back `rotateX(0 → -40deg)`, sinks `0 → 150px`, linear over 407 px (phone: -10deg / 10 px over 103 px) |
| Paragraphs, headings | enter view | rise 40 px + fade, soft spring (≈0.9 s, ~0.15% overshoot) |
| Section titles | enter view | words rise 50 px, 50 ms apart, 200 ms after the rest |
| About cards | enter view | `perspective(1500) translateY(180) rotateX(-50deg)` → rest, same spring, 150 ms apart; dots turn orange under the cursor |
| Work | enter / leave view | photo slides up 300 px out of its sleeve and tilts `-5deg` about its right edge on a bouncier spring (~9% overshoot); slides back when it leaves; on hover it lifts and the sleeve flips its slant |
| Toolkit | enter view | eight panels deal from `translateY(120) rotateX(-60) rotateY(70)` to `rotateX(-30) rotateY(50)`, 100 ms apart; hover lifts 70 px at 1.1× |
| Kind words | scroll | three columns start 70 / 200 / 400 px high and sink through 0 together over 745 px, under a top and a bottom fade |
| Contact card | enter view | folds up from `translateY(180) rotateX(-50deg)` |

Every reveal starts about 185 ms after its element enters the view. Springs are sampled into CSS `linear()` easings, so nothing animates in JavaScript except the two scroll mappings, which read `scrollTop` once per frame. `prefers-reduced-motion` shows every final state with no tilt or drift; hover lifts only run under `(hover: hover) and (pointer: fine)`.

## Layout

Desktop is a fixed 1240 px column (display serif 95 / 55 / 33 px, grotesk 22 / 18 px). Under 810 px it becomes a phone layout with 15 px gutters: a two-line menu button that opens the links, stacked cards, eleven smaller sleeves, toolkit panels stacked one per row, and a single column of quotes.

## Notes

- Root has `width: 100%`, so it fills a flex parent.
- Copy describes Kedhar; work is `Project 01`–`Project 11`; testimonials are `Client 1`–`Client 10`; contact is kedhareswer.12110626@gmail.com.
- The pictures are AI-generated photographs (ChatGPT) of fictional people and objects; no logos or watermarks. The nine hero pieces reuse crops of the project pictures.
