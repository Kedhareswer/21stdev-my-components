# Alto Coffee Template

The launch page of a specialty roaster's new crop. The whole page is one
journey from the top of a volcano down into the cup, so a roaster could ship it
this season: the harvest story, its origins on a map, the whole bean, the
instant stick, a limited-edition shop block and a footer.

Every picture is drawn in SVG or canvas, so it renders without any photos.
Every picture can also be swapped for a photo through props.

```
section       what happens
------------  -------------------------------------------------------------------------------
header        frosted over the sky, turns solid after the hero; nav underlines the section in
              view; a red "Bag" pill counts what was added; burger menu on narrow widths
hero          a descent: an illustrated volcano above the clouds, title rising letter by letter.
              Scrolling sinks you through three drifting cloud banks into a white-out where the
              altimeter counts the metres down (3,760 → 1,560 m), then the cloud clears over
              hedgerows of coffee running to a vanishing point under the volcano
new crop      the harvest year set huge; a cluster of ripe cherries grows out of the type and
              leans towards the pointer; three key facts
origins       a dotted world map (Natural Earth) on a sticky stage. The camera flies from one
              year's origin to the next while the red country MORPHS into the next one
              (Colombia → Ethiopia → Guatemala); a pulse ring tracks it; year tabs jump there
bean          two packs you can tilt in 3D; an outlined "ALTO BEAN" that fills as you read;
              flavour tiles (tap to read the note); a cupping radar; a farm-to-cup strip that
              vertical scroll moves sideways
stick         pick a blend from the fan of sticks or the radio chips and "Brew a cup": the stick
              tips, granules fall, the cup fills with that blend's crema and steams
limited       lot stock bar, spec tables, quantity steppers; "Add to bag" flies a dot into the
              header pill and takes the stock down
footer        the cup-and-volcano mark draws itself; newsletter with validation; link columns
```

## How it works

- **Sticky stages, not pinning.** The hero, map and strip are tall sections with a
  `position: sticky` stage inside, each scrubbed by a ScrollTrigger timeline.
  React's DOM is never rewritten.
- **Clouds** are painted once at mount: seamless value-noise fbm with domain warping,
  lit from above, in three bands that drift sideways forever on the compositor and
  rise past the camera on scroll. A canvas that can't be read leaves a clear sky.
- **The volcano and the coffee rows** are generated from a seed: 46 gullies down the
  cone, two tree lines, then about 4,000 leaf clumps spaced logarithmically in depth,
  so the far rows stay dense and the near ones open up, with ripe cherries in front.
  Film grain sits over the scene.
- **The map** is a 1.5° land grid stored run-length encoded (2 KB, 6,836 dots, drawn
  as one path of round-capped zero-length segments) plus simplified country outlines.
  The camera is a tweened `viewBox`: it zooms out between origins and back in, while
  MorphSVG turns one outline into the next. The step label is read from the
  timeline's own clock, so it stays in sync while the scrub catches up.
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
| `colors` | — | Override `accent`, `cream`, `brown`, `deep`, `ink`, `crop`, `skyTop`, `skyBottom`, `peak`, `peakShade`, `ridge`, `leaf`, `leafDark`. |
| `theme` | `"auto"` | `"auto"` follows a `.dark` ancestor. |
| `fontHref` | Google Fonts (Archivo, variable width) | `null` loads nothing. |
| `fonts` | — | `sans` font-family stack. |
| `brand` | `{ name: "ALTO" }` | Wordmark on the header, packs, sticks, outlined titles and footer. |
| `nav` | 4 in-page links | `{ label, href }[]`. `#origins`, `#bean`, `#stick`, `#limited`, `#process`, `#crop`, `#top` scroll; other hrefs go to `onNavigate`. |
| `hero` | Guatemala Antigua | `title`, `peak: { name, altitude }`, `farmAltitude`, `coords`, `soil`, `caption`, `snow`, `smoke`, `fieldImage`. |
| `crop` | 2026 New Crop | `year`, `title`, `body`, `stats: { value, label }[]`. |
| `origins` | Colombia, Ethiopia, Guatemala | `kicker`, `title`, `intro`, `steps: { year, country, name?, region, altitude, process, notes, blurb? }[]`. Built-in countries: colombia, ethiopia, guatemala, brazil, kenya, costa-rica, honduras, rwanda, peru, or `{ name, d, box }` in the map's 1000 × 394 equirectangular space. |
| `bean` | — | `title`, `kicker`, `lead`, `body`, `bags`, `notes`, `profile`, `score`, `stepsTitle`, `steps`. |
| `stick` | Dark, Mild, Decaf | `title`, `kicker`, `lead`, `blends: { name, color, crema, strength, notes, brew }[]`. |
| `limited` | 2 products | `kicker`, `title`, `lot`, `total`, `left`, `currency`, `products: { id, name, kind, color?, price, specs, image? }[]`. |
| `footer` | — | `line`, `columns`, `legal`, `social`. |
| `onNavigate` `onAddToBag` `onSubscribe` | — | Callbacks. |

Picture slots (`hero.fieldImage`, `bags[].image`, `notes[].image`, `steps[].image`,
`products[].image`) take `{ src, alt, focus: [x, y] }` and replace the drawing.

The mark is exported as `AltoMark` for use elsewhere on the site.

## Accessibility

- The hero title, crop title and outlined titles carry their full text as `aria-label`;
  the per-letter spans are hidden.
- Map years are tabs (`aria-selected`); a polite live region announces each origin.
- Blends are a radio group; flavour tiles are toggle buttons (`aria-pressed`).
- The bag count, quantities and newsletter messages are live regions; the email field
  sets `aria-invalid`.
- Visible focus rings throughout; `prefers-reduced-motion` gets a finished, still page.

## Credits

- Country outlines and the land grid: [Natural Earth](https://www.naturalearthdata.com/)
  (public domain), 1:50m, via `world-atlas`, simplified and embedded.
- All illustration, packaging and the mark are original and drawn in code.

The roaster, farms, lots and copy are fictional.

## Notes for publishing

- 21st's capture sandbox blocks external origins (the font), so supply
  `media/alto-coffee-template/default.png` as `--preview`.
- Reference image: `media/alto-coffee-template/reference.webp` (local only).
