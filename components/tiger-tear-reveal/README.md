# Tiger Tear Reveal

A scroll-driven poster hero. The page starts as a plain slogan: a small
tagline over one huge red word. Scroll, and a crack runs out from the middle of
the word, the sheet rips in two along it, and the halves pull apart: the top
lifts, the bottom drops, each tipping like real paper, with white torn edges
and curls. From behind, a tiger rises into the gap and opens its eyes. Once it
is looking, the eyes follow your pointer and blink; click and they squint at
you. Scroll back up and the paper closes again.

**No dependencies.** React is the only import. The fur, the stripes, the
irises and the torn paper are all SVG built from numbers: no images, no fonts
to load. The tear and the fur are seeded, so they are the same every visit.

## How it plays

| Scroll | What happens |
|---|---|
| 3 to 20% | a crack runs out from the middle of the word |
| 18 to 62% | the sheet tears in two, the stage jolts, the halves part |
| 26 to 74% | the tiger rises into the gap, eyes shut |
| 58 to 88% | its eyes open, a little too wide, then settle |
| after | pupils track the pointer (or wander), blinks every few seconds |

The stage is `position: sticky` inside a taller section, so it stays pinned
while the tear plays over `scrollDistance`.

## Usage

```tsx
import TigerTearReveal from "@/components/ui/tiger-tear-reveal"

<TigerTearReveal />                                   // COURAGE / HAVE NO FEAR
<TigerTearReveal word="FEARLESS" tagline="STAY WILD" ink="#111" eyeColor="#9fd14a" />
<TigerTearReveal progress={1} />                      // already torn, no scroll
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `word` | `"COURAGE"` | Stretched to a fixed width, so any length fits. |
| `tagline` | `"HAVE NO FEAR"` | Empty hides it. |
| `ink` | `"#cf2e3d"` | Word colour. |
| `paper` | `"#f2f1ee"` | Page colour. |
| `taglineColor` | `"#2a2a2a"` | |
| `eyeColor` | `"#f0a526"` | Iris. |
| `furColor` | `"#d9832c"` | |
| `fontFamily` | Anton / Impact / Bebas Neue / Oswald… | Any bold face; nothing is loaded. |
| `height` | `"100svh"` | Pinned stage height. **Must be a definite length.** |
| `scrollDistance` | `"160svh"` | Extra scroll the tear plays over. |
| `progress` | none | `0..1` to drive it yourself; disables scroll. |
| `hint` | `true` | The small "scroll" cue before the tear starts. |
| `className` | `""` | Appended to the root. |

## Notes

- Do not put it inside an element with `overflow: hidden` or `auto`: that
  breaks `position: sticky`. The root uses `overflow: clip` for that reason.
- Reduced motion: the tear snaps open instead of animating, and the eyes do
  not wander or blink.
