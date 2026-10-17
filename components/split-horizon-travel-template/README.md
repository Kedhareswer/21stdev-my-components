# Split Horizon Travel Template

A complete site for a small-group travel company in one component. The hero
is a page split down a seam: linen paper on one side, the view on the other,
and the headline runs straight across the join, ink on the paper and white
over the view. **Drag the seam** (or focus it and use the arrow keys) to open
more of the world; on a phone the seam runs across and the view slides up like
a sheet.

Below the hero: a tour finder you type into, a staggered row of tours you can
drag, save and open, an editorial "how we travel" spread with halftone cards,
questions next to a booking form, a wordmark footer, and a full-screen night
menu whose pill follows your pointer between two drifting rows of places.

```tsx
import SplitHorizonTravelTemplate from "@/components/ui/split-horizon-travel-template"

<SplitHorizonTravelTemplate
  brand="Northbound"
  palette="glacier"
  hero={{ title: "Go further north\nthan you planned", split: 0.44 }}
  tours={[{ id: "lofoten", name: "Lofoten Islands", country: "Norway", price: 1800, days: 8, image: "/img/lofoten.jpg" }]}
  onEnquire={(data) => fetch("/api/enquire", { method: "POST", body: JSON.stringify(data) })}
/>
```

**No dependencies beyond React.** Every landscape is drawn in the file as
seeded SVG: ridges with snow, shadowed faces and gullies, haze, water with
reflections, pine forests, acacias, balloons, temple towers, a cabin on a
cliff, and a film grain over all of it. There are ten scenes: `alpine`,
`polar`, `savanna`, `coast`, `fjord`, `balloons`, `temple`, `river`, `dunes`,
`cabin`. Nothing loads at runtime, so it renders inside the 21st capture
sandbox. **Any picture can be a photo:** give a slide, a tour, a gem or a step
an `image` URL and it replaces the drawing. The type is the system stack
(Inter Display / Inter and Instrument Serif when installed).

## Play with it

| Do this | And |
|---|---|
| Drag the seam, or Tab to it and press ← → (Shift for bigger steps, Enter to reset, double-click to reset) | The view widens and the headline turns white letter by letter as it crosses |
| Move the pointer over the view | Every layer of the landscape moves at its own depth |
| Wait, or click the dots under the card | The view crossfades to the next place. The active dot fills as a timer and pauses while the pointer is on the hero |
| *Explore More* on the card | Opens that place's tour |
| Type in *Find your tour* | Filters as you type: places, countries, kinds of trip, and budgets and lengths like `under 1500` or `7 days` |
| Pick a chip | Filters by kind of trip. *Saved* shows the tours you hearted, with a live count |
| Drag the row, or use the arrows | It scrolls with snap points. A bar under it shows where you are |
| Heart a tour | Saved, with the count updated in the chip and the menu (`Saved (4)`) |
| Click a tour | A dialog with facts, highlights and the day-by-day route. *Plan this trip* fills the booking form with it |
| Hover a card in *How we travel* | It widens. The halftone slides |
| Open the menu | A night menu wipes down. The pill follows the pointer or the arrow keys. Esc closes it |
| Send the form | Inline validation, a sending state, then a confirmation with a stable reference (`WA-7KQ2M`) |

## Props

| Prop | Default | Description |
|---|---|---|
| `brand` / `logo` | `"Wayfold"` / drawn mark | Bar, menu, footer wordmark (fitted to the width) and the reference prefix. |
| `hero` | four places | `{ title?, text?, split?, slides?, interval? }`. `\n` in `title` breaks the line (pass it in braces). `split` is where the seam rests (0–1). `interval` is seconds per slide; `0` stops it. |
| `hero.slides` | Dolomites, Lofoten, Serengeti, Skye | `{ place, coords?, scene?, image?, imageAlt?, gem? }[]`. `gem` is the card: `{ kicker?, text, tour?, scene?, image?, cta? }`, or `null` to hide it. `tour` is the id it opens. |
| `nav` | About, Destinations, Booking, FAQ, Account | The small index in the hero and beside the tours. `{ label, target? , href? }`. `target` is `"about" \| "tours" \| "booking" \| "faq" \| "saved" \| "top"`. |
| `search` | | `{ placeholder?, label?, suggestions? }`. |
| `tours` | 9 tours | `{ id, name, country, region?, price, days, scene?, image?, imageAlt?, summary?, highlights?, itinerary?: { title, text? }[], group?, level?, tags? }[]`. Each distinct `region` becomes a chip. |
| `defaultSaved` / `onSaveChange` | 4 tours | Ids saved at first render, and a callback with the new list. |
| `currency` | `"$"` | Put in front of every price. |
| `about` | *From first idea to the final mile* | `{ kicker?, title?, footnote?, stats?, steps? }`. Steps are `{ title, text, tone: "stone" \| "ink" \| "image", scene?, image? }`. `null` hides it. |
| `booking` | | `{ kicker?, title?, text? }`. `null` hides the form. |
| `faq` | 4 questions | `{ title?, items?: { q, a }[], contact?: { label, value, href? }[] }`. `null` hides it. |
| `menu` | My trips … Account | Like `nav`, plus `count: "saved"` to show the saved count. |
| `footer` | links from `nav` | `{ note?, links? }`. `null` hides it. |
| `palette` | `"linen"` | `"linen"`, `"glacier"`, `"olive"`, or any subset of `{ paper, surface, ink, muted, line, stone, stoneInk, night, nightInk, accent, accentInk }` laid over linen (light mode). Every preset has a night version. |
| `theme` | `"system"` | `"light"`, `"dark"`, or follow the host's `.dark` class, then the OS. |
| `onEnquire` | — | Called with `{ tour, month, travellers, name, email, note }`. Return (or resolve to) `false`, or throw, to show an error. Without it the form fakes a 0.9 s send. |
| `displayFont` / `serifFont` | system stacks | Pass your own, e.g. `"var(--font-sans)"`. |
| `height` | `"100svh"` | Height of the hero, a definite length (never below 640px). |

## Notes

- Scenes are deterministic, so the server and the client draw the same
  picture. Each is built once and cached, and its SVG ids are namespaced per
  instance.
- The bar is `position: sticky` and turns into two pills once the hero is
  behind it, so the root clips sideways with `overflow-x: clip`.
- Under `prefers-reduced-motion` the seam doesn't open on load, the slideshow,
  parallax and the menu's drifting rows stop, and in-page links jump.
- The menu and the tour dialog lock the page scroll while open and give focus
  back to whatever opened them.
- The months in the form are the next six from today, computed on the client.

## Images

The default tours and places are drawn, not photographed: the environment this
was built in could not reach any image host. To ship it with photography, pass
`image` URLs (Unsplash works well) on `hero.slides`, `tours`, `gem` and
`about.steps`. Every place, company, price and phone number in the demos is
illustrative.
