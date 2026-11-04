# Heart Burst Button

A like button with a proper payoff. The heart squashes, springs past full size with a little twist, and fills with a pink gradient from its centre outwards. At the same moment a ring blooms and thins around it and a spray of tiny hearts and confetti dots flies out on scattered arcs. The count rolls like an odometer: only the digits that change slide, up on a like and down on an unlike, so 1,289 to 1,290 turns two wheels. Unliking deflates the heart and drains the fill.

The heart beats softly on hover. Light glass and dark smoked themes. Under `prefers-reduced-motion` the burst is skipped and the fill and digits swap without movement.

```tsx
import HeartBurstButton from "@/components/ui/heart-burst-button"

<HeartBurstButton count={24} />
<HeartBurstButton theme="dark" count={1289} liked={liked} onChange={(l) => setLiked(l)} />
```

## Props

| Prop | Default | |
|---|---|---|
| `count` | `24` | Likes from everyone else. The viewer's like adds one on top. |
| `defaultLiked` | `false` | Initial state when uncontrolled. |
| `liked` | none | Controlled state. |
| `onChange` | none | `(liked, total) => void`. |
| `theme` | `"light"` | `"light"` or `"dark"`. |
| `particles` | `14` | Particles per burst (half hearts, half dots). |
| `colors` | pink, coral, gold, violet | Burst palette. |
| `label` | `"Like"` | Accessible name; the total is appended. |
| `font` | system sans stack | CSS `font-family`. |

It's a toggle button (`aria-pressed`). Particle paths are deterministic per click, all CSS keyframes; no JavaScript runs per frame. No dependencies beyond React.
