# Overstory Studio Landing

A complete landing page for a design and engineering studio that works with
SaaS startups. The page is seen from underneath the trees. The overstory is
the top layer of a forest, the leaves that meet the sky.

**Requires `gsap`** (GSAP + ScrollTrigger). It is declared in the root
`package.json`. If you copy the file by hand, run `npm install gsap` too.

## The storyboard

- **Arrival.** The nav drops in and the headline rises line by line out of a
  mask. Then the trees close in around the patch of sky: four depth layers
  start wide and tilted and settle into a ring, far ones first. The serif word
  on the second line morphs every few seconds (SAAS, AI, Fintech, DevTool),
  letters flipping out and in while the line reflows to the new width.
- **Alive.** Each layer sways on its own slow loop, leaves drift down across
  the sky, and the layers shift against the pointer with real depth parallax.
  **Click the sky** and a gust swings the branches and shakes a handful of
  leaves loose.
- **Rise.** Scrolling lifts you up through the canopy on a sticky stage. The
  near leaves fly past and spin out first, the far ones last, the headline
  blurs away, and a bank of mist rolls up. You come out *above the canopy*,
  which is where the page continues.
- **Manifesto.** The statement fills in word by word as you read, with two
  inline pictures that pop in (the team, a growth line), then counters run
  up over rules that draw themselves.
- **Services.** An index of five services. Rows draw their rules in, wipe in
  a leaf tint on hover, and slide their titles. A preview card follows the
  cursor and swaps its illustration with a clip reveal. Click a row to open
  its deliverables.
- **Work.** On wide screens the section becomes a horizontal track. Cards
  lean with your scroll speed, each product mock drifts inside its card, a
  counter and a progress bar follow along, and the last card asks for your
  project. On phones it is a vertical list.
- **Process.** A tree grows beside the four steps (Seed, Sapling, Branch,
  Canopy): stem and branches draw themselves as you scroll, leaves pop out at
  each stage, the sun climbs, and the step you are reading lights up.
- **Quotes.** In the shade: a dark forest band with dappled light drifting
  across it. Quotes change on a timer you can see, pause while you hover or
  focus, and their words rise in.
- **Pricing.** Three plans with a monthly / quarterly switch whose price rolls
  to the new number. Cards tilt toward the pointer with a spotlight, and the
  featured plan has a light running around its border.
- **Questions.** An accordion that opens smoothly, next to a card that copies
  your email.
- **Finale.** The bookend. A framed window of trees opens to full bleed while
  the canopy closes back in around you, from wide and tilted to settled, and
  the call to action rises in the patch of sky.
- **Footer.** A newsletter, link columns, a live local clock, and a wordmark
  the width of the page that rises letter by letter.

## The canopy is generated

There is no photo. The sky (gradient, sun glow, clouds and, at dusk, stars)
and the four leaf layers are drawn once to canvas from a seed. Branches reach
in from beyond the frame and end in clusters at the edge of the sky. Masses
fill the band behind them, with gaps of sky shaped by noise. Leaves facing the
sky are backlit, leaves deep in a mass are in shadow, and far layers are hazed
toward the sky. The near layer is softly blurred like a lens.

Because the layers are real depth, the rise and the finale can fly you
through them, which a flat photo cannot do. It also means nothing loads at
runtime, so the page renders in 21st's capture sandbox.

- `season`: `"summer"` (green), `"autumn"` (amber) or `"blossom"` (pink). It
  also sets the page accent.
- `seed`: a different ring of trees for each number.
- The dark scheme is the same forest at dusk: a deep violet sky with stars,
  leaves in silhouette.

Drawing happens one canvas per frame, so the main thread never stalls for
long. Canvases redraw only when the box changes size a lot, not when a phone
toolbar moves. The finale's canopy draws only when it gets near the screen.

```tsx
import OverstoryStudioLanding from "@/components/ui/overstory-studio-landing"

<OverstoryStudioLanding
  brand="Understory"
  season="autumn"
  seed={23}
  hero={{ words: ["Seed", "Series A", "B2B"] }}
  onBook={(from) => openCalendly(from)}
  onSubscribe={(email) => fetch("/api/notes", { method: "POST", body: JSON.stringify({ email }) }).then((r) => r.ok)}
/>
```

## Play with it

- `demo.tsx`: Overstory, summer leaves, the copy from the reference.
- `demo-autumn.tsx`: Understory in October, with amber leaves, another seed,
  its own headline words and an `onBook` handler.

Add `?dark` before the hash in the workshop for dusk. The nav also has a
daylight / dusk switch.

## Props

