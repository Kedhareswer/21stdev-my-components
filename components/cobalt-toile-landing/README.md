# Cobalt Toile Landing

A complete landing-page template drawn as a copperplate engraving: cobalt ink on
cream paper. Under a night sky with two moons, a carved arch frames the
headline, statues stand on pedestals either side and a garden of hatched
foliage fills the plate. The page continues in the same hand: a client marquee,
an about section with a turning seal, practice areas as die-cut bookmarks, a
ledger of services, a "latest press" list, a toile band where temples meet
satellites, a contact band and a footer with a chinoiserie landscape.

```tsx
import CobaltToileLanding from "@/components/ui/cobalt-toile-landing"

<CobaltToileLanding
  brand="Atheneum Studio"
  palette="indigo"
  hero={{ title: "Old Stones,\nNew Rooms", subtitle: "…", action: { label: "See our practice", href: "#solutions" } }}
  solutions={[{ title: "Conservation", quote: "Repair before you invent.", body: "…", art: "steamer", tone: "paper" }]}
  onSubscribe={(email) => fetch("/api/subscribe", { method: "POST", body: email })}
/>
```

**No dependencies beyond React.** Every illustration (the arch, statues,
temples, moons, bookmarks, satellite, pylons, pavilion, vases and boat) is SVG
drawn in the file from hatch patterns and seeded foliage. No fonts, images or
stylesheets load, so it renders inside the 21st capture sandbox.

## Play with it

| Do this | And |
|---|---|
| Move the pointer over the hero | Five engraved layers part in parallax around the arch |
| Click (or Enter on) a moon | It moves through crescent → quarter → gibbous → full |
| Click a nav link | Smooth-scrolls to the section; the underline follows you as you scroll |
| Click a bookmark, or use ← → | Pulls that practice out and opens its page beside the shelf |
| Click a ledger row | Unfolds the service's details, deliverables and typical length |
| Hover a press row | An engraved preview follows the cursor; filter by category; *Show all* |
| Click the numerals on the toile | Notes on each figure; Escape or click away to close |
| Subscribe in the footer | Bad addresses shake; good ones are sealed with wax |
| Click a "Printed in" swatch | Reprints the whole page in cobalt, indigo, delft or oxblood |

The hero etches itself in on load: the plate opens from the arch outward, the
layers settle and the headline rises. Stars twinkle, a shooting star crosses
now and then, the satellite and drone drift, birds flap and a boatman poles
down the river in the footer.

## Props

| Prop | Default | Description |
|---|---|---|
| `brand` | `"Hesper & Co."` | Nav, footer, the typewriter's paper and the monogram letter. |
| `monogram` | first letter of `brand` | Letter cut into the monogram bookmark. |
| `logo` | engraved mark | Replaces the mark beside the brand and inside the arch. |
| `nav` | About, Solutions, Services, Insights | `{ label, href }[]`. `#about`, `#solutions`, `#services`, `#insights`, `#contact` scroll in-page. Anything else is a normal link. |
| `cta` | `Get started → #contact` | Nav button. |
| `hero` | — | `{ title, subtitle, action, est, edition }`. `\n` in `title` breaks the line. `est` / `edition` are the corner labels. |
| `clients` / `clientsLabel` | 8 names | The marquee. |
| `about` | — | `{ kicker, statement, body, stats, seal }`. Wrap words in `*asterisks*` to set them in italic ink. `stats` are `{ value, suffix?, label }` and count up. `seal` runs around the seal. |
| `solutionsCopy` / `solutions` | 4 practices | `{ title, kicker?, quote, body, points?, art?, tone?, action? }`. `art` is `"typewriter"`, `"steamer"`, `"monogram"` or `"tower"`; `tone` is `"paper"` or `"ink"`. `quote` is printed on the bookmark. |
| `servicesCopy` / `services` | 5 services | `{ title, summary, details?, deliverables?, duration? }`. |
| `pressCopy` / `press` | 7 articles | `{ title, source, date, category?, href? }`. One-word sources become a monogram tile, longer ones a wordmark. External `href`s open in a new tab. |
| `notes` | 4 notes | Captions for the toile's hotspots, in order: temple, Justice, satellite, pylon. Listed under the band on phones. |
| `contactBand` | — | `{ title, body, action, secondary }`. `*asterisks*` work in `title`. |
| `contact` | — | `{ email, phone, location }` in the footer. |
| `tagline` | — | Footer description. |
| `columns` | 3 columns | `{ title, links }[]`. |
| `newsletter` | The Almanac | `{ title, body, placeholder, success }`. |
| `onSubscribe` | — | `(email) => unknown`. Awaited; a throw shows an error instead of the seal. |
| `socials` | 4 | `{ kind: "x" \| "instagram" \| "linkedin" \| "facebook", href, label? }[]`. |
| `legal` / `copyright` | 3 links / `© year brand` | Footer bar. |
| `palette` | `"cobalt"` | `"cobalt"`, `"indigo"`, `"delft"` or `"oxblood"`. |
| `ink` / `paper` | from palette | Override either colour. |
| `paletteSwitcher` | `true` | The "Printed in" swatches. Turn off for production. |
| `theme` | `"auto"` | `"auto"` follows a `.dark` class on an ancestor; `"light"` / `"dark"` force it. |
| `intro` | `true` | The etch-in on load. |
| `height` | `"100svh"` | Minimum page height. Always a definite length. |
| `className` | `""` | Extra classes on the root. |

## Notes

- **Two colours.** Everything is mixed from `ink` and `paper` with
  `color-mix()`. Dark mode prints the plate as a night-blue negative: deep
  paper, pale lines and bronze-dark statues.
- **The hero never crops the arch.** The plate is sized from the hero's height
  and drawn wider than its frame, so wide screens show more garden and narrow
  ones keep the arch centred.
- **Small screens.** The nav folds into a menu, bookmarks scroll sideways above
  their panel, the ledger hides summaries until a row opens, and the toile's
  notes are listed under the band.
- **Accessibility.** Bookmarks are a tab list with arrow keys, ledger rows are
  buttons with `aria-expanded`, moons and hotspots are labelled buttons, and the
  headline is a real `<h1>`.
- **`prefers-reduced-motion`.** No intro, parallax, marquee, twinkle, count-up
  or drifting. The boat stays moored. Everything still opens and closes.
- **Reveal on scroll** only hides what starts below the fold, and only once JS
  runs, so server-rendered pages and screenshots are never blank.
- Escape (for the menu and toile notes) and scroll are listened for on
  `window`. That suits a full-page template; keep it in mind if you embed two.
