# Mallow Support Template

A complete landing page for an AI support copilot, in one component. Every
picture on the page is a **painted meadow**: a soft sky, long grass leaning in
the wind and daisies, painted on canvas from a seed, brush stroke by brush
stroke, in the palette you choose. The grass keeps moving while it's on screen,
and it leans away when you brush the pointer through it.

The product sits in those paintings as working UI. The hero holds an inbox on
**autopilot**: tickets arrive, Mallow reads them, writes a reply and resolves
them or hands them to a person, and the counters move. Below it:

- **Three ways it works**: three painted cards, each with a small scene that
  plays when you reach it (a reply typing itself, sources syncing, a hand-off).
- **The feature story**: a painting stays put while you scroll three steps
  past it, and its card changes with each one: performance by range, a reply
  you can switch between four voices, and the overnight queue as a bar chart.
- **The platform tour**: four tabs (triage, auto-resolution, routing,
  reporting), each with its own app view. It advances on its own, with the
  progress bar in the tab as the timer.
- **Security**, **pricing** with a monthly/yearly toggle and a ticket-volume
  slider, **customer stories** with stats that count up, a **wall of quotes**
  in three slow columns, **questions**, a **sign-up band** with a "good
  morning" report card, and a **footer**.

```
http://localhost:5173/#mallow-support-template            # meadow: a homeware store's support team
http://localhost:5173/#mallow-support-template/lavender   # lavender: an IT service desk, its own copy and tickets
http://localhost:5173/?dark#mallow-support-template       # the night meadow
```

```tsx
import MallowSupportTemplate from "@/components/ui/mallow-support-template"

export default function Page() {
  return (
    <MallowSupportTemplate
      brand="Tern"
      palette="harvest"
      seed={3}
      hero={{ title: "Every customer answered,\neven at 3am.", workspace: "Tern Coffee" }}
      onGetStarted={(email) => fetch("/api/signup", { method: "POST", body: JSON.stringify({ email }) })}
      onContactSales={() => window.open("https://cal.com/you/demo")}
    />
  )
}
```

**No dependencies beyond React.** The paintings, the mark, the company glyphs,
the icons and the charts are drawn in the file. Two things load from outside,
and both are props:

