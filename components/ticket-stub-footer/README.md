# Ticket Stub Footer

A dark, hairline-ruled closing section for an ops product, with the brand
printed on an orange ticket.

Everything sits on one seven-column grid of hairlines: a numbered section
index, a hero (typewriter eyebrow, light grotesk headline, chamfered CTA), a
turning globe of meridians, and two link columns. Under them is an orange
**ticket** with a punchable stub, a live agent status, a rolling "tickets
solved" odometer, a mono blurb, and a full-width serif **wordmark** whose foot
dissolves into a halftone. The first lowercase `i` gets a diamond for its dot.
A copyright bar closes it.

**No dependencies.** React is the only import. No images or fonts are loaded:
the globe is SVG built from numbers, and the wordmark is drawn on canvas in
whatever serif the page has.

## Interaction

- **Wordmark**: point at it and the ink breaks into halftone dots under the
  pointer. **Click** and a ripple runs through the dots while the diamond
  turns a quarter. It prints in left to right the first time it's seen, and
  the halftone band shimmers slowly while it's on screen.
- **Stub**: **punch** it (click, Enter or Space) to dispatch a ticket. The
  mark turns, the counter bumps, an orange ticket flies over the globe, and
  `onDispatch(total)` fires.
- **Status**: click `Active` to pause the agent (`Paused`). The counter
  stops. Click again to resume. Reports `aria-pressed`.
- **Counter**: ticks up at `rate` tickets per second while the agent is active
  and the section is on screen. Digits roll like an odometer.
- **Globe**: turns slowly. **Drag** it sideways to spin it; let go and it
  coasts back to its idle speed. One ticket is always in orbit.
- **Index**: click a row and the orange marker slides to it
  (`onSectionChange`).
- **Eyebrow**: types each phrase, holds it, erases it, and moves on to the next.
- **Blurb**: decodes itself from noise the first time it's seen. Its length
  never changes, so the justified text doesn't reflow.
- **CTA**: an accent fill wipes across and an arrow slides in on hover.
- **Links**: a small diamond and an underline draw in on hover.
- **Footer diamond**: back to the top of the section.

## Usage

```tsx
import TicketStubFooter from "@/components/ui/ticket-stub-footer"

<TicketStubFooter />
```

Give it a parent with a width and nothing else (see `demo.tsx`). Its height
comes from its content.

Re-brand, re-word and re-ink it through props (see `demo-paper.tsx`):

```tsx
<TicketStubFooter
  brand="Pilot"
  headline={["Answer faster.", "Escalate less."]}
  eyebrow={["Now answering in 38 languages", "Median first reply: 9 seconds"]}
  statusLabels={["Online", "On hold"]}
  count={3480221}
  countLabel="Replies sent"
  background="#eee8da" ink="#1d1c1a" muted="#6e685d"
  accent="#3355e8" accentDeep="#2742c2" accentInk="#f3eee2"
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `brand` | `"Dispatch"` | Used in the wordmark, the copyright and the default copy. |
| `wordmark` | `brand` | What the ticket prints. The first lowercase `i` gets a diamond dot. A short word is capped in height and tracked out to fill the width. |
| `company` / `year` | `"<brand> AI"` / `2026` | Copyright line. |
| `sections` | 8 rows, Intro → Resources | `{ label, href? }[]`. Without an `href` a row is a button that only becomes active. |
| `defaultSection` / `onSectionChange` | `0` / none | Active index row. |
| `eyebrow` | three phrases | Typed in turn. |
| `headline` | `["Resolve tickets.", "Trigger actions."]` | One entry per line. |
| `description` | reference copy | Muted paragraph. |
| `cta` / `onCtaClick` | `{ label: "Get started" }` | `{ label, href? }`. |
| `linkGroups` | Pages, Social | `{ title, links: { label, href? }[] }[]`. |
| `statusLabels` / `statusCaption` | `["Active", "Paused"]` / `"Agent Status"` | |
| `defaultActive` / `onStatusChange` | `true` / none | |
| `count` / `countLabel` / `rate` | `12745012` / `"Tickets Solved"` / `1.8` | `rate` is tickets per second. `0` holds the counter still. |
| `blurb` | reference copy | Mono paragraph on the ticket. |
| `legal` | All rights reserved, Terms, Privacy | A link with no `href` renders as plain text. |
| `onDispatch` | none | `(total)` fires when the stub is punched. |
| `background` / `ink` / `muted` | `#1b1a19` / `#e6dcc6` / `#8c867b` | Page, cream text and CTA, secondary text. Hairlines are mixed from `ink`. |
| `accent` / `accentDeep` / `accentInk` | `#ff6d36` / `#d95a32` / `#1b1a19` | Ticket, stub, and the ink printed on them. |
| `fontSans` / `fontSerif` / `fontMono` | system stacks | Nothing is loaded. Pass a family your page already loads; the wordmark re-fits once `document.fonts` is ready. |
| `serifWeight` | `500` | Wordmark weight. |
| `halftone` | `true` | `false` prints the wordmark solid and turns off the lens. |
| `className` | `""` | Appended to the root. |

## Notes

- **Intrinsic height.** There is no `height` prop and no percentage height
  anywhere. The wordmark measures its own width and sets its own pixel
  height.
- Sizes are in container units (`cqw`) off the component's own width, so it
  scales with its column rather than the viewport. Under 860px of width
  it stacks: the index becomes a sideways-scrolling strip, the hero, globe and
  links follow, and the ticket narrows its stub and puts the blurb under the
  stats.
- The CSS is one scoped `<style>` block, with every rule under `.tsf`.
  Element resets go through `:where(.tsf)`, so they never out-rank the
  component's own classes or yours.
- Paints its own palette and ignores the page's light/dark theme. For a light
  page, pass light `background` and dark `ink` (see `demo-paper.tsx`).
- `href: "#"` and missing hrefs never touch the page's URL hash.
- Off screen, the globe, the wordmark, the typewriter and the counter all stop.
- `prefers-reduced-motion`: no typewriter, decode, shimmer, ripple, print-in,
  globe spin, marching dots, pings or rolling digits. The pointer lens still
  works, because it only moves when you do.

## Credit

Layout and palette after a reference shot of a support-automation landing
page ("Dispatch"). The globe, the halftone, the interactions and the code are
original.
