# Open Slot Booking

A "book a call" section that does the booking itself. A heavy two-tone headline
sits over a quiet scheduler window on a tilted colour slab. Inside the window are
the host card, a choice of call lengths, and a timezone-aware week of open slots.
An **Overlay my calendar** switch hatches the visitor's own busy blocks across the
grid. Clashing slots dim and strike through, so the free times stand out. Picking a
slot grows it into a confirm card (name, email, optional note). Confirming flips
the card into a ticket with an `.ics` download.

Use it on the contact or "book a demo" page of an agency, consultancy or SaaS
product, or for a founder's office hours.

- One file, scoped CSS, React only. No dependencies, no network requests, no web fonts.
- Light and dark follow the host's `.dark` class, or force them with `theme`.
- On a phone the 7-column grid becomes a day strip. Each day shows its slots as
  large tap targets, and you swipe the list to change day.
- Keyboard: the arrow keys move between open slots (up and down within a day, left
  and right across days). Escape closes the confirm card and puts focus back on
  the slot.
- Reduced motion: no morph, flip, slab settle or ring spin. Every state is still there.

## Usage

```tsx
import OpenSlotBooking from "@/components/ui/open-slot-booking"

export default function Contact() {
  return (
    <OpenSlotBooking
      host={{ name: "Maya Lindqvist", role: "Head of Solutions, Tallyho", avatar: "/maya.jpg" }}
      hostTimeZone="Europe/Lisbon"
      hours={{ days: [1, 2, 3, 4, 5], from: "09:00", to: "17:00" }}
      hostBusy={busyFromYourCalendarApi}
      visitorEvents={[]}
      onBook={async (b) => {
        await fetch("/api/book", { method: "POST", body: JSON.stringify(b) })
      }}
    />
  )
}
```

If `onBook` throws, the card stays open and tells the visitor to try again or pick
another time.

## Props

| Prop | Default | |
|---|---|---|
| `headline`, `headlineAccent` | "Skip the pitch deck." / "Talk to a person." | Two display lines. The second line gets the gradient. |
| `description` | sample copy | Up to about 20 words. |
| `altContact` | mailto link | `{ label, href }` under the description. `null` hides it. |
| `host` | Maya Lindqvist | `{ name, role, avatar?, initials?, stamp?, city? }`. Without an `avatar`, the host gets a stamped monogram, with `stamp` as the words that run around its ring. |
| `meetingTitle`, `agenda`, `location`, `responseNote` | sample copy | The host card. Write `agenda` in the host's own voice. |
| `bookingUrl`, `bookingHref` | `tallyho.app/maya/partnership` | Shown in the window's address pill. **Copy link** copies `bookingHref`, or `bookingUrl` if `bookingHref` isn't set. |
| `durations`, `defaultDuration` | `[15, 30, 45]`, `30` | Call lengths in minutes. |
| `step` | `30` | Minutes between slot starts. |
| `hostTimeZone` | `Europe/Lisbon` | An IANA zone. Hours and host busy time are read in this zone. |
| `timeZones` | 7 zones | The options in the timezone select. The visitor's detected zone is added if it is missing. |
| `hours` | Mon–Fri 09:00–17:00 | `{ days: number[] (0 = Sun), from, to }` in the host's zone. |
| `noticeHours` | `4` | Slots inside this window can't be booked. |
| `weeksAhead` | `6` | How far ahead the next-week arrow can go. |
| `weekStartsOn` | `1` | `0` starts the week on Sunday, `1` on Monday. |
| `clock` | `"24h"` | `"12h"` or `"24h"`. |
| `hostBusy` | sample week | The host's busy time. Pass weekly rules `{ weekday, from, to }` in the host's zone, or dated spans `{ start, end }`. **Pass your real busy times, or `[]`.** |
| `visitorEvents` | sample week | The visitor's calendar for the overlay. Pass weekly rules (in the visitor's zone) or dated spans. `[]` hides the switch. |
| `defaultOverlay` | `true` | Whether the overlay starts switched on. |
| `onBook` | none | `(booking) => unknown`. Gets `{ start, end, duration, timeZone, name, email, note }`. It may return a promise. |
| `preset` | `"sunrise"` | `sunrise` (sun yellow, orange, blue), `lagoon` (mint, sea blue), `graphite` (signal red on mono), or `berry` (pink, apricot). |
| `colors` | none | Overrides any of `slab`, `from`, `to`, `fromDark`, `toDark`, `action` or `window`. Text on the slab and on buttons switches between black and white automatically. |
| `theme` | `"auto"` | `"auto"` follows `.dark`. `"light"` and `"dark"` force a theme. |
| `fontFamily` | rounded system stack | The display face for the headline and numbers. |
| `height` | `"100svh"` | Minimum height of the section. |
| `gridHeight` | `408` | Maximum height of the scrolling slot grid, in px. |

The sample `hostBusy` and `visitorEvents` are there so the first frame looks lived
in. Replace them with real data. Neither prop fetches anything; connecting a
calendar is up to your backend.

## Notes

- The week starts on the first one with at least six open slots across two or
  more days, so the section never opens on a dead week. **Today** jumps back to
  the current week.
- Days with no slots at all shrink to narrow columns, which leaves room for the
  days a visitor can book.
- The schedule maths (timezone offsets, slots, clashes, blocks, the `.ics` file)
  sits in a `// #region schedule` block. `tests/open-slot-booking.test.mjs` tests
  it, including across a daylight-saving change and from New York, Kolkata and
  Auckland.
- Credits: the layout and feel follow the savvycal.com hero (a heavy two-tone
  headline and a dark app window on a tilted yellow slab). Its brand, copy and
  images were not used.
