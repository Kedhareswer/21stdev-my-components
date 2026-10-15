# Paloma Hotel Landing

A complete landing page for a small resort hotel, printed like a 1980s resort
brochure. A chrome-lettered wordmark sits over a screen-printed poster of the
hotel (a mid-century block, one long pool, palms, striped umbrellas, clay
courts and the mountains behind), framed in rounded hairlines.

The signature is **the time of day**. Drag the sun along the dial under the
poster, press a moment, or use the arrow keys, and the place moves through its
day: the sky, the striped sun and the moon, the palm shadows, the shading on the
mountains, the pool glow, the string lights and the lit windows. The chrome
letters reflect the same sky. The hour also drives "The day at the hotel",
where the programme marks what is on now, and dark mode is simply the
night-swim state of the same page.

It is a working page: a registration-card booking form with dates, guests,
rooms and real availability states (open, last room, sold out with an
alternative, held), a motel key fob that shows the room you picked, rooms as
postcards that turn over, the daily programme, facts on a pool-tile band,
guestbook letters with airmail borders, drive times on a highway sign, a
newsletter, and a pill nav that docks at the bottom once you scroll past the
hero.

```tsx
import PalomaHotelLanding from "@/components/ui/paloma-hotel-landing"

<PalomaHotelLanding
  brand="Hotel Marea"
  wordmark="Marea"
  presents="A sea hotel on the Amalfi coast since 1962"
  preset="coast"
  clock="24h"
  currency="€"
  rooms={{ items: [{ id: "terrace", number: "4", name: "Terrace Double", rate: 260, size: "26 m²", sleeps: 2, bed: "Queen bed", text: "…", features: ["Sea terrace"], view: "pool", hour: 10.5 }] }}
  onSearch={(q) => api.availability(q)}   // return false to block, or { left, total }
  onBook={(q) => router.push("/checkout?room=" + q.room.id)}
  onSubscribe={(email) => api.subscribe(email)}
/>
```

**No dependencies beyond React.** The poster, the postcards, the stamp, the key
fob and the footer band are SVG drawn in the file; the chrome wordmark is an
alphabet of strokes defined in the file (A to Z, 0 to 9, space, period,
apostrophe, hyphen), so it looks the same on every machine. No fonts, images or
stylesheets load, so it renders inside the 21st capture sandbox. Type uses
system stacks (Futura or Avenir where installed for display, the system sans for
text, Courier for the memo strip).

## Play with it

| Do this | And |
|---|---|
| Drag the sun on the dial, or focus it and use ← → / Page Up / Page Down / Home / End | The poster, the chrome letters and the programme follow the hour |
| Press a moment (Sunrise, High noon, Golden hour, Night swim…) | Jumps straight there |
| Press the moon button in the header | Switches to the night page (and the night swim); press the sun to come back |
| Change the room in the registration card | The key fob swings and shows that room's number |
| Check availability | Prices the stay, says how many rooms are left, offers another room when sold out, then holds it |
| Turn a postcard over | Its back shows the room's details and "Book this room", which fills in the form |
| Click an event in "The day at the hotel" | Moves the sun to that hour |
| Scroll past the hero | The pill nav docks at the bottom with the current hour and "Book a room" |

## Props

| Prop | Default | What it does |
|---|---|---|
| `brand`, `wordmark`, `presents`, `place`, `stamp` | Hotel Paloma | Name in text, the chrome word, the line over it, the two header lines, the oval stamp (`""` hides it) |
| `memo` | booking note | The typewriter strip at the top; `null` hides it |
| `links` | Rooms, The day, Guestbook, Getting here | In-page links (`#rooms`, `#day`, `#guestbook`, `#visit`, `#book` scroll) |
| `hero` | | `title` (the page's h1), `text`, `cta`, `secondary` |
| `hour`, `onHourChange` | 17.5 (night swim in dark mode) | Starting hour, and a callback when it changes |
| `moments` | five stops | The dial's quick stops |
| `clock`, `currency` | `"12h"`, `"$"` | `"24h"` prints 17:30 |
| `booking`, `onSearch`, `onBook` | | Copy for the booking section; `onSearch` may return `false` or `{ left, total }` |
| `rooms` | four rooms | `{ title, text, items }`; each room takes `view` (`pool`, `palms`, `mountain`, `night`), `hour` and an optional `image` |
| `programme` | eight events | `{ title, text, items: [{ hour, until, title, place, text }] }`; `until` may pass midnight |
| `facts`, `guestbook`, `visit`, `newsletter`, `footer` | | Each section's content; `null` hides a section |
| `preset` | `"desert"` | `"coast"` swaps the mountains for a headland, the sea and a lighthouse and recolours the page |
| `colors`, `darkColors` | | Override any of `paper`, `card`, `ink`, `muted`, `pool`, `sun`, `coral`, `night` |
| `heroImage`, `heroImageAlt` | | Use a photo instead of the printed poster (the dial then tints it) |
| `theme` | `"system"` | Follows the `dark` class on `<html>` or the OS; or force `"light"` / `"dark"` |
| `height` | `"100svh"` | A definite height for the hero's first screen |

## Notes

- Every section is optional: pass `null` to drop it.
- The availability shown without `onSearch` is a stable stand-in (it never
  changes for the same room and dates), so the sold-out and last-room states can
  be seen in the demo. Wire `onSearch` to real inventory.
- Reduced motion: the palms, pool ripples and chrome sparkles stop, the postcards
  turn without animating, and in-page links jump instead of scrolling.
- Reference: the hero of grandleisure.org (chrome display lettering, a framed
  resort illustration, a memo strip and a bottom pill nav), for feel and layout
  only. No brand, copy or images were used.
