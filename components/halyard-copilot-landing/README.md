# Halyard Copilot Landing

A complete landing page for an AI sales copilot, in one component. The page
lives in a sky that deepens as you scroll: pale steel at the top, cobalt
through the middle, night by the footer. Hairline rails and great orbit rings
run behind it, with small signals riding them.

The hero holds a **working copy of the product**. It lies back on a slight tilt
and straightens as you scroll to it. Below: how it works (told by scrolling), a
quote builder you can price, numbers, voices, a call to action, a book-a-demo
dialog and a footer.

```
http://localhost:5173/#halyard-copilot-landing         # steel, a flooring distributor
http://localhost:5173/#halyard-copilot-landing/dusk    # dusk, an electrical distributor, its own inbox and accounts
http://localhost:5173/?dark#halyard-copilot-landing    # the night sky
```

```tsx
import HalyardCopilotLanding from "@/components/ui/halyard-copilot-landing"

export default function Page() {
  return (
    <HalyardCopilotLanding
      brand="Ferrule"
      palette="dusk"
      title={"Every contractor gets\nyour best counter rep."}
      onSend={({ recipients, subject, html }) => fetch("/api/send", { method: "POST", body: JSON.stringify({ recipients, subject, html }) })}
      onBookDemo={(data) => fetch("/api/demo", { method: "POST", body: JSON.stringify(data) })}
    />
  )
}
```

**No dependencies beyond React.** The orbits, the mark, the icons, the charts
and the how-it-works diagrams are SVG drawn in the file; the type is the system
stack (Inter Tight / Inter when installed). The only remote files are the
avatar photos (Unsplash, every one a prop). Photos are shown in monochrome, and
an avatar that can't load falls back to initials, so the page still looks
finished without them.

## Play with it

| Do this | And |
|---|---|
| Scroll toward the app | It straightens out of its tilt; the orbits drift |
| Click a thread | Its AI draft streams in, then becomes an editable email |
| Type `/` | Focuses the inbox search. Search and *Active / Resolved / Dismissed* filter the list; groups fold |
| Select text, use the toolbar | Paragraph / Heading / Quote, bold, italic, underline, colour, alignment, lists, undo. The buttons light up for the selection |
| Remove a recipient chip, or type an address + Enter | Chips are validated; Backspace in an empty field removes the last one. *And 96 more* shows the segment |
| **Rewrite** | Re-streams the draft *Warmer*, *Shorter* or *More formal*, or back to the original |
| **Send** (or `⌘↵` in the body) | Progress, a confirmation, the thread moves to *Resolved* and the next draft opens. The toast has **Undo** |
| ⋮ on a thread | Mark resolved, dismiss or move back (each undoable), or snooze |
| **Customers** tab | Every account's 12-week purchasing as a sparkline, filter by slipping / growing, sort by change. **Draft outreach** opens the account's thread, or writes a new one from its history |
| **Ask AI** tab | Suggested questions or your own: who's buying less, what's low in stock, who to call first, or any account by name. Answers stream from the page's own data |
| Your avatar | Out of office, re-learn writing style, sign out |
| *How it works* | The diagram follows the step you're reading: data flowing in, drafts stacking up, a reply turning into an order. The bars jump between steps |
| *Quotes* | Pick an industry, **Draft quote**, then change quantities and the discount. Stock is split across warehouses (back-orders flagged), freight goes free over $2,500, and the margin meter warns below your floor, where *Send* becomes *Request approval* |
| Testimonials | Advance on their own; hover to pause, click a name to jump |
| Nav | Hover or click the dropdowns (↓ opens one from the keyboard). Under 1080 px it becomes a full-screen sheet |
| **Book a Demo** / **Get a demo** | A dialog with validation, a team-size picker, a sending state and a confirmation. Focus is trapped; Escape closes |

## Props

