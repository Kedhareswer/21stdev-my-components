# Onward Summit Template

A complete one-day event page in one component. The hero runs from navy down
to white and is filled with tiny arrows that lean away from the pointer,
ripple out from a click and shimmer on their own, clearing a space around the
event's name. Below it, on white, come seven sections: what to expect, a guest
list that changes its pitch for each role, an agenda you can filter and save to
your calendar, speakers drawn as arrow halftones, a drawn venue map, questions,
and a registration band with a live countdown and a form that hands back a
ticket.

```tsx
import OnwardSummitTemplate from "@/components/ui/onward-summit-template"

<OnwardSummitTemplate
  brand="tally"
  title="Upstream"
  tagline={"A day for the people who\nkeep the money moving"}
  date="March 4, 2027"
  city="Chicago"
  startsAt="2027-03-04T09:00:00-06:00"
  palette="emerald"
  glyph="plus"
  onRegister={(data) => fetch("/api/register", { method: "POST", body: JSON.stringify(data) })}
/>
```

**No dependencies beyond React.** The glyph field is a canvas. The three marks,
the speaker portraits and the venue map are SVG drawn in the file, and the type
is the system stack (Inter Tight or Inter when installed). Nothing loads at
runtime, so it renders inside the 21st capture sandbox. Speaker photos are
optional. Without them, each speaker is drawn from their name.

## Play with it

| Do this | And |
|---|---|
| Move the pointer over the hero | The arrows near it turn away and swell, then settle back as it passes |
| Click anywhere in the hero (or the register band) | A ripple runs out through the field |
| Click the date in the nav | Downloads the whole day as an `.ics` file |
| *Register now* | Scrolls to the form and puts the cursor in *Full name* |
| Hover a mark under *On what to expect* | The arrow nudges forward, the ring turns, the plus rotates |
| Pick a role on the guest list, or use ← → | The pitch rewrites itself word by word. It cycles on its own until you touch it, and pauses while you hover |
| Pick a track | Filters the agenda. The counts sit in the chips |
| Click a session | It unfolds its description and an *Add this session* link |
| Bookmark sessions | *Download .ics* exports just those, at the right time in any time zone |
| Hover or tab to a speaker | The portrait lifts, its highlights turn the accent colour and the bio slides up. A photo goes from tinted to full colour |
| Move over the map | It pans gently under the pin |
| Submit the form | Inline validation, a sending state, then a ticket with a stable code (`ONW-PJDW`), *Add to calendar*, and one fewer seat on the meter |

## Props

| Prop | Default | Description |
|---|---|---|
| `brand` | `"keel"` | Wordmark in the nav and footer. |
| `logo` | drawn arrow | Replaces the mark beside the wordmark. |
| `title` | `"Onward"` | The event's name: hero, footer wordmark, calendar entries and the ticket prefix. |
| `tagline` | two lines | `\n` breaks the line. Pass it in braces (`tagline={"…\n…"}`) so the `\n` is a real newline. |
| `date` / `city` | `November 12, 2026` / `New York` | Printed as written in the nav and on the ticket. |
| `startsAt` | `"2026-11-12T08:00:00-05:00"` | ISO date-time **with its UTC offset**. Drives the countdown and every calendar file. Session times are read on this date in this offset. |
| `endsAt` | end of the last session | ISO, same form. Used to show *Happening now*. |
| `register` | `{ label: "Register now" }` | Nav button. Without an `href` (or with a `#` one) it scrolls to the form. With an external URL it is a plain link. |
| `expect` | 3 features | `{ title?, intro?, features?: { icon?, title, text }[] }`. `icon` is `"arrow" \| "ring" \| "plus"` or any node. `null` hides the section. |
| `guests` | CFO, Controller, Head of procurement, Accountants | `{ title?, audiences?: { role, pitch }[] }`. The roles also fill the form's *Role* menu. |
| `agenda` | 9 sessions | `{ title?, intro?, sessions?: { start: "HH:MM", duration (min), title, speakers?, track?, description? }[] }`. Each distinct `track` becomes a filter. |
| `speakers` | 8 people | `{ title?, intro?, people?: { name, role, company?, bio?, photo? }[] }`. |
| `venue` | Hudson Atrium | `{ title?, name, address, city?, notes?, mapHref? }`. *Get directions* defaults to a maps search for the address. |
| `faq` | 5 questions | `{ title?, items?: { q, a }[] }`. |
| `cta` | *Save your seat* | `{ kicker?, title?, subtitle?, seats?: { total, taken } }`. Without `seats` the meter is hidden. `null` hides the whole band, including the form. |
| `footer` | links to each section | `{ links?, note? }`. `null` hides it. |
| `palette` | `"cobalt"` | `"cobalt"`, `"emerald"`, `"dusk"`, `"ember"`, or any subset of `{ deep, mid, light, paper, ink, muted, accent, accentInk, tint, glyphLight, glyphDark, icon: [light, deep] }` laid over cobalt. |
| `glyph` | `"arrow"` | What the field and the portraits are made of: `"arrow"`, `"plus"`, `"ring"` or `"dot"`. |
| `onRegister` | — | Called with `{ name, email, company, role }`. Return (or resolve to) `false`, or throw, to show an error. Without it the form fakes a 0.9 s send. |
| `height` | `"100svh"` | Minimum height of the hero (never below 620px). |

## Notes

- The page keeps its own colours in both host themes. It's a brand page, not a
  themed widget. Colours are CSS variables on the root, so `palette` reaches
  the canvas, the SVG gradients and the map alike.
- The field draws one sprite per glyph colour and only animates while it is on
  screen. Under `prefers-reduced-motion` it is drawn once and holds still. The
  guest list stops cycling, sections appear without rising, and in-page links
  jump instead of scrolling.
- The nav is `position: sticky` and turns frosted white once the hero is behind
  it, so the root clips sideways with `overflow-x: clip` rather than
  `overflow: hidden`.
- Portraits are seeded by the speaker's name, so they look the same on the
  server and the client, and every speaker gets their own.
- Calendar files are RFC 5545: times in UTC, text escaped, long lines folded.
