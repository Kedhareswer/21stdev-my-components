# Afterglow Pricing

A subscription section with one loud card. Dashed, paper-white plan cards, a
Monthly / Annual switch with a sliding thumb and a discount chip, and a
featured plan lit from inside by a painted afterglow: a near-black card washed
in amber, coral and rose, with film grain, star specks that twinkle, and a
warm bleed underneath. A small app bar (brand, segmented tabs, action) sits on
top.

**No dependencies, no assets.** The glow and grain are painted on a canvas at
runtime (CSS gradients stand in until they land, and on the server). React is
the only import. Colours follow the installer's `--color-*` tokens, so it works
in light and dark.

```tsx
import AfterglowPricing from "@/components/ui/afterglow-pricing"

<AfterglowPricing />
<AfterglowPricing
  brand="Lumen"
  glow="lagoon"
  annualDiscount={0.2}
  plans={[{ label: "Pro", price: 24, features: ["Unlimited edits"], badge: "Best value", featured: true }]}
  onSubscribe={(plan, billing) => checkout(plan.label, billing)}
/>
```

| Prop | Default | |
|---|---|---|
| `plans` | four interior-design plans | `{ label, price, description?, features?, badge?, featured?, cta? }` (monthly price) |
| `title` | `"Subscription"` | |
| `currency` | `"$"` | |
| `annualDiscount` | `0.15` | `0` hides the chip |
| `defaultBilling` | `"monthly"` | `"monthly"` \| `"annual"` |
| `glow` | `"ember"` | `"ember"` \| `"aurora"` \| `"lagoon"` \| `"orchid"` \| `{ base, hi, mid, rose, deep, core }` |
| `glowFollowsSelection` | `true` | the glow moves to the subscribed plan |
| `currentLabel` | `"Current plan"` | button label on the subscribed plan |
| `showHeader` | `true` | the app bar |
| `brand` / `tabs` / `defaultTab` / `action` | Roomservice · Generate, History, Account · Reimagine interior | empty `action` hides the button |
| `onBillingChange`, `onSubscribe`, `onTabChange`, `onAction` | | callbacks |

Annual billing shows the discounted monthly price (cents only when there are
some), the struck-through original, and the yearly total. The lit card gets a
pointer-following light and parallax; the wand's sparkles twinkle on hover.
Keyboard: arrows flip the billing period. Reduced motion stops the drift, twinkles and number roll.