| Prop | Default | Description |
|---|---|---|
| `brand` / `tagline` | `"Halyard"` / `"Commerce"` | Nav, footer, the app and the footer wordmark. |
| `product` | `"Copilot"` | Under the brand inside the app. |
| `logo` | drawn mark | Replaces the bead-and-knot mark everywhere. |
| `nav` | Products, Industries, Company, Pricing, Resources | `{ label, href?, items?: { label, description?, href? }[] }[]`. Items make a dropdown. `#how`, `#quotes`, `#numbers`, `#voices`, `#contact`, `#product`, `#top` scroll in-page. |
| `login` | `Login` | `{ label, href? }`, or `null` to hide. |
| `demoAction` | `Book a Demo` | The nav's pill. Without an off-page `href` it opens the dialog. |
| `badge` | `One place for data → drafts → follow-up` | `→` (or `->`) is drawn as a hairline arrow. `null` hides it. |
| `title` | *What if every buyer thought they / were your only customer?* | `\n` breaks the line on wider screens. Pass it in braces so the newline is real. |
| `subtitle`, `primaryAction`, `secondaryAction` | — | `primaryAction` opens the dialog unless it has an off-page `href`. |
| `user` | Jackson Davy | `{ name, avatar? }` — the signed-in rep. Greeting, menus and generated drafts use the first name. |
| `totalEmails` | `1924` | The count in the inbox header. |
| `groups` | Proactive Outreach (323), Pricing Requests (88), Reorder Reminders (51) | `{ category, total? }[]`: the inbox's group order and the counts shown. |
| `threads` | 9 threads | `HclThread[]`: `{ id, contact, avatar?, account, title, category, when, status, insight, recipients, more?, cc?, subject, draft }`. `draft` is plain text; blank lines are paragraphs. |
| `customers` | 8 accounts | `{ account, contact, avatar?, rep, lastOrder, weekly: number[] }[]`. The trend compares the last third of `weekly` with the third before it. |
| `questions` | 3 | Suggested questions in Ask AI. |
| `how` | 3 steps | `{ kicker?, title, steps: { kicker, title, text, points? }[] }`, or `null`. The first three steps get the three diagrams. |
| `quote` | 4 industries | `{ kicker?, title, subtitle?, marginFloor?, industries: { id, label, buyer, request, items: { sku, name, qty, unit, price, cost, stock: { site, qty }[] }[] }[] }`, or `null`. |
| `stats` | 4 | `{ value, prefix?, suffix?, decimals?, label }[]`, counted up on view. `null` hides them. |
| `testimonials` | 3 | `{ quote, name, role, company, avatar? }[]`, or `null`. |
| `cta` | *Make every buyer feel like the only one.* | `{ title, subtitle?, action? }`, or `null`. |
| `footer` | 3 columns + newsletter | `{ columns?, note?, newsletter? }`, or `null`. |
| `palette` | `"steel"` | `"steel"`, `"dusk"`, `"sage"`, or any subset of `{ sky: [top, mid, deep, footer], night: [same, for dark], glow, haze, accent }` over steel. |
| `scheme` | `"auto"` | `"auto"` follows a `.dark` class on any ancestor; `"light"` / `"dark"` force one sky. |
| `onSend` | — | `({ thread, subject, html, recipients }) => …`. Return (or resolve to) `false`, or throw, and the draft stays unsent. |
| `onBookDemo` | — | Called with `{ name, email, company, team }`. `false` or a throw shows an error. Without it the dialog fakes a 0.9 s send. |
| `onSubscribe` | — | Called with the footer's email. Same contract. |
| `height` | `"100svh"` | Sizes the hero above the app (`max(420px, height × 0.53 − nav)`). A definite length, so it survives any host layout. |
| `className` | — | On the root. |

## Notes

- The page paints its own sky in both host themes — it's a brand page, not a
  themed widget. Dark mode swaps the four sky stops for the palette's `night`
  set; the colours are CSS variables on the root, so a custom palette reaches
  everything.
- The nav is `position: sticky`, so the root clips sideways with
  `overflow-x: clip` rather than `overflow: hidden`.
- The editor uses `contentEditable` with `document.execCommand`. It's
  deprecated but supported everywhere, and keeps this one file. Drafts reach
  `onSend` as HTML.
- Content that starts below the fold rises in as it scrolls into view; content
  already on screen is never hidden.
- `prefers-reduced-motion` stops the tilt, the orbit signals, the streaming
  (drafts and answers appear whole), the counters and the testimonial autoplay.
- Layouts are designed for 375, 768 and 1440: the app becomes list → detail
  with a back button on phones; the how-it-works diagram moves under each step.

## Credits

Avatar photos from Unsplash (`images.unsplash.com`), each replaceable through
props. Layout and feel after a reference supplied by the owner
(`media/halyard-copilot-landing/reference.png`); the brand, copy, mark and art
are original.