- The faces, [Newsreader](https://fonts.google.com/specimen/Newsreader) and
  [Inter](https://fonts.google.com/specimen/Inter), from Google Fonts. Pass
  `fontHref={null}` for the system stack.
- The three customer-story photos, from [Unsplash](https://unsplash.com)
  (Unsplash License): Vitaly Gariev (`photo-1758272420990-30a0735e68a1`),
  Brian Kungu (`photo-1768244016593-8ca75b15bc92`) and Adeniji Abdullahi A
  (`photo-1633504564362-9097e06b1934`). A photo that can't load is replaced by
  a painting, so the page still looks finished offline or in a sandbox.

Every person, company and number in the defaults is made up.

## Play with it

| Do this | And |
|---|---|
| Watch the hero | A ticket arrives about every 5 seconds: *Reading*, then *Drafting* (the reply types itself), then *Resolved* or *To Priya*. The resolved count goes up |
| Click a ticket | Its conversation opens and stays put; **Follow live** goes back to the newest |
| Flip **Autopilot** | Arrivals stop; tickets already in progress still finish |
| Move the pointer across a painting | The grass leans away from it, then settles |
| Hover or focus **Product** | A menu with a live painting. ↓ opens it from the keyboard, Escape closes it. Under 1080 px the nav becomes a sheet |
| Scroll the feature story | The painting and card change with the step you're reading. Try **7d / 30d / 90d**, the four **voices**, **This week / Last week** and the bars |
| Platform tabs | Click or use ← →. Hovering or focusing the tour pauses it; picking a tab stops the auto-advance |
| Pricing | Yearly takes 20% off. Drag *Tickets a month*: Growth adds a block per extra 1,000, and Starter dims when the volume is past its allowance |
| Stories | Arrows or the company chips. Stats count up the first time you see them |
| Quotes | Three columns drift at different speeds; hover to pause |
| Any *Start* button | Scrolls to the sign-up form and puts the cursor in it. The form validates, shows a sending state, then a confirmation |

Under `prefers-reduced-motion` the paintings are still, the autopilot doesn't
add tickets, replies appear whole, the quote wall and logo strip stop and lay
out flat, and the tour doesn't advance on its own.

## Props

| Prop | Default | Description |
|---|---|---|
| `brand` | `"Mallow"` | The wordmark, and `{brand}` anywhere in the copy, including your own. |
| `logo` | drawn mark | Replaces the five-petal mark in the nav and footer. |
| `palette` | `"meadow"` | `"meadow"`, `"lavender"`, `"harvest"`, or `{ light?, dark? }` laid over meadow. Each side takes `paper`, `soft`, `card`, `ink`, `muted`, `rule`, `button`, `buttonInk`, `good`, `warn`, `hand` and `paint: { sky: [light, mid, deep], cloud, grass: [shadow, mid, light, tip], petal, shade, eye: [deep, light], warm }`. All hex: the painter blends them. |
| `theme` | `"system"` | `"system"` follows a `dark` / `light` class on `<html>`, then the OS. Dark paints the meadow at night. |
| `seed` | `0` | Shifts every painting; each value paints a different meadow. |
| `images` | `{}` | Photos in place of paintings, by scene: `hero`, `resolve`, `learn`, `escalate`, `smarter`, `voice`, `overnight`, `platform`, `pricing`, `story`, `cta`. |
| `fontHref` | Newsreader + Inter | A stylesheet URL for the faces, or `null` for the system stack. |
| `nav` | Product menu, Security, Customers, Pricing | `{ items?, login?, cta? }`. An item with `items` is a menu of `{ label, href?, text? }`. Hrefs `#top`, `#ways`, `#features`, `#platform`, `#security`, `#pricing`, `#stories`, `#faq` and `#start` scroll the page. `login: null` hides it. |
| `hero` | a homeware store | `{ badge?, badgeLabel?, title?, text?, primary?, secondary?, note?, workspace?, agent?, tickets? }`. A ticket is `{ name, subject, message, reply, channel?, handTo?, took? }`; `handTo` makes it a hand-off. `\n` in a title starts the softer second line. |
| `logos` | 8 made-up companies | Names for the logo strip and the pricing trust row; each gets a drawn glyph. `null` hides both. |
| `ways` | three cards | `{ eyebrow?, title?, items? }`. An item is `{ kind: "resolve" \| "learn" \| "escalate", title, text, from?, ask?, answer?, handTo?, sources?, image? }`: the last ones rewrite the card's little scene. |
| `features` | three steps | `{ eyebrow?, title?, button?, items? }` of `{ kind: "smarter" \| "voice" \| "overnight", title, text, image? }`. |
| `platform` | four tabs | `{ eyebrow?, title?, button?, tabs? }` of `{ label, kind: "triage" \| "resolve" \| "routing" \| "reporting", title, points: { title, text }[] }`. |
| `security` | four tiles | `{ eyebrow?, title?, text?, items? }` of `{ title, text, icon?: "shield" \| "lock" \| "key" \| "eye" }`. |
| `pricing` | Starter, Growth, Enterprise | `{ eyebrow?, title?, tiers?, yearlyDiscount?, trust? }`. A tier is `{ name, text, price, included?, per1000?, features, button?, featured? }`; `price: null` shows *Custom* and its button calls `onContactSales`. |
| `stories` | three customers | `{ eyebrow?, title?, items? }` of `{ quote, lead?, name, role, company, image?, alt?, stats: { value, label, prefix?, suffix?, decimals? }[] }`. The quote's first sentence (or `lead` words) is set in ink. |
| `testimonials` | 12 quotes | `{ eyebrow?, title?, items? }` of `{ quote, name, role, company }`. |
| `faq` | 6 questions | `{ eyebrow?, title?, items? }` of `{ q, a }`. |
| `cta` | *Give your team their mornings back.* | `{ title?, text?, button?, placeholder?, morning?, waiting? }`. `waiting` is the report card's list of `{ name, subject, tag }`. `null` hides the band; *Start* buttons then call `onGetStarted()` with no email. |
| `footer` | 4 columns | `{ tagline?, columns?, legal?, status? }`. |
| `onGetStarted` | — | Called with the email from the sign-up form. Return (or resolve to) `false`, or throw, to show an error. Without it the form fakes a 0.9 s send. |
| `onContactSales` | — | Called by Enterprise's button. Without it, that button scrolls to the form. |
| `height` | `"100svh"` | The page's minimum height; the hero takes up to 820 px of it. |

Every section prop takes `null` to hide that section.
