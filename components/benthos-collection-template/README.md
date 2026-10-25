# Benthos Collection Template

A launch page for an illustration collection, laid out like the plate book it
sells. Vintage natural-history plates sit on cream paper around a deep-green
window full of watercolour seaweed. A humpback, an octopus, red coral, a
starfish and a scallop break over the window's edge. Below it comes a pinboard
of everything the collection makes, then seamless patterns, framed prints, a
licence and a wave footer.

```
section      what happens
-----------  ------------------------------------------------------------------------------
header       sticky, tucks away on scroll down, coral progress hairline, CTA with the price
hero         the window opens from a dot, the seaweed forest rises, the reef drifts in over
             the edge, type rises, the tagline curves under it, a strip of patterns, plates
             and pinned chips peeks from below; pointer parallax on every layer, the kelp
             sways, the octopus floats, bubbles rise
the dive     sticky stage: scrolling morphs the window into the full-bleed deep, the reef
             drifts out, the whale swims across, "What's inside" counts up
moodboard    pinned on gold tacks: a Haeckel poster, the studio emblem, the whale, a 12-icon
             line sheet, six palette chips (click to copy), a monogram filled with the reef
             pattern, three pinked fabric swatches, and an envelope that opens on scroll and
             holds the newsletter form. Drag any card: it swings on its tack and springs back
patterns     six seamless tiles composed from the plates; pick one and it crossfades into the
             wallpaper and re-lines the envelope above
prints       a shelf of framed plates; click for a lightbox with ← → and Esc
licence      three tiers, seat tiers, a running total, onBuy
footer       wave edge, script wordmark, links, the whale in negative, artwork credits
```

## How it works

- **Real plates, lifted off their paper.** The default artwork is public-domain
  and CC BY natural-history plates on Wikimedia Commons (credits below). Each
  one is fetched with CORS, cropped, and keyed off its paper in a Web Worker:
  the paper colour is read from the border, the paper is flooded in from the
  edges (so pale highlights inside a drawing stay opaque), large enclosed
  pockets of paper are keyed too, the soft edge is unmixed from the paper
  colour, and captions and specks are dropped. The result is cached for the page
  as a WebP blob. Engravings can be recoloured with a two-ink `duotone`.
- **Fallbacks.** Where workers or OffscreenCanvas are missing, or a CSP refuses
  a blob worker, keying runs on the main thread. While a plate loads, or if it
  is blocked, a hand-drawn SVG version of the same creature stands in.
  `artMode="drawn"` uses only those drawings and makes no network requests.
- **Patterns** are composed on a canvas from the same cut-outs, with every item
  near an edge drawn again on the opposite side, so the tiles wrap without a
  seam. The same tiles fill the swatches, the envelope lining, the monogram, the
  hero strip and the wallpaper stage.
- **The window** is a `clip-path: inset(… round …)` driven by two CSS
  variables, `--in` for the intro and `--open` for the scroll. GSAP tweens the
  variables and the browser does the morph.
- **Motion** is GSAP + ScrollTrigger inside one `gsap.context` (reverted on
  unmount) and `gsap.matchMedia`. The dive is CSS `position: sticky`, never a
  pin spacer, so React's DOM is never rewritten. With `prefers-reduced-motion`
  the page renders finished and the deep becomes a plain block under the hero.

## Dependencies

- **`gsap`** (with its bundled `ScrollTrigger`). It is declared in the root `package.json`.

## Usage

```tsx
import BenthosCollectionTemplate from "@/components/ui/benthos-collection-template"

<BenthosCollectionTemplate />

<BenthosCollectionTemplate
  preset="midnight"                         // "tidewater" | "midnight" | "coralline"
  brand="Fathom"
  hero={{ title: "Deep Water", script: "specimens", badge: "140+" }}
  artwork={{
    octopus: { src: "https://cdn.example.com/octopus-scan.jpg", crop: [0, 0, 1, 0.9] },
    whale: { src: "https://cdn.example.com/whale.png", key: false }, // already transparent
    poster: "https://cdn.example.com/poster.jpg",
  }}
  plates={[{ title: "Moon jelly", latin: "Aurelia aurita", src: "https://…", credit: "…" }]}
  onBuy={(order) => checkout(order)}        // { license, seats, total, currency }
  onSubscribe={(email) => subscribe(email)}
/>
```

