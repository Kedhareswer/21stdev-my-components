# Teal Treasury Landing

A complete treasury / cash-management landing page in one component: cream
paper, deep-teal ink, an olive-gold accent and a lilac secondary. The hero holds
a working product rather than a screenshot, and the page moves with the scroll
through GSAP ScrollTrigger.

Sections, top to bottom:

- **Nav**: sticky, picks up a frosted surface once the page scrolls, with a
  fold-out *Products* panel, a mobile sheet and a gold scroll-progress hairline.
- **Hero**: the headline rises out of line masks. Below it a dashboard in a
  device bezel lies back in perspective and stands up as it scrolls into view,
  with two floating transfer cards drifting at their own speeds.
- **Benefits**: a statement that inks in word by word as you scroll, then stats
  that count up over hairlines that draw in.
- **Features**: a sticky stage that unfolds from a rounded inset and morphs
  between three live scenes as each block of copy reaches the middle of the
  screen. On phones each block carries its own scene.
- **Coverage**: four guarantees and an FDIC calculator. Drag the deposit slider
  and a field of 500 program banks lights up.
- **Pricing**: a dark block with a flat fee, the included features (ticks draw
  in), an expandable add-on and a cost comparison you can step.
- **FAQ**, a **call to action** on pointer-lit glows, an **operating-account**
  card with a dial that turns with the page, **resources** with drawn covers and
  a **footer** whose giant wordmark rises letter by letter.

```tsx
import TealTreasuryLanding from "@/components/ui/teal-treasury-landing"

<TealTreasuryLanding
  brand="Orchard"
  palette="plum"
  onTransfer={(t) => fetch("/api/transfers", { method: "POST", body: JSON.stringify(t) })}
  onGetStarted={(email) => fetch("/api/signup", { method: "POST", body: JSON.stringify({ email }) })}
/>
```

**Requires `gsap`** (`npm install gsap`), for `gsap` and `gsap/ScrollTrigger`.
Nothing else beyond React. The dashboard, the phone, the dial, the resource
covers and the marks are SVG and CSS drawn in the file, and the type is the
system stack (Inter Tight or Inter when installed). Nothing loads at runtime, so
it renders inside the 21st capture sandbox. Every brand, person and number in
the defaults is made up, and the footer says so.

## Play with it

| Do this | And |
|---|---|
| Scroll from the top | The dashboard tilts flat, the floating cards drift, the benefits statement inks in and the stats count up |
| Click an account card | *Move money* opens with that account as the source |
| Move money | Pick from and to (picking the same account swaps them), type an amount or use a chip, *Review*, *Confirm*. Balances, the sidebar, the breakdown bar, *Recent activity* and the floating *Internal transfer* card all follow. The total never changes |
| Ask for more than an account holds | The transfer is refused with the reason |
| Switch 1M / 3M / 1Y | The balance chart morphs to the new range |
| Hover the cash-breakdown bar | Each segment lifts and names its balance. Click an account in the sidebar to spotlight it |
| *Activity* | The ledger, filterable by incoming and outgoing, with your transfers on top |
| Scroll the features | The stage morphs between scenes. *Add accounts* replays the setup; tick rows on and off. On the phone, *Request a line of credit* opens a sheet with a slider. *Accounts / Funds* regroups the report |
| Drag the coverage slider | Insured amount, program banks and anything above the limit count to their values; the bank field fills in a wave |
| Step the entity count under pricing | The comparison bars re-cost |
| *Get started* (nav, hero or CTA) | Scrolls to the call to action, where the button morphs into an email field and takes focus. Inline validation, then a confirmation |
| Move the pointer over the CTA | The glows follow it at different speeds |

## Props

