# Pulse Stripe Hero

A landing-page opener in three beats. First, a saturated gradient card split into vertical stripes. A soft beam of light runs down each stripe in a slow wave across the card, and a stripe flares under the pointer. The card holds the eyebrow, headline, copy and button, plus four stats that count up when it comes on screen. Below it a band of customer wordmarks drifts by and pauses on hover. Last, a statement lights up word by word as it scrolls through the middle of the screen.

On load the card opens out from an inset clip, the stripes rise from the bottom (centre first), and the headline lifts out of a mask.

Requires `gsap` (with ScrollTrigger). The sans (Inter Tight, variable, Latin subset) is embedded.

```tsx
import PulseStripeHero from "@/components/ui/pulse-stripe-hero"

<PulseStripeHero
  title="Turn your data into decisions before lunch"
  cta={{ label: "Start free trial", href: "/signup" }}
  stats={[{ value: 99.99, decimals: 2, suffix: "%", label: "Uptime" }, { value: 6, suffix: "×", label: "Faster" }]}
  logos={["Halvard", "Orchard", "Basalt"]}
  statement="Northstar rebuilds last week's spreadsheet overnight."
  palette="cobalt"
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `title` / `eyebrow` / `description` | sample copy | Card copy. |
| `cta` | `{ label: "Start free trial" }` | `{ label, href?, onClick? }`. |
| `stats` | four samples | `{ value, decimals?, prefix?, suffix?, label }[]`; up to four fit a row, two per row under 720 px. |
| `logos` | eight names | Set as wordmarks in rotating styles. `[]` hides the band. |
| `statement` / `statementLabel` | sample copy | The scroll-lit paragraph. `""` hides it. |
| `palette` | `"cobalt"` | `"cobalt"`, `"ember"`, `"orchid"`, or `{ from, to, glow, ink }`. |
| `stripes` | `16` | Stripe count. |
| `height` | `"calc(100svh - 24px)"` | Card height. Keep it a definite length. |

Outside the card it uses the host's `--color-background`, `--color-foreground` and `--color-muted-foreground`, so it sits right in light and dark themes. With `prefers-reduced-motion` the stripes and band hold still, stats show their final values, and the statement is fully lit.
