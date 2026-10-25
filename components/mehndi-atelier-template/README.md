# Mehndi Atelier Template

A storefront for an organic henna house, dressed the way a mehndi house's
wedding card is: maroon, olive and burnished gold on parchment, with damask
grounds, brocade borders, Mughal arches, filigree corners, paisleys and
mandalas. It is a working shop, not a poster: search, a nav with dropdowns, a
bag drawer, quick-add, a design booker and a stain study you can play with.

```
section       what happens
------------  ---------------------------------------------------------------------------
strip         maroon announcement marquee (pauses on hover) and a search field
brand band    damask ground, emblem + tagline, the wordmark letters rise in, account,
              wishlist, bag with a running subtotal
nav           maroon tabs between brocade borders, gold dividers, dropdown panels;
              sticks, and picks up a mini wordmark and its own bag once the band scrolls off
hero          maroon and olive panels open like doors; the gold frame, the filigree
              spandrels and a mandala straddling the split draw themselves on; the gilt
              title rises; a cusped arch window grows out of its sill with the photo in it,
              and a seal turns beside it. Scrolling swings the arch open into the whole
              panel (a true morph), turns the mandala and lifts the copy away
best sellers  twin heading (lead · medallion · title); products in arched frames that
              draw on; hover lifts a gilt "Add to bag"; a henna drop flies to the bag
the edit      bento: photo tile with a framed label, two maroon damask cards with
              filigree, a cream design booker (pick a style, see the price, book it);
              then four collection plates that tilt up out of the page
heritage      double-ruled plate with filigree corners; two dressed paisleys draw
              themselves and sway with scroll; medallion seal under the copy
stain study   pick a final shade, drag the hours: the mandala on a brass thaali oxidises
              from pumpkin orange to the chosen shade
footer        brocade edge, damask, gilt wordmark, link columns, newsletter
```

## How it works

- **Every ornament is generated.** Nothing is an image asset, so it stays crisp
  at any size and recolours with the palette. Change `seed` and every mandala,
  paisley and filigree on the page changes.
  - `mandalaRings(seed, R)` lays out rings of petals, spikes, scallops, dots,
    ticks and circles that never repeat back to back.
  - `paisleyOrnament(seed)` samples a boteh drawn as cubic beziers, then dresses
    it. It cuts a scalloped lace edge with a bead in each scallop, a feather band
    along the inside (outward normals), two echo lines with a bead row, a rosette
    in the bulb and a leafy vine into the hook.
  - `filigreeArm` is a wave that dies away, with a spiral tendril off every
    crest, leaves in the troughs and a curl at the end. Two arms and a petal fan
    make a corner, and two mirrored arms and a lotus make a flourish.
  - `archPath(x, y, w, h, k, lobes)` is a pointed two-centred Mughal arch cut
    into cusped lobes. `k` morphs it from the arch at 1 to a plain rectangle at
    0, with the same SVG commands at every k.
- **The hero window morph.** The photo fills the olive panel and is clipped with
  `clip-path: path(...)`. That path is regenerated from `archPath` on every
  frame of the intro (the arch grows out of its sill) and of the scroll (it
  swings open into the panel). A ResizeObserver keeps it in pixel units.
- **Draw-on without plugins.** Ornament strokes carry `pathLength={1}`, so one
  CSS variable, `--draw`, is their dash offset, and GSAP animates the variable.
- **The stain curve.** `stainAt(hours, final)` eases from fresh pumpkin to the
  chosen shade over 48 hours, darkening fast on day one. `stainOpacity` fills
  the stain in as it oxidises.
- **The bag** is real state: `addToBag`, `setQty`, `bagTotal`, `bagCount`.
  Rupees get Indian grouping (₹1,24,999).
- **Motion** is GSAP + ScrollTrigger inside one `gsap.context` (reverted on
  unmount) and `gsap.matchMedia`. Nothing is pinned. The play-once reveals use
  `toggleActions` rather than `once: true`, whose self-kill breaks
  ScrollTrigger when matchMedia re-runs mid-page.
- **Layout** answers the component's own width through container queries. The
  container is an inner `.mat-page`, not the root: a size container is the
  containing block for `position: fixed`, and the drawer, toast and flying drop
  must stay pinned to the viewport.

## Dependencies

- **`gsap`** (with its bundled `ScrollTrigger`). It is declared in the root `package.json`.

## Usage

