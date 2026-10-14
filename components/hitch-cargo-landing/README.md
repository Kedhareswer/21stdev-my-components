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
  update live. "Build this one" in the hero loads that build here.
- **Spec sheet:** a dimensioned side elevation plus a spec table.
- **Ownership:** four numbered steps with timings.
- **Riders:** a tab list of owners with one large quote.
- **Reserve:** name, email, city and an opt-in, validated in place, with a
  build summary. It never asks for a card. `onReserve` receives the result.
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

A different company, same page:

```tsx
<HitchCargoLanding
  preset="fleet"                     // Kerbside: delivery fleets, safety yellow, EUR
  modules={{ box: { price: 590 } }}  // re-price, rename or re-number any part
  onReserve={(r) => sendToCrm(r)}
/>
```

## Props

| Prop | Default | What it does |
|---|---|---|
| `preset` | `"signal"` | `"signal"` (Hitch, consumer, orange) or `"fleet"` (Kerbside, fleets, yellow). Every prop below overrides it. |
| `brand` | `"Hitch"` | Name in the nav, labels and the footer wordmark. |
| `accent` | `#ff5b1a` | The signal colour. Text on it switches black or white by contrast. |
| `frameColor` | `#b9bec4` | Paint of the drawn frame. |
| `theme` | `"auto"` | `"auto"`, `"light"` or `"dark"`. |
| `height` | `"100svh"` | Hero height; the drawing is sized to fit it. Use a definite length. |
| `currency`, `locale` | `USD`, `en-US` | Money formatting. |
| `nav`, `cta` | | Links and the nav button. |
| `hero` | | `{ lead, body, buildLabel }`. The headline is `lead` + each build's `tail`. |
| `builds` | 5 builds | `{ id, caption, tail, modules, image?, imageAlt? }`. `image` shows a photo instead of the drawing. |
| `autoplay` | `7` | Seconds per build, `0` to turn off. |
| `base` | | `{ price, weight, range, maxLoad }` of the bare frame. |
| `modules` | | Per part: `{ name, code, mount, price, weight, range, note }`. Parts: `seat`, `footboards`, `flatbed`, `panniers`, `toolbox`, `box`, `basket`, `battery`. |
| `configurator`, `specs`, `ownership`, `riders`, `reserve`, `faq`, `footer` | | Copy for each section (any field can be set alone). |
| `onReserve` | | Called with `{ name, email, city, testRide, modules, total, code }`. |

## Notes

- No dependencies beyond React. No images, fonts or network requests by default.
- The display face is a system stack (`Arial Black`, then `Helvetica Neue`,
  Inter, Arial). Set your own on `.hx-root` with `--hx-display` if you load one.
- Riders, quotes and numbers in the defaults are placeholders for a fictional
  company. Replace them with real ones.
- Layout uses container queries, so it adapts to the box it is placed in.
