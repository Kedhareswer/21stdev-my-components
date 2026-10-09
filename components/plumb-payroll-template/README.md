# Plumb Payroll Template

A complete construction-payroll landing page in one component, laid out on a
drafting grid: hairline rails run down the page, dashed guides run out past
them, and every block is boxed in by its own rules.

The centre of it is a four-tab product tour. Each tab is a coloured panel cut
by diagonal lines and speckled strips, holding a live mock of the product:

- **Run in minutes**: a payrun with warnings you resolve (the totals move by
  exactly what each fix changes) before *Approve payroll* will go through.
- **Pay rates**: prevailing-wage, union and company rates by job, with each
  classification's fringe split into its funds.
- **Labor costs**: fully-burdened cost by job against budget, by week, month
  or year to date.
- **Compliance**: certified payroll and tax filings you can submit in one go.

Around it: a hero, customers, numbers that count up, a platform bento (a phone
you can clock in on, an ERP sync, multi-state withholding, pay options),
customer stories, a savings calculator, questions, a demo form and a footer.

```tsx
import PlumbPayrollTemplate from "@/components/ui/plumb-payroll-template"

<PlumbPayrollTemplate
  brand="Keelson"
  palette="harbor"
  onApprove={(run) => fetch("/api/payruns/approve", { method: "POST", body: JSON.stringify(run) })}
  onBookDemo={(data) => fetch("/api/demo", { method: "POST", body: JSON.stringify(data) })}
/>
```

**No dependencies beyond React.** The panels, the plumb-bob mark, the customer
logos, the phone and the sync diagram are SVG and CSS drawn in the file, and
the type is the system stack (Inter Tight or Inter when installed). Nothing
loads at runtime, so it renders inside the 21st capture sandbox. Every brand,
person and number in the defaults is made up.

## Play with it

| Do this | And |
|---|---|
| Leave the tour alone | It moves through the tabs on its own, a bar under the active tab counting down. It pauses while the pointer or focus is on it, or it's off screen, and stops for good once you pick a tab |
| Pick a tab, or use ← → | The panel changes colour, its lines redraw, and the next mock rises in |
| Move the pointer over the panel | The diagonal lines drift with it |
| *Approve payroll* with warnings open | The button refuses and the warnings flash |
| *Resolve* a warning | It turns green, and gross, net and the line items ease to their corrected values. *Undo* puts them back |
| Approve after resolving | A sending state, then *Approved* with the net amount and debit date, and an *Undo* |
| Switch jobs on *Pay rates* | Every rate eases to the new job's. Click a classification to see its fringe split |
| Toggle *Fully burdened*, pick a period | Bars and totals re-cost. Hover or focus a bar for its breakdown; the dark tick is the budget |
| *File all* on *Compliance* | Filings submit one by one, with a progress bar. *Reset* starts again |
| *Clock in* on the phone | A real timer runs. *Clock out* logs the shift under the chosen cost code |
| *Sync now* | The links to each system light up and run |
| Pick a crew member under *Multi-state taxes* | Hours and withholding split by state |
| Move the calculator sliders | The savings estimate counts to its new value |
| *Book a demo* (nav or calculator) | Scrolls to the form and puts the cursor in the email field. Inline validation, then a confirmation |

## Props

| Prop | Default | Description |
|---|---|---|
| `brand` | `"Plumb"` | Wordmark in the nav and footer, and in the default copy. |
| `logo` | drawn plumb bob | Replaces the mark beside the wordmark. |
| `nav` | 5 links, *Log in*, *Book a demo* | `{ links?, login?, cta? }` of `{ label, href? }`. An `href` of `#showcase`, `#customers`, `#platform`, `#stories`, `#calculator`, `#faq` or `#demo` scrolls within the page. `null` hides it. |
| `hero` | *Blazing-fast construction payroll.* | `{ title?, text?, link? }`. `\n` in `title` breaks the line; pass it in braces. `null` hides it. |
| `tabs` | 4 tabs | `{ kind: "run" \| "rates" \| "costs" \| "compliance", label, title, text }[]`. `kind` picks the mock; `title` and `text` are the caption under the panel. Any order, any subset. |
| `payrun` | Mar 30 – Apr 5 | `{ period, meta, alerts, stats, left, right }`. Figures are `{ label, value }`; a numeric value counts up. Each alert is `{ id, title, text, fixed, delta? }`, where `delta` maps a figure's label to the amount resolving it adds. |
| `rates` | 3 jobs × 5 classifications | `{ classes: string[], jobs: { name, kind, rates: [base, fringe][] }[] }`. |
| `costs` | 4 jobs | `{ name, code, wages, taxes, fringe, comp, budget }[]`, weekly amounts. |
| `filings` | 6 filings | `{ name, agency, scope }[]`. |
| `customers` | 6 made-up contractors | `{ title?, names?: { name, trade }[] }`. `null` hides it. |
| `stats` | 4 numbers | `{ value, label, prefix?, suffix?, decimals? }[]`. `null` hides them. |
| `platform` | — | `{ title?, text? }` for the bento's heading. `null` hides the bento. |
| `stories` | 3 quotes | `{ title?, quotes?: { quote, name, role, company, metric?: { before, after, label } }[] }`. `null` hides it. |
| `calculator` | — | `{ title?, text? }`. `null` hides it. |
| `faq` | 5 questions | `{ title?, items?: { q, a }[] }`. `null` hides it. |
| `cta` | *Run your next payroll in minutes.* | `{ title?, text?, button? }`. `null` hides the band and the form. |
| `footer` | 4 columns | `{ columns?: { title, links }[], note? }`. `null` hides it. |
| `palette` | `"forest"` | `"forest"`, `"harbor"`, `"clay"`, or any subset of `{ page, ink, muted, rule, guide, soft, accent, accentInk, warn, warnInk, good, panels: [panel, line][] }` laid over forest. The tour takes one panel pair per tab, in order. |
| `autoplay` | `7000` | Milliseconds per tab, or `false`. |
| `onApprove` | — | Called with `{ period, gross, net }`. Return (or resolve to) `false`, or throw, to show an error. Without it the approval fakes a 1.1 s send. |
| `onBookDemo` | — | Called with `{ email, crew }`. Same contract. |
| `height` | `"100svh"` | Minimum height of the page. |

## Notes

- The page keeps its own colours in both host themes. It's a brand page, not a
  themed widget. Colours are CSS variables on the root, so `palette` reaches
  the panels, the SVG art, the charts and the phone alike.
- The dashed guides run past the rails to the edge of the screen, so the root
  clips sideways with `overflow-x: clip` rather than `overflow: hidden`, which
  would break the sticky nav.
- Under `prefers-reduced-motion` the tour doesn't advance on its own, numbers
  land without counting, the panel art holds still and in-page links jump.
- The speckle texture is seeded, so the server and the client draw the same one.
- The savings calculator is a stated estimate (hours saved times your hourly
  cost, plus fewer correction runs), not a quote. Change the copy if you
  change the formula.
