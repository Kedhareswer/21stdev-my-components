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

It is a working page: a registration-card booking form with dates, guests and
rooms (async-ready, with busy, error, priced, last-room, sold-out and held
states), a motel key fob that shows the room you picked, rooms as postcards that
turn over (each prints its own corner of the hotel: the room with the pool
through the glass, the casita and its fire pit, the balcony at sunrise, the roof
deck at night), the daily programme, facts set in pool-floor mosaic numerals
between lane ropes, guestbook letters with airmail borders, drive times on a
highway sign, a newsletter written on a postcard, a chrome wordmark footer, and
a pill nav that docks at the bottom once you scroll past the hero (phones get a
Menu button in the header).

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
  onSearch={(q) => api.availability(q)}   // may be async; return false to block, or { left, total }
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
| Check availability | Prices the stay; with `onSearch` (or `demoAvailability`) also says how many rooms are left, offers another room when sold out, then holds it |
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
| `booking`, `onSearch`, `onBook` | | `{ title, text, perks, maxGuests }`; `onSearch` may return or resolve `false` or `{ left, total }`, and a rejection shows an error |
| `demoAvailability` | `false` | Without `onSearch`, shows stand-in rooms-left and sold-out states (the demos turn it on) |
| `onSubscribe` | | May be async; `false` refuses, a rejection shows an error line |
| `rooms` | four rooms | `{ title, text, items }`; each room takes `view` (`pool`, `palms`, `mountain`, `night`), `hour` and an optional `image` |
| `programme` | eight events | `{ title, text, items: [{ hour, until, title, place, text }] }`; `until` may pass midnight |
| `facts`, `guestbook`, `visit`, `newsletter`, `footer` | | Each section's content; `null` hides a section. `visit.sign` / `visit.exit` label the highway sign; `footer.social` / `footer.legal` add link rows |
| `preset` | `"desert"` | `"coast"` swaps the mountains for a headland, the sea and a lighthouse, the motel for whitewashed arches and a tiled dome, the courts for a lemon pergola, and recolours the page |
| `scene` | from the preset | `{ pylon, court, architecture: "midcentury" \| "terrace" }` overrides what stands in the poster |
| `colors`, `darkColors` | | Override any of `paper`, `card`, `ink`, `muted`, `pool`, `sun`, `coral`, `night` |
| `heroImage`, `heroImageAlt` | | Use a photo instead of the printed poster (the dial then tints it) |
| `theme` | `"system"` | Follows the `dark` class on `<html>` or the OS; or force `"light"` / `"dark"` |
| `height` | `"100svh"` | A definite height for the hero's first screen |

## Notes

- Every section is optional: pass `null` to drop it.
- Without `onSearch` the form only prices the stay; it never invents scarcity.
  `demoAvailability` turns on a stable stand-in (same room and dates, same
  answer) so the sold-out and last-room states can be seen in the demos. Wire
  `onSearch` to real inventory.
- Reduced motion: the palms, pool ripples and chrome sparkles stop, the postcards
  turn without animating, and in-page links jump instead of scrolling.
- Reference: the hero of grandleisure.org (chrome display lettering, a framed
  resort illustration, a memo strip and a bottom pill nav), for feel and layout
  only. No brand, copy or images were used.
