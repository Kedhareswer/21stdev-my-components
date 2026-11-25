# Pestle Pharmacy Hero

A hero for an invented neighbourhood pharmacy that handles repeat prescriptions. It comes up as one sequence, on one clock, in about 2.9 s:

1. A count runs while the two capsule pictures and the fonts load.
2. The capsule, closed, drops into the room and lands on the floor with a small bounce, and its contact shadow lands with it.
3. The capsule pulls open. The cap slides off the base (its inside appears as it clears) and floats up behind the headline. The red base stays on the floor in front of the foot of the letters.
4. "Refills." rises letter by letter between the two halves.
5. The nav, the copy and the button arrive last.

The two halves are the same two elements from the first frame to the last. Any click, key press, wheel or touch skips to the end. Light comes from a window at the upper left, so the shadows fall to the right.

```tsx
import { PestlePharmacyHero } from "@/components/ui/pestle-pharmacy-hero"

export default function Page() {
  return <PestlePharmacyHero />
}
```

## Props

| Prop | Default | |
|---|---|---|
| `height` | `"100svh"` | Any definite CSS length. A percentage needs a parent with a height. |
| `ctaLabel` | `"Set up my refills"` | The one filled button. |
| `ctaHref` | `"#refills"` | |
| `intro` | `true` | `false` starts on the finished hero, with no count and no motion. |
| `className` | `""` | Added to the root `<section>`. |

## Notes

- No dependencies beyond React. Fonts are embedded as Latin subsets: Young Serif for the headline and wordmark, Instrument Sans for the rest. Both are under the SIL Open Font License; together they add 35 kB.
- Every size is in container units of the root, so the weave holds at any width. Under 700 px wide, the word moves under the nav with the cap tucked behind it, the base lies below, and the copy sits at the bottom.
- The capsule halves were generated for this component and are served from `kedhar-components.pages.dev`.
- Light and dark: the wall, floor and type colours switch under `.dark`. The capsule is the same photograph in both.
- Reduced motion: no count and no motion; the finished hero shows at once.
- The intro waits for the pictures. If they never arrive, it starts after 6 s.
- The brand and copy are invented. "Pestle" is not a real pharmacy.