| Prop | Default | Description |
|---|---|---|
| `brand` | `"Vaultline"` | Wordmark in the nav, the dashboard and the footer, and in the default copy. |
| `logo` | drawn vault mark | Replaces the mark beside the wordmark. |
| `nav` | *Products* panel, *Pricing*, *Resources*, *Sign in*, *Get started* | `{ products?: { label, text, href? }[], links?, login?, cta? }`. An `href` of `#dashboard`, `#benefits`, `#features`, `#coverage`, `#pricing`, `#faq`, `#get-started` or `#resources` scrolls within the page. `null` hides it. |
| `hero` | *Treasury—centralized capital management* | `{ title?, text?, primary?, secondary? }`. Wrap words in `*asterisks*` for the accent; `\n` breaks the line (pass it in braces). `null` hides the headline but keeps the dashboard. |
| `accounts` | Operating, Money market, Vault ($63,256,000) | `{ id, name, kind, balance }[]`. Three read best; the charts take a colour each. |
| `activity` | 5 entries | `{ id, date, text, account, amount, status: "Settled" \| "Pending" \| "Scheduled" }[]`. Negative amounts are outgoing. |
| `fund` | `"Vaultline Fund II, L.P."` | The fund in the dashboard's breadcrumb. |
| `benefits` | statement + 3 stats | `{ label?, text?, stats?: { value, label, prefix?, suffix?, decimals? }[] }`. `*asterisks*` for the accent. `null` hides it. |
| `features` | 3 features | `{ label?, items?: { title, text }[] }`. Up to three; scenes go setup, phone, reporting in order. `null` hides it. |
| `coverage` | $125M over $250K per bank | `{ title?, limit?, perBank?, items?: { title, text }[] }`. The slider runs from one bank's worth to twice the limit. `null` hides it. |
| `pricing` | *$5k annual fee* | `{ label?, price?, unit?, intro?, items?: string[], addon?: { title, text }, note?, annual? }`. `annual` is the yearly cost for the comparison; `null` hides the comparison. `null` hides the section. |
| `faq` | 9 questions | `{ label?, title?, items?: { q, a }[], contact? }`. `null` hides it. |
| `cta` | *Ready to experience … Treasury?* | `{ title?, text?, button?, secondary? }`. `null` hides it. |
| `operating` | *Looking for a venture operating account?* | `{ title?, text?, link? }`. `null` hides it. |
| `resources` | 4 cards | `{ title?, items?: { title, tag, art?: "dashboard" \| "report" \| "line" \| "multi", href? }[] }`. `null` hides it. |
| `footer` | 5 columns | `{ columns?: { title, links }[], legal? }`. `null` hides it. |
| `palette` | `"teal"` | `"teal"`, `"plum"`, `"graphite"`, or any subset of `{ page, paper, ink, muted, rule, deep, deepInk, deepMuted, gold, lilac, lilacInk, accent, accentInk, good, chart: [a, b, c], glow: [a, b, c] }` laid over teal. |
| `onTransfer` | — | Called with `{ from, to, amount, memo }`. Return (or resolve to) `false`, or throw, to show an error. Without it the transfer fakes a 0.95 s send. |
| `onGetStarted` | — | Called with the email. Same contract. |
| `height` | `"100svh"` | Minimum height of the page. |

## Notes

- The page keeps its own colours in both host themes. It's a brand page, not a
  themed widget. Colours are CSS variables on the root, so `palette` reaches the
  dashboard, the SVG art, the charts and the glows alike.
- All scroll motion is created in one `gsap.matchMedia()` inside a layout
  effect, with selectors scoped to the root, and reverted on unmount. A
  `ResizeObserver` refreshes the triggers when the page's height changes
  (accordions, fonts, host content).
- The root clips sideways with `overflow-x: clip` rather than `overflow: hidden`,
  which would break the sticky nav and the sticky feature stage.
- Hover lifts use the `translate` property so they never fight GSAP for
  `transform`.
- Under `prefers-reduced-motion` nothing is scroll-linked, numbers land without
  counting, nothing loops, and in-page links jump.
- The coverage calculator and the cost comparison are stated illustrations, not
  quotes. Change the copy if you change the formulas.
