# Hitch Cargo Landing

A complete landing page for a modular electric cargo bike, laid out like a
parts catalogue on charcoal sheets. One bare longtail frame has four mounts
(rear deck, sides, front rack, power). Heavy grotesk caps, one signal colour
and part-number callouts carry from the hero to the footer.

- **Hero:** a carousel of builds. The frame stays put; parts lift off and drop
  on, each with a part-number callout, and the grey half of the headline
  changes with the build. Arrow buttons, clickable ticks, arrow keys, swipe,
  autoplay with pause (off under reduced motion, paused on hover, focus and
  off screen), and the neighbouring builds peek in at the edges.
- **Configurator:** the same drawing. Pick one part per mount (a part that
  takes a used mount replaces the old one and says so); price, weight and range
  update live. "Build this one" in the hero loads that build here. On phones a
  docked summary keeps the build in view while you pick parts.
- **Spec sheet:** a dimensioned side elevation plus a spec table.
- **Ownership:** four numbered steps hung from a dimension-line timeline.
- **Riders:** a tab list of owners with one large quote, a drawing of their
  build and a button that loads it into the configurator.
- **Reserve:** name, email, city and an opt-in, validated in place, with a
  build summary. It never asks for a card. `onReserve` receives the result;
  the confirmation is a build sheet with the code and the next two steps.
- **FAQ** accordion and a footer with a full-width wordmark.

Everything is drawn in the file as SVG, so the first frame is finished with
no network and no fonts. Dark mode follows a `.dark` class on any ancestor
(`theme="auto"`), or set `theme="dark" | "light"`. Light mode keeps the
charcoal sheets on cool concrete grey.

## Usage

```tsx
import HitchCargoLanding from "@/components/ui/hitch-cargo-landing"

export default function Page() {
  return <HitchCargoLanding />
}
```

A different company, with a part of its own, inside a site that already has a
header:

```tsx
<HitchCargoLanding
  preset="fleet"                          // Kerbside: delivery fleets, safety yellow, EUR
  nav={false}                             // your site header stays in charge
  sections={["configure", "specs", "reserve", "faq"]}
  idPrefix="bike"                         // ids become bike-configure, bike-specs, ...
  parts={[
    { id: "box", price: 590 },            // re-price a built-in part
    { id: "seat", hidden: true },         // drop one
    {                                     // add your own, drawn in the 1000 x 600 plate
      id: "cage", name: "Parcel cage", code: "KS-37", mount: "rear",
      price: 470, weight: 7.4, range: -6, note: "Lockable mesh cage.",
      art: <g>{/* your SVG */}</g>,       // or image: { src, x, y, width, height }
      anchor: [380, 128], tag: [380, 60], // callout
    },
  ]}
  onReserve={(r) => fetch("/api/quote", { method: "POST", body: JSON.stringify(r) })}
/>
```

## Props

| Prop | Default | What it does |
|---|---|---|
| `preset` | `"signal"` | `"signal"` (Hitch, consumer, orange) or `"fleet"` (Kerbside, fleets, yellow). Every prop below overrides it. |
| `brand`, `accent`, `frameColor` | Hitch, `#ff5b1a`, `#b9bec4` | Name, signal colour (text on it switches black or white by contrast), frame paint. |
| `theme` | `"auto"` | `"auto"` follows a `.dark` class on any ancestor, in CSS, with no flash. Or `"light"` / `"dark"`. |
| `height` | `"100svh"` | Hero height on wide screens; the drawing is sized to fit it. Use a definite length. |
| `currency`, `locale` | `USD`, `en-US` | Money formatting. |
| `nav`, `stickyNav`, `cta` | | Header links (`false` leaves the header out), whether it pins, the header button. |
| `sections` | all six | Order of `"configure"`, `"specs"`, `"ownership"`, `"riders"`, `"reserve"`, `"faq"`. Leave one out to hide it; links to it go too. |
| `idPrefix` | `"hitch"` | Prefix for every element id. In-page links use the section keys (`#specs`) whatever the prefix. |
| `hero` | | `{ lead, body, buildLabel }`. The headline is `lead` + each build's `tail`. |
| `builds` | 5 builds | `{ id, caption, tail, modules }`, `modules` being part ids. |
| `autoplay` | `7` | Seconds per build, `0` to turn off. |
| `base` | | `{ price, weight, range, maxLoad }` of the bare product. |
| `parts` | | Patches by id (rename, re-price, `hidden`), or new parts with `art` (SVG) or `image` (a cut-out photo) and an optional `anchor` / `tag` callout. Built-in drawn parts: `seat`, `footboards`, `flatbed`, `panniers`, `toolbox`, `box`, `basket`, `battery`. |
| `mounts` | rear, side, front, power | `{ id, label, stack? }`. One part per mount unless `stack` is true. |
| `productImage` / `productArt` | drawn bike | A photo or your own SVG for the bare product, laid over the same 1000 x 600 plate in the hero, configurator and spec sheet. Parts still drop on over it. |
| `codePrefix` | first part code's prefix | Prefix of the reservation code. |
| `fleet` | off (on in `"fleet"`) | `{ min, max, start, months }`: a bike-count stepper, a fleet total and a monthly lease figure in the configurator and the summary. `false` turns it off. |
| `landmark`, `headingLevel` | `true`, `1` | Turn off the `<main>` landmark and drop the hero heading to `h2` when the page sits inside another. |
| `configurator`, `specs`, `ownership`, `riders`, `reserve`, `faq`, `footer` | | Copy for each section; any field can be set alone. A rider with `modules` gets a drawing of their build and a "Load this build" button. |
| `labels` | English | Every short UI string (buttons, errors, mount hints, the configurator notes), with `{part}`, `{old}`, `{mount}`, `{brand}`, `{build}` placeholders. |
| `onReserve` | | Called with `{ name, email, city, optIn, modules, total, quantity, code }`. Return a promise: the button shows a pending state, a rejection keeps the form and shows an error, and the confirmation appears only once it resolves. |

## Notes

- No dependencies beyond React. No images, fonts or network requests by default.
- The plate is one SVG with a viewBox of `0 0 1000 600`, ground at y 540, the bike
  facing right. Draw custom parts and products in that space.
- The display face is a system stack (`Arial Black`, then `Helvetica Neue`,
  Inter, Arial). Set your own on `.hx-root` with `--hx-display` if you load one.
- Riders, quotes and numbers in the defaults are placeholders for a fictional
  company. Replace them with real ones.
- Layout uses container queries, so it adapts to the box it is placed in.
