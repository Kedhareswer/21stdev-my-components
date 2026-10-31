# Alto Coffee Template

The launch page of a specialty roaster's new crop. The whole page is one
journey from the top of a volcano down into the cup, so a roaster could ship it
this season: the harvest story, its origins on a map, the whole bean, the
instant stick, a limited-edition shop block and a footer.

Every picture is drawn in SVG or canvas, so it renders without any photos.
Every picture slot also takes a real photo through props; the layout is built
photo-first (the reference is photographic), so a photo drops straight in.

```
section       what happens
------------  -------------------------------------------------------------------------------
header        frosted over the sky, turns solid after the hero; nav underlines the section in
              view; a red "Bag" pill counts what was added; burger menu on narrow widths
hero          a descent: a volcano in a deep-blue sky above the clouds, title rising letter by
              letter. Scrolling sinks you through three drifting cloud banks into a white-out
              where the altimeter counts the metres down (3,760 → 1,560 m), then the cloud
              clears over terraced rows of coffee under the volcano
new crop      the harvest year set huge on deep green, a blue disc growing behind "New Crop" and a
              cluster of ripe cherries tumbling in front of it, leaning towards the pointer
origins       solid dark continents (Natural Earth) on black. "The Finest Origins." opens it; then
              the camera flies from one year's origin to the next while the red country MORPHS
              into the next one (Colombia → Ethiopia → Guatemala), its name set big and white
              underneath; a pulse ring tracks it; year tabs jump there
bean          two pack cards you can tilt in 3D; the title in a thin geometric face rising letter
              by letter; then pack-design cards (patterns, product shots) drift down both sides
              at different speeds while the one crossing the middle is spelled out in a sticky
              caption; a farm-to-cup photo strip that vertical scroll moves sideways
stick         the same language in salmon: floating blend cards (a click picks that blend), then
              "Brew a cup": the stick tips, granules fall, the cup fills with that blend's crema
limited       the two products side by side with a comparison table between them, quantity,
              "Add to bag" (flies a dot into the header pill), "Add both", a lot stock bar
footer        the cup-and-volcano mark draws itself in red; newsletter with validation; links
```

## How it works

- **Sticky stages, not pinning.** The hero, map and strip are tall sections with a
  `position: sticky` stage inside, each scrubbed by a ScrollTrigger timeline.
  React's DOM is never rewritten.
- **Clouds** are painted once at mount: seamless value-noise fbm with domain warping,
  lit from above, in three bands that drift sideways forever on the compositor and
  rise past the camera on scroll. A canvas that can't be read leaves a clear sky.
- **The volcano and the coffee rows** are generated from a seed: 46 gullies down the
  cone and two tree lines, then fifteen terraced hedgerows, each a band of leaf clumps
  lit on top with a dark gap below, shrinking into the mist, with ripe cherries in
  the near rows. Film grain sits over the scene.
- **The map** is Natural Earth land (1:110m, simplified to 27 KB of relative path
  data) plus 1:50m country outlines. The camera is a tweened `viewBox`: it zooms out
  between origins and back in, while MorphSVG turns one outline into the next. The
  step label is read from the timeline's own clock, so it stays in sync while the
  scrub catches up.
- **Floating cards** are plain flow layout (alternating sides, overlapping rows); each
  slot gets its own scrubbed parallax speed and tilt, and a ScrollTrigger per card
  feeds the sticky caption. Patterns are SVG `<pattern>` tiles.
- **Motion** is GSAP + ScrollTrigger + MorphSVG inside one `gsap.context` (reverted on
  unmount) and `gsap.matchMedia`. With `prefers-reduced-motion` every tall section
  collapses to a still layout, the map shows the chosen origin, and brewing and
  adding to the bag happen instantly.
- **Dark mode** (a `.dark` ancestor, or `theme="dark"`) turns the hero into a night
  descent: stars, a moon, moonlit clouds and blue mist. The other bands are dark
  already.
- **Layout** answers the component's own width through container queries. Phone
  layouts are designed, not squeezed: the map card moves under the country, and the
  year tabs move to the top.

## Dependencies

- **`gsap` ≥ 3.13** with its bundled `ScrollTrigger` and `MorphSVGPlugin`. It is declared
  in the root `package.json`. Since 3.13, every GSAP plugin ships in the public
  package.

## Usage

```tsx
import AltoCoffeeTemplate from "@/components/ui/alto-coffee-template"

<AltoCoffeeTemplate
  preset="antigua"                                 // "antigua" | "huila"
  brand={{ name: "Alto" }}
  hero={{ title: ["Guatemala", "Antigua"], peak: { name: "Volcán de Agua", altitude: 3760 }, farmAltitude: 1560 }}
  origins={{ steps: [{ year: "2026", country: "guatemala", region: "Antigua", altitude: "1,560 m", process: "Washed", notes: ["Caramel"] }] }}
  onAddToBag={(product, qty) => cart.add(product.id, qty)}
  onSubscribe={(email) => api.subscribe(email)}
/>
```

