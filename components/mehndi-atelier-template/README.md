# Mehndi Atelier Template

A storefront for an organic henna house, printed in maroon, olive and gold on
cream parchment. It is a shop a mehndi studio could actually open: an
announcement ribbon, a lace-trimmed header with a working bag, a split hero
where a gold mandala draws itself on and the photograph develops like a fresh
stain, a best-sellers bento with quick-add, four collection plates, a heritage
plate framed by paisleys, a stain study you can play with, and a footer.

```
section      what happens
-----------  ----------------------------------------------------------------------------
ribbon       slow marquee of announcements, pauses on hover
header       sticky, tucks away on scroll down, gold progress hairline, lace trim,
             search / account / bag; the bag opens a drawer with quantities and a total
hero         panels wipe in, the mandala draws ring by ring and keeps turning with scroll,
             the headline rises, the photo develops from sepia to colour over 48 "hours"
band         italic marquee of the house words
best sellers bento: a feature tile with parallax, four products with a mandala sweep,
             hover quick-add; a drop of henna flies into the bag and the badge bounces
collections  four plates lift out of the page, each with its own mandala turning on scroll
heritage     two paisleys draw themselves on, text rises, closing rosette rule
stain study  pick a final shade, drag the hours: the motif oxidises from orange to wine
footer       brand, link columns, newsletter, lace, a mandala turning on the last scroll
```

## How it works

- **Every ornament is generated.** `mandalaRings(seed, R)` lays out rings of
  petals, spikes, scallops, dots, ticks and circles that never repeat back to
  back; `ringMarks` turns a ring into SVG paths. The paisley, rosette and lace
  are built the same way. No image assets, crisp at any size, recoloured by the
  palette. Change `seed` and every mandala on the page changes.
- **Draw-on without SplitText.** Each ornament path carries `pathLength={1}`,
  so a single CSS variable (`--draw`) is its dash offset. GSAP animates the
  variable; there is no per-path length measuring.
- **The stain curve.** Henna oxidises for about 48 hours: orange on day one,
  then dark and settled. `stainAt(hours, final)` models that with an eased
  blend from pumpkin to the chosen shade, and `stainOpacity` fills it in. The
  hero photo plays the same idea on load (`sepia → colour`).
- **The bag** is real state: `addToBag`, `setQty`, `bagTotal`, `bagCount`, with
  Indian digit grouping when the currency is rupees. `onAddToCart` and
  `onCheckout` receive the bag.
- **Motion** is GSAP + ScrollTrigger inside one `gsap.context` (reverted on
  unmount) and `gsap.matchMedia`. Nothing is pinned, so React's DOM is never
  rewritten. Layout answers the component's own width through container
  queries, not the window.

## Dependencies

- **`gsap`** (with its bundled `ScrollTrigger`). It is declared in the root `package.json`.

## Usage

```tsx
import MehndiAtelierTemplate from "@/components/ui/mehndi-atelier-template"

<MehndiAtelierTemplate
  preset="heirloom"                         // "heirloom" | "indigo" | "terracotta"
  brand={{ name: "Mahadi", tagline: "Organic Henna Atelier", est: "Est. 1987 · Jaipur" }}
  onAddToCart={(item, bag) => track(item)}
  onCheckout={(bag, total) => router.push("/checkout")}
  onNavigate={(target) => router.push("/" + target)}
/>
```

| Prop | Default | |
|---|---|---|
| `height` | `"100svh"` | Height of the hero. Must be a definite length. |
| `preset` | `"heirloom"` | Palette. |
| `colors` | — | Override `paper`, `ink`, `maroon`, `olive`, `gold`, `sand`, `rose`. |
| `theme` | `"auto"` | `"auto"` follows a `.dark` ancestor. |
| `fontHref` | Google Fonts (Cormorant Garamond + Marcellus + Jost) | `null` loads nothing. |
| `brand` | Mahadi | `name`, `tagline`, `est`. |
| `announcements` | 4 lines | Ribbon marquee. |
| `bandWords` | 4 words | The italic marquee under the hero. |
| `nav` | 7 links | `{ label, href? }`. Without `href`, clicks go to `onNavigate`. |
| `hero` | — | `kicker`, `title` (lines), `sub`, `cta`, `photoKicker`, `photoTitle`, `photoCta`. |
| `sellers` / `feature` | — | Copy for the best-sellers head and the large tile. |
| `products` | 4 | `{ id, name, note, price, image, badge? }`. |
| `collections` | 4 | `{ id, title, blurb, cta?, tone?: "sand" \| "rose" \| "maroon" \| "plum", href? }`. |
| `heritage` | — | `kicker`, `title`, `body` (paragraphs), `cta`. |
| `study` / `shades` | — | Copy and `{ id, name, hex }` final shades for the stain study. |
| `images` | Unsplash | `hero`, `feature`: a URL or `{ src, alt, focus }`. |
| `currency` | `"₹"` | Rupees get Indian grouping (`₹1,24,999`). |
| `seed` | `7` | Seed for every generated ornament. |
| `onAddToCart` | — | `(item, bag)` after each quick-add. |
| `onCheckout` | — | `(bag, total)` from the drawer. |
| `onNavigate` | — | `(target)` for every link and button without an `href`. |

## Accessibility

- The headline carries its full text as `aria-label`; the animated words are hidden.
- The ribbon's text is also present once, unanimated, for screen readers.
- Shades are a `radiogroup`; the hours are a real `range` input; the drawer is a
  `dialog` that Escape closes, with its controls out of the tab order while shut.
- `prefers-reduced-motion` skips all GSAP choreography (the page renders finished),
  stops both marquees and the hover sweeps.

## Photo credits (Unsplash)

- Hero: `photo-1621801306185-8c0ccf9c8eb8` (two hands with henna, dark background)
- Feature: `photo-1599536884823-1bc4fb5f9dea` (tins of spices from above)
- Powder: `photo-1603122612817-2fe0e0631a93` · Cones: `photo-1774019410616-2b38e4eeabd2`
- Stencils: `photo-1565368114375-ba1a4db7099f` · Seal: `photo-1764640848891-9b23d3632ccf`
- Indigo demo: `photo-1556536088-f010a312a8d3`, `photo-1581600140682-d4e68c8cde32`,
  `photo-1782876224837-e7163083c4c7`, `photo-1566745265763-de510bdae868`,
  `photo-1781377012601-93162be3a433`

## Notes for publishing

- The default font and photos come from Google Fonts and Unsplash. 21st's capture
  sandbox blocks external origins, so supply `media/mehndi-atelier-template/default.png`
  as `--preview`.
- Reference images: `media/mehndi-atelier-template/reference.webp` (local only).
