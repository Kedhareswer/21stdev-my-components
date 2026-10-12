# Murmuration Wordmark

Thousands of starlings over a dusk sky. The flock rolls and folds the way a
real murmuration does, in thin ribbons and dense dark knots, driven by a slow
curl-noise current and a wandering centre of gravity. Every few seconds it
converges, bird by bird, into your word, holds it, and scatters again.

**Move through it** and your pointer is a hawk: the flock tears open around it
and closes behind.

**No dependencies.** React is the only import. A 2D canvas for the sky, the
reeds and the birds; every bird is two strokes, batched into one path per
frame. Nothing is fetched.

```tsx
import MurmurationWordmark from "@/components/ui/murmuration-wordmark"

<MurmurationWordmark />

<MurmurationWordmark preset="dawn" word="north" birds={5200}>
  <YourNav />
</MurmurationWordmark>
```

## Props

| Prop | Default | |
|---|---|---|
| `word` | `"flock"` | The word the flock forms. Short and bold reads best. |
| `birds` | `4200` | How many starlings. Scaled down on small screens, capped at 9000. |
| `preset` | `"dusk"` | `dusk` · `dawn` · `paper` · `night` |
| `palette` | — | `{ skyTop, skyLow, sun, ink }` overrides. |
| `flyFor` | `7` | Seconds of free flight between formations. |
| `holdFor` | `3.2` | Seconds the word holds once formed. |
| `reeds` | `true` | The reed bed along the bottom. |
| `interactive` | `true` | The pointer is a hawk the flock flees. |
| `fontFamily` | Inter Tight → Helvetica | Face the word is sampled from. Heavy weights form cleaner letters. |
| `children` | — | Laid over the sky. Pointer events pass through, except links, buttons and `[data-interactive]`. |
| `height` | `100svh` | A definite length. |

## Notes

- **Why it looks alive.** The flight current is the curl of a field of
  travelling waves, so it is divergence-free: it folds and stretches the flock
  without ever piling birds into a point or punching holes in it. Cohesion only
  bites near the edge, which keeps the flock loose in the middle.
- **Performance.** One stroke call per depth layer per frame, whatever the bird
  count. Drawing stops while the sky is off-screen.
- **Accessibility.** The canvas is hidden from screen readers; the word is in
  the page as text.
- **Reduced motion.** The flock holds still.