`demo-midnight.tsx` shows a second studio on the same template.

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | The hero / dive stage. Must be a definite length. |
| `preset` | `"tidewater"` | Palette. `colors` overrides any of `paper ink deep abyss slate dusk sand coral kelp gold`. |
| `theme` | `"auto"` | Follows a `.dark` ancestor. Or `"light"` / `"dark"`. |
| `fontHref` | Google Fonts (Cormorant Garamond, Mrs Saint Delafield, Jost) | `null` loads nothing and uses the fallback stacks. |
| `artwork` | the plates below | Per piece: `{ src, crop?, max?, key?, keep?, holes?, duotone?, alt? }`. Pieces: `whale octopus gorgonian starfish brittlestar kelp kelpLeft weedBrown weedGreen weedRed weedRose coral scallop nautilus crab`, plus `poster` (a URL, shown as is). `null` drops a piece back to its drawing. Sources must be CORS-readable. |
| `artMode` | `"plates"` | `"drawn"` uses only the built-in SVG drawings. |
| `credits` | the plate credits | Footer credit line. `null` hides it. |
| `brand`, `brandNote` | Benthos / Studio | |
| `nav` | 5 sections | `{ label, href?, section? }`. |
| `hero` | — | `kicker title script badge byline tagline cta secondary`. |
| `deep` | — | `kicker title body stats[{ value, label, note }] formats[]`. |
| `moodboard` | — | Copy for the board, the poster caption, the icon sheet and the envelope letter. |
| `palette` | 6 swatches | `{ name, hex }`. Click copies the hex. |
| `patterns` | 6 | `{ key, name, note }` from `reef-toile night-reef shell-toss octopus-slate kelp-garden starfish-dot`. The first three become the board's swatches. |
| `plates` | 7 Haeckel, Merculiano and Te Papa plates | `{ number?, title, latin?, note?, credit?, art?, src?, alt? }`. `src` is the plate; `art` is the drawing shown if it fails. |
| `licenses` | Personal / Commercial / Extended | `{ id, name, blurb, price, features[], featured? }`. |
| `currency` | `"$"` | |
| `footer` | — | `title body links legal monogram`. |
| `socials` | Instagram, Pinterest, Behance | |
| `onBuy`, `onSubscribe` | — | |
| `alive` | `true` | Parallax, sway, bubbles. |

Seat tiers 1 / 5 / 20 / Studio multiply a licence by 1 / 2.4 / 5 / 9.

## Accessibility

- Every control is a real button, radio, input or link with visible focus.
- The lightbox is `role="dialog"`, moves focus to its close button, closes on Esc and restores focus.
- Patterns are a radio group. Palette chips say what they copy, and a live region confirms copies and orders.
- Pinned cards swing with a pointer only; everything inside them stays reachable by keyboard, and a drag never fires a click.
- `prefers-reduced-motion` skips every GSAP tween, the sway and the bubbles.

Layout answers the component's own width (`container-type: inline-size`) with
designed layouts at phone, tablet and desktop.

## Artwork credits (Wikimedia Commons)

| Piece | Source | Licence |
|---|---|---|
| Humpback whale | C. M. Scammon, *The Marine Mammals of the North-western Coast of North America* (1874) | Public domain |
| Octopus, poster plate | C. Merculiano, *Octopus macropus* (1896) | Public domain |
| Gorgonian | A. von Koch, *Fauna und Flora des Golfes von Neapel: Die Gorgoniden* (1887) | Public domain |
| Starfish, brittle star, starfish plate | E. Haeckel, *Kunstformen der Natur*, plate 40 *Asteridea* (1904) | Public domain |
| Anemone poster and plate | E. Haeckel, *Kunstformen der Natur*, plate 49 *Actiniae* (1904) | Public domain |
| Jellyfish, siphonophore, brown-algae plates | E. Haeckel, *Kunstformen der Natur*, plates 8, 59, 65 (1904) | Public domain |
| Kelp, brown, green, red and rose seaweeds | N. M. Adams, watercolours for *Seaweeds of New Zealand*, Museum of New Zealand Te Papa Tongarewa (CA0008920020001/-02/-03, -05, -07, -08) | CC BY 4.0 |
| Scallop | *Popular Science Monthly*, vol. 49 (1896) | Public domain |
| Nautilus | *Schelp, Nautilus pompilius*, Rijksmuseum RP-P-OB-11.659 | CC0 |
| Shore crab | *Kleiner Taschenkrebs (Carcinus maenas)* | Public domain |

The CC BY 4.0 seaweeds require attribution, which the footer's `credits` line
gives. Keep it, or credit Te Papa elsewhere, if you ship the default artwork.

## Notes for publishing

- The plates and the fonts come from Wikimedia Commons and Google Fonts.
  21st's capture sandbox blocks external origins, so supply
  `media/benthos-collection-template/default.png` as `--preview`.
- Reference image: `media/benthos-collection-template/reference.webp` (local only).
