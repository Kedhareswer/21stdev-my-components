# Pulse Stripe Hero

A landing-page opener in three beats. First, a card split into vertical stripes. By default it is deep ink lit like a street at night: warm sodium-lamp beams run down the stripes in a slow wave, a low lamp glow breathes along the bottom edge, and a stripe flares under the pointer. The card holds an editorial serif headline with an italic phrase in lamp colour, the copy, a button, and four stats that count up when it comes on screen. Below it a band of customer wordmarks drifts by and pauses on hover. Last, a serif statement lights up word by word as it scrolls through the middle of the screen.

On load the card opens out from an inset clip, the stripes rise from the bottom (centre first), and the headline lifts out of a mask.

There are three worlds: `sodium` (night ink and street lamps, the default), `paper` (newsprint and vermilion, like a two-colour print), and `mercury` (slate under moonlight).

Requires `gsap` (with ScrollTrigger). Instrument Serif (regular and italic) and Inter Tight (variable), Latin subsets, are embedded.

```tsx
import PulseStripeHero from "@/components/ui/pulse-stripe-hero"

<PulseStripeHero
  eyebrow="Overnight freight, routed live"
  title="Freight that moves *while the city sleeps.*"
  cta={{ label: "Book a route review", href: "/contact" }}
  stats={[{ value: 1.2, decimals: 1, suffix: "M", label: "Parcels routed a night" }, { value: 412, label: "Depots" }]}
  logos={["Halvard Freight", "NORTHGATE", "Basalt Rail"]}
  statement="Most networks plan the night at six and hope."
  palette="sodium"
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `title` | `"Freight that moves *while the city sleeps.*"` | `*phrase*` sets it in italic, in the glow colour. |
| `eyebrow` / `description` | sample copy | Card copy. |
| `cta` | `{ label: "Book a route review" }` | `{ label, href?, onClick? }`. |
| `stats` | four samples | `{ value, decimals?, prefix?, suffix?, label }[]`. Up to four fit a row; under 720 px they go two per row. |
| `logos` | eight names | Set as wordmarks in rotating styles. `[]` hides the band. |
| `statement` / `statementLabel` | sample copy | The scroll-lit paragraph. `""` hides it. |
| `palette` | `"sodium"` | `"sodium"`, `"paper"`, `"mercury"`, or `{ from, to, glow, ink }` (card top, card bottom, beam colour, text). |
| `stripes` | `16` | Stripe count. |
| `height` | `"calc(100svh - 24px)"` | Card height. Keep it a definite length. |

Outside the card it uses the host's `--color-background`, `--color-foreground` and `--color-muted-foreground`, so it sits right in light and dark themes. With `prefers-reduced-motion` the stripes, lamp and band hold still, the stats show their final values, and the statement is fully lit.
