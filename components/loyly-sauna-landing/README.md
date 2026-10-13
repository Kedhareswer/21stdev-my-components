# Löyly Sauna Landing

A complete landing page for a public sauna and cold plunge, printed in two
inks. A cool white grid sheet, one Swiss grotesk and a halftone screen in
safety orange and black: **orange is heat, black is cold**. *Löyly* is the
Finnish word for the steam that rises when water hits hot stones.

The screen carries the whole page:

- **Hero.** The heat coming off the stove, with the stones under it. Press
  *Throw water on the stones*, or click anywhere in the heat, and a wave of
  löyly rolls up through the dots from where the water landed. Meanwhile the
  felt-heat readout climbs a few degrees and cools back. The wave keeps clear
  of the body copy.
- **Sessions.** This week's timetable: day tabs (arrow keys work), spots left
  as a row of dots, full sessions with a waitlist, and booking with a
  confirmation inline. Your booking shows up as an orange dot.
- **Rooms.** Three plates printed by temperature: the hot room in heat ink,
  the plunge as banded water in cold ink, the rest deck almost bare paper.
- **Ritual.** The 90-minute session as a printed timeline: heat, cold and rest,
  three rounds, then showers. Point at a step to pick out its blocks.
- **Membership.** A drop-in, a ten-visit card, and a membership with a monthly
  or yearly price. The featured plan is a solid block of the heat ink.
- **Quotes, questions and visit.** A big member quote, an accordion, the
  address and hours, a newsletter form. The footer band is the heat cooling
  to black.

Dark mode prints the same page on black stock, with the cold ink turned white.

```tsx
import LoylySaunaLanding from "@/components/ui/loyly-sauna-landing"

<LoylySaunaLanding
  brand="Kiuas"
  ink="safety"
  onBook={(session, day, waitlist) =>
    fetch("/api/bookings", { method: "POST", body: JSON.stringify({ id: session.id, waitlist }) }).then((r) => r.ok)
  }
  onSubscribe={(email) => fetch("/api/newsletter", { method: "POST", body: JSON.stringify({ email }) }).then((r) => r.ok)}
/>
```

## Play with it

- `demo.tsx`: Kiuas, a harbour-side public sauna, in safety orange.
- `demo-klein.tsx`: Saltbath, a floating sauna on a lake, reprinted in Klein
  blue with its own copy, rooms, passes and hours.

Open `?dark` before the hash in the workshop for the black stock.

## Props

| Prop | Type | Default |
|---|---|---|
| `brand` | `string` | `"Kiuas"` |
| `tagline` | `string` | `"Public sauna and cold plunge"` (hidden under 1100 px) |
| `links` | `{ label, href }[]` | Sessions, Rooms, Ritual, Membership, Visit. `#sessions`, `#rooms`, `#ritual`, `#membership` and `#visit` scroll within the page. |
| `hero` | `{ title, text, cta, secondary }` | The last word of `title` drops to its own line. |
| `heat` | `{ label, base, rise, button, hint }` | The readout rests at `base` °C and climbs by `rise` after a throw. |
| `sessions` | `{ title, text, days: LylDay[] } \| null` | A week of five slots a day. `null` hides the section. |
| `rooms` | `{ title, items: LylRoom[] } \| null` | `kind` (`"heat"`, `"cold"`, `"rest"`) picks how the plate is printed. |
| `ritual` | `{ title, text, steps, rounds, extra } \| null` | Heat 12, cold 2, rest 10, three rounds, plus 18 minutes of showers. |
| `plans` | `{ title, text, items: LylPlan[] } \| null` | A plan with `yearly` follows the monthly / yearly switch; `featured` prints it in the heat ink. |
| `quotes` | `LylQuote[] \| null` | Three member quotes. |
| `faq` | `{ title, items } \| null` | Six questions. |
| `visit` | `LylVisit \| null` | Address, hours, email, phone. |
| `newsletter` | `{ title, text, button, done } \| null` | |
| `footer` | `{ links, note } \| null` | |
| `currency` | `string` | `"€"` |
| `ink` | `"safety" \| "klein" \| "pine" \| { accent, onAccent }` | `"safety"` |
| `theme` | `"system" \| "light" \| "dark"` | `"system"` follows the host's `.dark` class, then the OS. The nav has a Night / Paper switch. |
| `onBook` | `(session, day, waitlist) => unknown` | Return or resolve `false`, or throw, to show an error. Without it, booking is simulated. |
| `onSubscribe` | `(email) => unknown` | Same contract. |
| `onThrow` | `() => void` | Each time water hits the stones. |
| `height` | `string` | `"100svh"`. A definite length for the hero floor, so it survives any host layout. |
| `className` | `string` | |

Types: `LylSession { id, time, name, note?, minutes, capacity, booked, price }`,
`LylDay { label, full?, sessions }`, `LylRoom { name, kind, temp, text, stay }`,
`LylStep { kind, name, minutes, text }`,
`LylPlan { name, price, yearly?, unit, text, features, cta, featured? }`,
`LylQuote { quote, name, role }`, `LylFaq { q, a }`,
`LylVisit { title?, address, hours, email?, phone? }`.

## Notes

- **No dependencies, nothing loaded.** React only. The halftone is canvas 2D,
  the small patterns are CSS, the type is the system Helvetica stack
  (`"Helvetica Neue", Helvetica, "Nimbus Sans", FreeSans, Arial`). No images,
  fonts or URLs, so it renders in 21st's capture sandbox.
- **Light on any GPU.** Each screen holds a fixed dot budget (15,000 in the
  hero) and a pixel budget (about 2.2M), measures its own frame time and
  coarsens itself on a slow or software renderer. The hero idles at 24 fps,
  runs at full rate only during a wave, and stops off screen or in a hidden
  tab. The plates and the footer draw once, and redraw on resize or theme
  change.
- **Reduced motion.** No idle drift, no wave and no scroll smoothing: a throw
  just moves the readout. Section headings are never hidden.
- **Accessibility.** A skip link, one `h1`, a real button for the throw with a
  polite live announcement, a tablist for the days, disclosure buttons for the
  questions, a focus-trapped phone menu that Escape closes, labelled form
  errors, and visible focus in the ink colour. Body text is at least 6:1 on
  both stocks.
- **Copy and data are placeholders.** Kiuas, its address, prices, sessions and
  members are invented. Replace them through props.
- Reference: the owner's "safety orange halftone" style image (Swiss
  International, two inks on grid paper). See `media/loyly-sauna-landing/`.
