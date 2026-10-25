# Benthos Collection Template

A launch page for an illustration collection, drawn the way a naturalist's
plate book was made: watercolour creatures on cream paper around a deep-green
porthole, then a pinboard of everything the collection makes, seamless
patterns, framed prints and a licence. Every creature on the page is generated
in the component and painted twice, as a granulated watercolour wash and as an
ink line drawing, so the hero, the icon sheet, the patterns and the prints are
all one hand.

```
section      what happens
-----------  ------------------------------------------------------------------------------
header       sticky, tucks away on scroll down, coral progress hairline, CTA with the price
hero         the porthole opens from a dot, the reef drifts in, corals grow, type rises;
             pointer parallax on every layer, kelp sways, octopus floats, bubbles rise
the dive     sticky stage: scrolling morphs the oval into the full-bleed deep, the reef
             drifts out, the whale swims across, "What's inside" counts up
moodboard    pinned cards on gold tacks: a plate, the brand mark, a whale, a 12-icon sheet,
             six palette chips (click to copy), three pattern swatches, an envelope that
             opens on scroll and holds the newsletter form. Drag any card: it swings on its
             tack and springs back
patterns     six seamless tiles; pick one and it crossfades into the wallpaper and lines
             the envelope above
prints       a shelf of framed plates (wash under ink); click for a lightbox with ← → keys
licence      three tiers, seat tiers, a running total, onBuy
footer       wave edge, script wordmark, links, an ink whale
```

## How it works

- **Creatures.** Whale, octopus, nautilus, moon jelly, sea fan, branching
  coral, feather kelp, scallop, starfish, crab, fish, anchor and urchin are each
  built from a handful of points and a seed: Catmull-Rom outlines, tapered
  ribbons swept along tendrils (octopus arms, jelly arms, kelp), logarithmic
  spirals (nautilus), polar curves (starfish) and a recursive branching tree
  (sea fan, coral). Octopus arms, corals and kelp change with their seed.
- **Two paints.** The wash mode runs fills through one SVG filter: a noise
  displacement for wobbly edges, a granulation pass, and pigment pooling at the
  edges. The ink mode strokes the same geometry with a non-scaling line and a
  slight paper bleed, so an icon and an A2 plate share one pen. Artwork paints
  with fixed light/dark colours, so it keeps its colours in dark mode while the
  page's paper and type invert around it.
- **The porthole** is a `clip-path: ellipse()` driven by two CSS variables:
  `--in` (the intro) and `--open` (the scroll). GSAP tweens the variables; the
  browser does the morph.
- **Patterns** are SVG `<pattern>` tiles composed from the same creatures and
  reused everywhere a swatch appears (hero peek cards, board swatches, the
  envelope lining, the wallpaper stage, the list thumbnails).
- **Motion** is GSAP + ScrollTrigger inside one `gsap.context` (reverted on
  unmount) and `gsap.matchMedia`. The dive is CSS `position: sticky`, never a
  pin spacer, so React's DOM is never rewritten. With `prefers-reduced-motion`
  the page renders finished and the deep becomes a plain block under the hero.

## Dependencies

- **`gsap`** (with its bundled `ScrollTrigger`). It is declared in the root `package.json`.

No images are fetched by default: the artwork is generated. Photos only appear
when you pass a `src` for a plate (see `demo-midnight.tsx`).

## Usage

```tsx
import BenthosCollectionTemplate from "@/components/ui/benthos-collection-template"

<BenthosCollectionTemplate />

<BenthosCollectionTemplate
  preset="midnight"                         // "tidewater" | "midnight" | "coralline"
  brand="Fathom"
  hero={{ title: "Deep Water", script: "specimens", badge: "140+" }}
  palette={[{ name: "Fathom Navy", hex: "#16303d" }, …]}
  plates={[{ title: "Moon jelly", latin: "Aurelia aurita", art: "jellyfish" },
           { title: "Reef at dusk", src: "https://…", alt: "…" }]}
  onBuy={(order) => checkout(order)}        // { license, seats, total, currency }
  onSubscribe={(email) => subscribe(email)}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | The hero / dive stage. Must be a definite length. |
| `preset` | `"tidewater"` | Palette. `colors` overrides any of `paper ink deep abyss slate dusk sand coral kelp gold`. |
| `theme` | `"auto"` | Follows a `.dark` ancestor. Or `"light"` / `"dark"`. |
| `fontHref` | Google Fonts (Cormorant Garamond, Mrs Saint Delafield, Jost) | `null` loads nothing and uses the fallback stacks. |
| `brand`, `brandNote` | Benthos / Studio | |
| `nav` | 5 sections | `{ label, href? , section? }`. |
| `hero` | — | `kicker title script badge byline tagline cta secondary`. |
| `deep` | — | `kicker title body stats[{ value, label, note }] formats[]`. |
| `moodboard` | — | Copy for the board, the poster caption, the icon sheet title and the envelope letter. |
| `palette` | 6 swatches | `{ name, hex }`. Click copies the hex. |
| `patterns` | 6 | `{ key, name, note }` from `coral-reef shell-toss octopus-ink kelp-stripe jelly-bloom starfish-dot`. The first three become the board's swatches. |
| `plates` | 6 drawings | `{ number?, title, latin?, note?, art?, src?, alt? }`. `art` is one of `whale octopus nautilus jellyfish seafan coral kelp scallop starfish crab`; `src` hangs a photo instead. |
| `licenses` | Personal / Commercial / Extended | `{ id, name, blurb, price, features[], featured? }`. |
| `currency` | `"$"` | |
| `footer`, `socials` | — | |
| `onBuy`, `onSubscribe` | — | |
| `alive` | `true` | Parallax, sway, bubbles. |

Seat tiers 1 / 5 / 20 / Studio multiply a licence by 1 / 2.4 / 5 / 9.

## Accessibility

- Every control is a real button, radio, input or link with visible focus.
- The lightbox is `role="dialog"`, traps focus on its close button, closes on Esc and restores focus.
- Patterns are a radio group; palette chips announce what they copy; a live region confirms copies and orders.
- Pinned cards are draggable with a pointer only; everything inside them stays reachable by keyboard.
- `prefers-reduced-motion` skips every GSAP tween, the sway and the bubbles.

Layout responds to the component's own width (`container-type: inline-size`)
with designed layouts at phone, tablet and desktop.

## Photo credits (Unsplash, demo-midnight only)

- Octopus in glass: `photo-1545671913-b89ac1b4ac10`
- Anthias over the reef: `photo-1582967788606-a171c1080cb0`

## Notes for publishing

- The default fonts come from Google Fonts. 21st's capture sandbox blocks
  external origins, so supply `media/benthos-collection-template/default.png`
  as `--preview`.
- Reference image: `media/benthos-collection-template/reference.webp` (local only).