| Prop | Default | |
|---|---|---|
| `height` | `"100svh"` | Height of each sticky stage (hero, map, strip). Must be a definite length. |
| `preset` | `"antigua"` | `antigua`: red on coffee brown, Agua at noon. `huila`: tangerine, a snow-capped Andean volcano at dawn. |
| `colors` | — | Override `accent`, `cream`, `brown`, `deep`, `ink`, `crop`, `disc`, `skyTop`, `skyBottom`, `peak`, `peakShade`, `ridge`, `leaf`, `leafDark`. |
| `theme` | `"auto"` | `"auto"` follows a `.dark` ancestor. |
| `fontHref` | Google Fonts (Archivo, variable width, + Jost) | `null` loads nothing. |
| `fonts` | — | `sans` (everything) and `display` (the thin ALTO BEAN / STICK titles) font-family stacks. |
| `brand` | `{ name: "ALTO" }` | Wordmark on the header, packs, sticks, outlined titles and footer. |
| `nav` | 4 in-page links | `{ label, href }[]`. `#origins`, `#bean`, `#stick`, `#limited`, `#process`, `#crop`, `#top` scroll; other hrefs go to `onNavigate`. |
| `hero` | Guatemala Antigua | `title`, `peak: { name, altitude }`, `farmAltitude`, `coords`, `soil`, `caption`, `snow`, `smoke`, `fieldImage`. |
| `crop` | 2026 New Crop | `year`, `title`, `body`, `stats: { value, label }[]`. |
| `origins` | Colombia, Ethiopia, Guatemala | `kicker`, `title`, `intro`, `steps: { year, country, name?, region, altitude, process, notes, blurb? }[]`. Built-in countries: colombia, ethiopia, guatemala, brazil, kenya, costa-rica, honduras, rwanda, peru, or `{ name, d, box }` in the map's 1000 × 394 equirectangular space. |
| `bean` | — | `title`, `kicker`, `sub`, `lead`, `body`, `bags`, `cards`, `stepsTitle`, `stepsBody`, `steps`. |
| `stick` | Dark, Mild, Decaf | `title`, `kicker`, `lead`, `cards`, `brewTag`, `brewTitle`, `blends: { name, color, crema, strength, notes, brew }[]`. |
| `limited` | 2 products | `kicker`, `title` (`\n` breaks lines), `sub`, `lot`, `total`, `left`, `currency`, `products: { id, name, kind, color?, price, specs, image? }[]`. The first two are compared; give them the same spec labels. |

Cards (`bean.cards`, `stick.cards`) are `{ label, name, body, color, pattern?, art?, ink?, blend?, image? }`.
`pattern` is chevron, wave, check, diamond, scale, dots or plain; `art` draws a product
shot instead (bag, box, sticks, cherries); `blend` links a stick card to a blend.
| `footer` | — | `line`, `columns`, `legal`, `social`. |
| `onNavigate` `onAddToBag` `onSubscribe` | — | Callbacks. |

Picture slots (`hero.fieldImage`, `bags[].image`, `cards[].image`, `steps[].image`,
`products[].image`) take `{ src, alt, focus: [x, y] }` and replace the drawing.

The mark is exported as `AltoMark` for use elsewhere on the site.

## Accessibility

- The hero title, crop title and outlined titles carry their full text as `aria-label`;
  the per-letter spans are hidden.
- Map years are tabs (`aria-selected`); a polite live region announces each origin.
- Blends are a radio group; floating cards are buttons (`aria-pressed`), and the
  sticky caption is a polite live region.
- The bag count, quantities and newsletter messages are live regions; the email field
  sets `aria-invalid`.
- Visible focus rings throughout; `prefers-reduced-motion` gets a finished, still page.

## Credits

- Land (1:110m) and country outlines (1:50m): [Natural Earth](https://www.naturalearthdata.com/)
  (public domain), via `world-atlas`, simplified and embedded.
- All illustration, packaging and the mark are original and drawn in code.

The roaster, farms, lots and copy are fictional.

## Notes for publishing

- **Open:** the default pictures are still drawn because this was built without network
  access to Unsplash. `media/alto-coffee-template/HANDOFF.md` lists each photo slot,
  how to wire photos in and how to verify them.

- 21st's capture sandbox blocks external origins (the font), so supply
  `media/alto-coffee-template/default.png` as `--preview`.
- Reference image: `media/alto-coffee-template/reference.webp` (local only).
