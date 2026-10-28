# Glass Pricing Cards

A pricing section of frosted-glass plans. A kicker, a title set in a pixel face drawn in code (it assembles from its pixels when reached), a lede and a monthly / yearly switch whose prices count to their new value. The plans rise into place one after another, the featured one last and lit in the accent. Cards tilt toward a mouse pointer with a spotlight that follows it.

The section paints its own plum backdrop with spectral silk. Pass `background="transparent"` to sit it on yours, for example over `mosaic-shader-background` in its `waves` scene.

**Requires `gsap`.** No fonts or images are loaded.

```tsx
import GlassPricingCards from "@/components/ui/glass-pricing-cards"

<GlassPricingCards onPlanSelect={(plan, yearly) => router.push("/checkout?plan=" + plan.name + "&yearly=" + yearly)} />
```

## Props

| Prop | Default | What it does |
|---|---|---|
| `kicker` | `"Pricing"` | The small label above the title. Empty to hide. |
| `title` | `"Simple plans"` | Drawn in the pixel face. |
| `lede` | one line | Under the title. |
| `plans` | Starter, Pro, Team | `{ name, price, blurb, features, cta, featured?, badge? }`. `price` is per period. |
| `currency` | `"$"` | Prefix for prices. |
| `yearlyDiscount` | `0.2` | Taken off on the yearly cycle. `0` hides the switch. |
| `period` | `"month"` | Unit after the price. |
| `accent` | `"ice"` | `ice`, `ember` or `lime`: featured plan, badge, checks. |
| `background` | plum silk | Any CSS background. |
| `onPlanSelect` | | `(plan, yearly)` from a plan button. |
| `className` | | On the root. |

Prices are whole units with thousands separators. Part of the Mosaic kit. The full page is `mosaic-prompt-template`.
