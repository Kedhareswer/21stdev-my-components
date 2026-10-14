# Kamm Trek Landing

A complete landing page for a company that runs guided hut-to-hut treks, drawn
as a Swiss topographic map that has come to life.

**The hero is a relief model of the whole trek.** A height field is generated
for the range, lit by a low golden-hour sun (alpenglow in dark mode), hazed with
distance and rendered from high above the valley, with contour lines draped over
it the way a museum relief is painted. The trail runs over the model in waymark
red. Every hut on it is a pin you can press, and a live note shows where a
group is sleeping tonight. The headline, text and two buttons sit bottom-left
and bottom-right over a scrim, like a big landscape-photo hero.

**The same mountains, printed flat.** The route section prints that height
field as a map sheet: hypsometric tint, warm light from the north-west and cool
blue shadow (Imhof's Swiss relief style), brown and glacier-blue contours that
thin out on cliffs, a kilometre grid, summits with spot heights, a scale bar and
a north arrow. Under it is the day-by-day height profile. **Move along the
profile** (pointer, touch drag, or arrow keys and PageUp/PageDown on the focused
slider) and a walker moves along the trail on the map, while the day card
updates: the day's title, a trail signpost with the hut and walking time, the
distance, ascent and descent, and where you sleep. Day tabs glide the walker to
each hut.

The map language carries through the page:

- **Where you sleep**: each hut on its own 1:25 000 map excerpt (or your photo),
  picked from an index list.
- **What's included**: a map legend, each item with its own map symbol, under a
  big "6 kg is all you carry" statement.
- **Departures**: filter by month, see places left as a ten-square meter, pick a
  date and hold places in a form with a walker stepper, validation, a sending
  state, an error state and a stamped success state. Full groups switch the form
  to a waitlist.
- **From the hut books**: reviews as guest-book entries, each with its hut's
  stamp, then the guides.
- **Before you book**: disclosures.
- **Footer**: the map collar, with a scale bar and the sheet name.

Everything is drawn here on 2D canvases. No images, fonts or scripts load at
runtime, so it renders the same in a software GPU and in 21st's cover capture.

## Props

| Prop | Default | |
|---|---|---|
| `brand`, `tagline` | `"Kamm"`, `"Guided hut treks"` | Name in the nav and footer |
| `nav` | Route, Huts, Included, Dates, Questions | `{ label, href }`. `#route`, `#huts`, `#included`, `#departures`, `#reviews`, `#faq` scroll to the sections; anything else is a normal link |
| `height` | `"100svh"` | Hero height, a definite length (min 620 px) |
| `preset` | `"summer"` | `"winter"`: snow to the valley floor, winter light, a blue-white map |
| `theme` | `"system"` | `"light"`, `"dark"`, or follow the host's `.dark` class, then the OS |
| `themeToggle` | `true` | Day / night map button in the nav |
| `accent` | waymark red | Trail and main buttons |
| `seed` | `7` | Moves every mountain |
| `contourInterval` | `50` | Metres between contours on the route map |
| `hero` | | `title`, `text`, `cta`, `secondary`, `live: { stage, label } \| null`, and for a photo hero `image`, `imageAlt`, `trail` |
| `route` | Rotgrat Traverse | `title`, `text`, `name`, `start: { name, alt, at }`, `stages`, `peaks` (names, or `{ name, at }` to pin a name near a spot) |
| `labels` | English | every piece of interface copy: field labels, buttons, messages, "Walkers" (say "Skiers" or "Riders"), "Day {n} of {total}" and so on |
| `huts` | | `title`, `text` (the huts come from `route.stages`) |
| `included` | | `figure`, `title`, `text`, `items: { symbol, title, text }[]`, `excluded` |
| `departures` | 12 summer dates | `title`, `text`, `currency`, `items`, `onHold` |
| `reviews`, `guides`, `faq` | | `{ title, items }` |
| `footer` | | `title`, `note`, `email`, `phone`, `address`, `links` |

A **stage** is one day:

```ts
{
  to: "Grathütte",            // where the day ends
  alt: 2912,                   // metres
  at: [0.4, 0.41],             // position on the map, 0..1 from the north-west corner
  km: 9.8,
  hours: "5 h 40 min",         // as the signposts write it
  profile: [2475, 2560, 2740, 2905, 3048, 2980, 2912], // altitudes along the day
  title: "Over the Fuorcla Rotgrat",
  text: "The big day. ...",
  sleep: "Dorm of 12, no shower", // leave out for the final village
  duffel: true,                // your bag is waiting here
  image: "/huts/grathuette.jpg", // optional photo; otherwise a map excerpt
  heroAt: [0.41, 0.35],        // where the hut sits over a hero photo, as fractions of the hero
}
```

**Your own mountains.** The relief is generated from `seed`, so it is a believable
range but not yours. To show the real place, pass `hero.image` (a wide photo of your
range) plus `heroAt` on each stage and, optionally, `hero.trail` as a list of
`[x, y]` fractions; the pins, live note and trail are then drawn over the photo with
the same collision rules. The printed map and hut excerpts stay generated; give each
hut an `image` to replace its excerpt.

Ascent, descent, totals and the profile are computed from `profile`. `legend`
symbols are `hut`, `guide`, `bag`, `meal`, `cable`, `rope`, `bus` and `shield`.

`onHold({ departure, people, name, email })` is called when someone holds places
or joins a waitlist. Return `false` (or a promise of `false`) to show the error
state; anything else shows the stamped confirmation and takes the places off the
meter.

## Notes

- No dependencies beyond React. Tailwind is not required; all styles are scoped
  to `.kmm-root`.
- The relief is computed on the main thread in about half a second on a laptop,
  held to a fixed pixel budget (1.4 M pixels for the hero) and cached per seed.
  The printed map and hut excerpts render only when they come near the viewport.
  Until the relief is ready the hero shows a matching sky-to-valley gradient.
- Reduced motion: no intro, no trail drawing, no glides, no pulse; everything is
  visible from the start.
- The terrain, map grid numbers, huts, guides and reviews are invented for the
  demo. The footer says the relief is for illustration and not for navigation.
  Replace them with your own trek.

## Demos

- `demo.tsx`: the summer hut trek.
- `demo-winter.tsx`: the same page as a five-day ski tour, with the winter
  preset, another seed, groups of eight and February to April dates.