```tsx
import MehndiAtelierTemplate from "@/components/ui/mehndi-atelier-template"

<MehndiAtelierTemplate
  preset="heirloom"                          // "heirloom" | "indigo" | "terracotta"
  brand={{ name: "Mahadi", tagline: "Organic Henna Atelier", est: "Est. 1987 · Jaipur" }}
  onAddToCart={(item, bag) => track(item)}
  onCheckout={(bag, total) => router.push("/checkout")}
  onNavigate={(target) => router.push("/" + target)}   // "shop", "search:cones", "book:Bridal feet"…
/>
```

| Prop | Default | |
|---|---|---|
| `height` | `"100svh"` | Height of the hero. Must be a definite length. |
| `preset` | `"heirloom"` | Palette. |
| `colors` | — | Override `paper`, `ink`, `maroon`, `olive`, `gold`, `sand`, `rose`. |
| `theme` | `"auto"` | `"auto"` follows a `.dark` ancestor. |
| `fontHref` | Google Fonts (Cinzel, Cormorant Garamond, Jost) | `null` loads nothing. |
| `brand` | Mahadi | `name`, `tagline`, `est`. |
| `announcements` | 4 lines | The strip's marquee. |
| `nav` | 7 tabs | `{ label, href?, children?: { label, href? }[] }`. Children make a dropdown. |
| `hero` | — | `kicker`, `title` (lines), `sub`, `cta`, `photoKicker`, `photoTitle`, `photoCta`, `seal`. |
| `sellers` | — | `lead` (left of the medallion), `title` (right), `blurb`. |
| `products` | 4 | `{ id, name, note, price, image, badge? }`. Shown in arched frames. |
| `feature` | — | The bento photo tile: `kicker`, `title`, `blurb`, `cta`. |
| `highlights` | 2 | The maroon cards: `{ title, blurb, cta? }`. |
| `designs` | 4 styles | The booker: `kicker`, `title`, `blurb`, `cta`, `items: { name, time, price }[]`. |
| `collectionsHead` | — | `kicker`, `title` over the bento. |
| `collections` | 4 | `{ id, title, blurb, cta?, tone?: "sand" \| "rose" \| "maroon" \| "plum", href? }`. |
| `heritage` | — | `kicker`, `title`, `body` (paragraphs), `cta`. |
| `study` / `shades` | — | Copy, and `{ id, name, hex }` final shades. |
| `images` | Unsplash | `hero`, `feature`: a URL or `{ src, alt, focus }`. |
| `currency` | `"₹"` | |
| `seed` | `7` | Seed for every generated ornament. |
| `onAddToCart` | — | `(item, bag)` after each quick-add. |
| `onCheckout` | — | `(bag, total)` from the drawer. |
| `onNavigate` | — | `(target)` for every link and button without an `href`. |

## Accessibility

- The headline carries its full text as `aria-label`; the animated words are hidden.
- The marquee's text is also present once, unanimated, for screen readers.
- Dropdowns open on hover and on keyboard focus (`:focus-within`).
- Shades and designs are `radiogroup`s; the hours are a real `range` input.
- The bag is a `dialog` that Escape closes; its controls leave the tab order while it is shut.
- `prefers-reduced-motion` skips all GSAP choreography (the page renders
  finished, arch closed), stops the marquee, the gilt shimmer and the hover sweeps.

## Photo credits (Unsplash)

- Hero arch: `photo-1621801306185-8c0ccf9c8eb8` (hands with henna on dark green)
- Bento tile: `photo-1730003873829-09b4b16444c1` (bridal henna on a red carpet)
- Products: `photo-1603122612817-2fe0e0631a93` (powder), `photo-1774019410616-2b38e4eeabd2`
  (cone), `photo-1738849760236-541fcdd3931d` (palms with flower bracelets),
  `photo-1771498897921-91522949362e` (artist at work)
- Indigo demo: `photo-1562508548-69377b81ab9e`, `photo-1583878544826-8f8c418033ed`,
  `photo-1556536088-f010a312a8d3`, `photo-1782876224837-e7163083c4c7`,
  `photo-1780326761884-04dedf3778f8`, `photo-1781377012601-93162be3a433`

## Notes for publishing

- The default fonts and photos come from Google Fonts and Unsplash. 21st's capture
  sandbox blocks external origins, so supply `media/mehndi-atelier-template/default.png`
  as `--preview`.
- Reference images: `media/mehndi-atelier-template/reference.webp` (local only).