| Prop | Type | Default |
|---|---|---|
| `brand` | `string` | `"Overstory"`. Nav, footer wordmark, copyright. |
| `links` | `{ label, href }[]` | Work, Services, Process, Pricing, FAQ. `#work`, `#services`, `#process`, `#pricing`, `#faq`, `#contact` and `#about` scroll within the page, and the current one is marked in the nav. |
| `status` | `string \| null` | `"Booking two build slots for Q1"` |
| `hero` | `{ lead, words, tail, trusted, cue }` | `"Design and Eng For"`, `["SAAS", "AI", "Fintech", "DevTool"]`, `"Startups."`. Screen readers get the first word only. |
| `logos` | `OvsLogo[]` | watchup, Salesive, ScribeAI, Salesbase, Venn. Two on the first row, the rest on the second. |
| `manifesto` | `{ kicker, text } \| null` | `[team]`, `[chart]` and `[leaf]` in `text` become inline pictures. |
| `stats` | `OvsStat[] \| null` | Four counters. |
| `services` | `{ kicker, title, text, items } \| null` | Five services. |
| `work` | `{ kicker, title, items, next } \| null` | Four case studies and a "your product" card. |
| `process` | `{ kicker, title, steps } \| null` | Four steps; the tree has four stages. |
| `quotes` | `OvsQuote[] \| null` | Three. |
| `pricing` | `{ kicker, title, text, plans, quarterlyNote } \| null` | Sprint, Partner (featured, with a quarterly price), Embedded. `price: null` prints "Custom". |
| `faq` | `{ kicker, title, text, items } \| null` | Six. |
| `cta` | `{ title, text, button } \| null` | The finale. `null` removes it. |
| `footer` | `{ columns, city, timeZone, note } \| null` | Lisbon, `Europe/Lisbon`. |
| `email` | `string` | `"hello@overstory.studio"`. Copy buttons and `mailto:`. |
| `currency` | `string` | `"$"` |
| `season` | `"summer" \| "autumn" \| "blossom"` | `"summer"` |
| `seed` | `number` | `7` |
| `theme` | `"auto" \| "light" \| "dark"` | `"auto"` follows the host's `.dark` class. |
| `themeToggle` | `boolean` | `true` |
| `onBook` | `(from) => void` | Every "book" button calls it with where it was pressed (`"nav"`, `"plan:Product Partner"`, ...). Without it they scroll to the finale, and the finale button opens `mailto:`. |
| `onSubscribe` | `(email) => unknown` | Return or resolve `false`, or throw, to show an error. Without it the form simulates success. |
| `height` | `string` | `"100svh"`. A definite length for the hero, work and finale stages, so they survive any host layout. |
| `className` | `string` | |

Types: `OvsLogo { name, mark?, type? }` (marks: `watch`, `slash`, `scribe`,
`knot`, `venn`, `leaf`), `OvsStat { value, prefix?, suffix?, decimals?, label }`,
`OvsService { title, text, tags, time, art? }`,
`OvsCase { client, mark?, kind, title, metric, metricLabel, year, mock?, tint?, href? }`
(mocks: `dashboard`, `chat`, `doc`, `mobile`), `OvsStep { name, when, title, text }`,
`OvsQuote { quote, name, role, mark? }`,
`OvsPlan { name, price, quarterly?, unit?, text, features, cta, featured?, badge? }`,
`OvsFaq { q, a }`.

## Notes

- **Sticky, not pinned.** Every scroll scene is a tall section with a CSS
  sticky stage scrubbed by ScrollTrigger, so nothing is re-parented and React
  stays in charge of the DOM. The work track measures itself on every
  ScrollTrigger refresh.
- **Reduced motion.** No intro, no sway, no falling leaves, no scrubbing: the
  hero is the still composition, every section is in place, the work cards
  stack, the tree is shown grown, and quotes do not advance on their own.
- **Accessibility.** A skip link, one `h1`, real buttons with `aria-expanded`
  for services and questions, `aria-pressed` on the billing switch, a polite
  live region for quotes, the copy button and the newsletter, a focus-trapped
  phone menu that Escape closes, and visible focus rings in the accent.
- **Install-safe.** Styles are one scoped `<style>` block (every selector
  starts with `.ovs-`), no `h-full`, no fonts loaded (Inter Display or the
  system sans, and a Didone serif stack for the morphing word), no URLs.
- **Copy and data are placeholders.** The studio, clients, numbers and quotes
  are invented, and the client names follow the reference. Replace them through
  props.
- Reference: `media/overstory-studio-landing/reference.webp`.
