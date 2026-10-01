# Crimson Sunburst Preloader

A vintage concert-poster loading gate that **becomes the landing page**. Red
and slate rays, a compass-rose sun, an astrolabe dial, gold foil flecks,
moons and swirling clouds, a filigree frame and worn print grain — all inline
SVG, no images.

1. **Load.** The astrolabe rings draw themselves around the sun, rays shoot
   out of it one by one, the sun's inner ring lights segment by segment and
   the compass turns with progress. The title slot counts up in quotes —
   `“064”` — over a status line and a gilded progress rule.
2. **Ignite.** At 100% the sun flashes, two shockwaves roll out, and the count
   is replaced letter by letter with the show's title.
3. **Live.** The credits, the top links and the ticket button settle in. The
   rays keep turning, the flames flicker, the clouds drift. It stays, as the
   hero.

**Interactive:** click / tap / Enter during the load rushes it to 100%. Moving
the pointer tilts the rays, parallaxes the dial and three cloud layers and
drags a warm lantern across the print. The sun is a button: press it to spin
it and throw sparks. Title letters lift on hover; the ticket button fills red;
the replay control runs the intro again.

```tsx
import CrimsonSunburstPreloader from "@/components/ui/crimson-sunburst-preloader"

// As shipped
<CrimsonSunburstPreloader />

// Your show
<CrimsonSunburstPreloader
  artist="The Lantern Choir"
  eyebrow="Winter Tour"
  title="NOCTURNE"
  date="2026.12.21"
  venue={["Harbour Hall", "North Pier"]}
  ctaLabel="Reserve a seat"
  ctaHref="/tickets"
  rays={34}
  palette={{ red: "#1f3f78", ember: "#4f7fd0", deep: "#12224a", ink: "#070b14" }}
/>

// Driven by real loading
<CrimsonSunburstPreloader progress={loaded} onComplete={() => track("hero-shown")} />
```

**No dependencies beyond React.**

## Props

| Prop | Default | Description |
|---|---|---|
| `artist` | `"Aster Vale"` | Performer line above the title, and in the credits. |
| `eyebrow` | `"1st Solo Live"` | Second line above the title. |
| `title` | `"SOLSTICE"` | The big word. Sized to fit the width from its length. |
| `quotes` | `true` | Wrap the title (and the count) in curly quotes. |
| `date` | `"2026.10.07"` | Small date line in the credits. |
| `venue` | `["Ashwood Forest", "Sport Plaza"]` | Venue lines under the credits. |
| `meta` | `"Vol. 01 — Live"` | Top-left label inside the frame. |
| `links` | Setlist / Venue / Tickets | Top-right links: `{ label, href? }[]`. |
| `ctaLabel` | `"Get tickets"` | Ticket button label. `""` hides it. |
| `ctaHref` | — | Makes the ticket button a link. |
| `onCta` | — | Ticket button handler. |
| `statusLines` | four lines | Shown under the count, stepped through by progress. |
| `rays` | `28` | Number of rays (minimum 6). Every other one is red. |
| `progress` | — | Real progress `0`–`100`. Leave it out to simulate a load that surges and stalls. |
| `durationMs` | `3800` | Length of the simulated load. |
| `loop` | `false` | Replay the whole sequence forever (showcase). `onComplete` never fires. |
| `showReplay` | `true` | The small replay control beside the ticket button. |
| `palette` | see below | Partial overrides. |
| `fontFamily` | Bodoni/Didot stack | Display face for the title and overline. Nothing is fetched. |
| `textFamily` | slab stack | Face for credits, labels and the button. |
| `height` | `"100svh"` | Root height: a definite length, never a percentage. |
| `onComplete` | — | Fired once the landing has been revealed. |
| `className` | `""` | Extra root class names. |

| Palette key | Default | Used for |
|---|---|---|
| `ink` | `#130a09` | stage, darkest ink, dark stars |
| `red` | `#a8232a` | red rays, the sun disc |
| `ember` | `#d5503a` | flames, ray highlights, the shockwave |
| `deep` | `#5a1215` | dial, unlit sun segments, ray tails |
| `slate` | `#25322f` | the cold rays between the red ones |
| `cream` | `#ebd6b3` | type, sun spikes, clouds |
| `gold` | `#d7a548` | foil flecks, filigree, hover accents |

## Fonts

The component never loads a font. The title stack reaches for Bodoni Moda,
Playfair Display, Didot and Bodoni 72; the credits for Roboto Slab, Zilla Slab
and Rockwell, before falling back to Georgia. Pass your own faces through
`fontFamily` / `textFamily` if your app already loads them.

## Install safety

- Explicit `height`, never `h-full`; layout is container-query driven, so it
  recomposes for portrait, landscape and phone frames.
- Every rule in the scoped `<style>` is `.csp-` prefixed; SVG `max-width` is
  reset against Tailwind Preflight.
- Gradient, filter and pattern ids come from `React.useId()`, so two
  instances on one page don't share them.
- `prefers-reduced-motion: reduce` stops the rotation, flicker, twinkle,
  drift and parallax, drops the shockwave and sparks, and fades the title in
  without blur.
- The load is a focusable `role="progressbar"` with `aria-valuenow`; the title
  is a real `<h1>`; the sun, ticket and replay controls are real buttons.
