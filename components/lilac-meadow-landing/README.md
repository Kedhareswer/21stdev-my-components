# Lilac Meadow Landing

A complete landing-page template for a yield-bearing stablecoin, in a soft
"money grows" art direction: chrome coins half buried in a meadow of tiny lilac
flowers under a pale lavender sky. The page continues in the same hand: a
"what is it" statement, three feature cards (a coneflower growing beside a
coin, a dollar-peg chart, an autopilot switch), a backers strip, tabbed use
cases illustrated in lavender clay (a temple, code blocks, a growing coin
stack), a yield calculator with a live chart, an FAQ, a join-the-beta band and
a footer.

```tsx
import LilacMeadowLanding from "@/components/ui/lilac-meadow-landing"

<LilacMeadowLanding
  brand="Petalpay"
  tokenName="Rose Dollar"
  ticker="RUSD"
  palette="rose"
  hero={{ title: "Savings in\nFull Bloom", subtitle: "…", action: { label: "See it grow", href: "#calculator" } }}
  calculator={{ apy: 4.6, benchmarkApy: 0.45 }}
  onJoin={(email) => fetch("/api/waitlist", { method: "POST", body: email })}
/>
```

**No dependencies beyond React.** The meadows are painted on `<canvas>` from a
seeded PRNG: thousands of florets clumped into bushes lit from the upper left,
dried grass straws, three depth layers with atmospheric haze. The coins,
coneflower, temple, blocks and coin stack are SVG with gradients. No fonts,
images or stylesheets load, so it renders inside the 21st capture sandbox.

## Play with it

| Do this | And |
|---|---|
| Move the pointer over the hero | Three meadow layers and the coins part in parallax |
| Click a coin | It flips and pops the current APY |
| Click *Business*, *Treasury* or *Developers* in the nav | Scrolls to the use cases and opens that tab |
| Use ← → / ↑ ↓ on the use-case tabs | Moves between them; they also auto-advance until you hover |
| Drag the deposit slider, pick 6M–5Y, toggle compounding | The chart re-grows and the totals update |
| Hover the chart | A crosshair reads out both balances for that month |
| Hover a feature card | The coneflower sways faster; the peg line redraws |
| Flip the *Auto* switch | The orbit stops and starts |
| Send the join form | Bad addresses shake; good ones get a confirmation |

On load the meadow grows in layer by layer and the headline rises. Pollen
drifts up through the hero (fireflies in dark mode), the code blocks float and
the sprout on the coin stack sways.

## Props

| Prop | Default | Description |
|---|---|---|
| `brand` | `"Florin"` | Nav, footer and the giant footer wordmark. |
| `tokenName` | `"USD Florin"` | Used in headings and default copy ("What is USD Florin?"). |
| `ticker` | `"USDF"` | Calculator legend. |
| `logo` | four-point sparkle | Replaces the mark beside the brand. |
| `nav` | token, Business, Treasury, Developers, Join us | `{ label, href }[]`. `#product`, `#features`, `#use-cases`, `#calculator`, `#faq`, `#join` scroll in-page; `#<use case id>` opens that tab. Anything else is a normal link. |
| `cta` | `Launch BETA → #join` | Nav button. `#join` also focuses the email field. |
| `hero` | — | `{ title, subtitle, action, image, imageAlt }`. `\n` in `title` breaks the line. `image` swaps the painted meadow for a photo. |
| `intro` | — | `{ title, body, action }` for the "What is …?" row. |
| `features` | 3 cards | `{ title, body, visual }[]`. `visual` is `"flower"` (light card with the coneflower), `"peg"` or `"autopilot"` (dark cards). `\n` in `title` is kept. |
| `backersLabel` / `backers` | 7 fictional names | `{ name, glyph?, href? }[]`. `glyph` is `"ring"`, `"bars"`, `"wave"`, `"leaf"`, `"hex"`, `"spark"` or `"arch"`. Empty array hides the strip. |
| `useCasesCopy` / `useCases` | Business, Developers, Treasury | `{ id, title, body, action?, art? }`. `art` is `"temple"`, `"blocks"` or `"vault"`. |
| `calculator` | — | `{ kicker, title, body, apy, benchmarkApy, benchmarkLabel, defaultDeposit, disclaimer }`. Defaults to 5.12% vs 0.45%. |
| `faqCopy` / `faqs` | 5 questions | `{ q, a }[]`. Empty array hides the section. |
| `join` | — | `{ title, body, placeholder, action, success }`. |
| `onJoin` | — | `(email) => unknown`. Awaited; a throw shows an error instead of the confirmation. |
| `tagline` / `columns` / `socials` / `legal` / `copyright` | sensible defaults | Footer. `socials` kinds: `"x"`, `"discord"`, `"telegram"`, `"github"`. |
| `palette` | `"lilac"` | `"lilac"`, `"rose"` or `"cornflower"` — re-colours flowers, sky, coins, clay and buttons. |
| `theme` | `"auto"` | `"auto"` follows a `.dark` class on an ancestor; `"light"` / `"dark"` force it. |
| `animateIn` | `true` | The grow-in on load. |
| `height` | `"100svh"` | Minimum page height. Always a definite length. |
| `className` | `""` | Extra classes on the root. |

## Notes

- **Dark mode is dusk, not a filter.** The canvases repaint with a night
  palette: indigo sky, moonlit flowers, darker metal, fireflies for pollen.
- **Repaints are cheap and rare.** Each canvas paints once per size and theme
  (debounced on resize), with the floret count capped and only the band that
  shows above the next layer filled in.
- **Small screens.** The nav folds into a menu, coins shrink and move apart,
  cards stack and the calculator puts its chart under the controls.
- **Accessibility.** Use cases are a tab list with arrow keys, FAQ rows are
  buttons with `aria-expanded`, compounding and *Auto* are switches, coins are
  labelled buttons, the slider announces its dollar value and the headline is a
  real `<h1>`.
- **`prefers-reduced-motion`.** No intro, parallax, pollen, flips, sway,
  tab auto-advance or chart tweening. Everything still opens and switches.
- **Reveal on scroll** only hides what starts below the fold, and only once JS
  runs, so server-rendered pages and screenshots are never blank.
- The calculator is illustrative — say so in your own `disclaimer`.
- Backer names are fictional. Swap in your own.
