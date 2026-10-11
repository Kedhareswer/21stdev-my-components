# Focus Pull Carousel

A horizontal image strip that racks focus like a camera lens. The centre
picture is sharp and full size; its neighbours soften, shrink and fade by how
far they sit from the middle, updating continuously as you scroll, swipe or
drag.

Built on native scroll snapping, so trackpads, touch momentum and the keyboard
behave like the platform. Mouse drag, ←/→, the buttons, and click-a-neighbour
all work. Autoplay waits until nobody has touched it for one interval.

**No dependencies.** Slides without an `image` get a painted landscape. The
page colours follow `--color-background` / `--color-foreground`.

```tsx
import FocusPullCarousel from "@/components/ui/focus-pull-carousel"

<FocusPullCarousel />
<FocusPullCarousel height={720} aspect="4 / 5" cardWidth="min(70vw, 420px)" blur={10} slides={photos} />
```

| Prop | Default | |
|---|---|---|
| `slides` | six painted landscapes | `{ image?, title?, caption?, alt?, palette?, seed? }` |
| `height` | `"100svh"` | Any CSS length |
| `cardWidth` | `"min(max(64vw, 290px), 920px)"` | Width of one picture |
| `aspect` | `"3 / 2"` | CSS aspect-ratio of a picture |
| `blur` | `7` | Blur in px one card from centre, `0` = off |
| `autoplay` | `5000` | ms per slide, `0` = off |
| `background` / `ink` | theme tokens | Page colours |
| `onChange` | | `(index) => void` |

Reduced motion keeps the strip but drops the blur.
