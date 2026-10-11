# Pixel Park Template

A complete one-page site for a small New York company, told in pixel art. A
moonlit park meadow sits under a floating glass nav, with the company name and
a frosted mission card over it. Below that come a manifesto, a signed letter
with a postage stamp, a careers card over a skyline and lake, contact details,
a closing line, a footer with a subscribe field, and a snowy park at the very
bottom.

```tsx
import PixelParkTemplate from "@/components/ui/pixel-park-template"

<PixelParkTemplate
  brand="Fieldnote Labs of Brooklyn"
  city="Brooklyn"
  cityCode="BKLYN"
  scene="auto"
  seed={21}
  mission={{ title: "…", founded: "June 2024", founders: [{ name: "Noor Haddad" }, { name: "Sam Okafor" }] }}
  onSubscribe={(email) => fetch("/api/subscribe", { method: "POST", body: email })}
/>
```

**No dependencies beyond React.** Every picture is painted in the file. Each
scene is drawn pixel by pixel into a small raster from a seeded PRNG, then
scaled up with crisp pixels:

- Lawns, skies and snow use ordered (Bayer) dithering.
- Foliage is built from shaded leaf clusters.
- People, benches, picnic blankets, lamps, snowmen, sleds, a dog, ducks and the
  statue are hand-drawn sprites.

No fonts, images or stylesheets load, so it renders inside the 21st capture
sandbox.

## Play with it

| Do this | And |
|---|---|
| Move the pointer over the hero | The trees and the meadow move apart in parallax, and the fireflies gather where you point |
| Click the meadow | More fireflies come out (by day, petals scatter instead) |
| Click the clock in the corner | The park goes through dawn, day, dusk and night, and repaints each time |
| Scroll to the letter | The signatures write themselves |
| Hover the letter | It tilts slightly toward the pointer |
| Click the stamp | It gets postmarked with today's date. Click again to clear it |
| Click the sky on the careers card | A flock of birds takes off. Clouds drift, ducks paddle and the lake glints the whole time |
| Click *Copy* next to the email | The address goes to the clipboard |
| Send the subscribe form | A bad address shakes the field; a good one gets a confirmation |
| Move over the snowy park, or click it | The snow drifts away from the pointer; a click throws a puff of snow |

The nav links scroll smoothly to their sections, the current section is marked
with a dot, and the CTA focuses the subscribe field. On small screens the links
fold into a menu.

## Props

| Prop | Default | Description |
|---|---|---|
| `brand` | `"The Long Weekend Company of New York"` | Hero headline, mission sentence, copyright. |
| `city` / `cityCode` | `"New York"` / `"NYC"` | Careers title, stamp, postmark, clock label, letter sign-off. |
| `timeZone` | `"America/New_York"` | IANA zone for the clock and for `scene="auto"`. |
| `scene` | `"night"` | `"night"`, `"dawn"`, `"day"`, `"dusk"`, or `"auto"` to follow the clock. |
| `seed` | `7` | Re-plants the trees and flowers, and moves the people. |
| `logo` | sunrise mark | Replaces the mark in the nav and above the closing line. |
| `nav` | About, Writing, Careers | `{ label, href }[]`. `#about`, `#letter`, `#careers`, `#contact`, `#closing`, `#updates` and `#top` scroll in-page. |
| `cta` | `Get early access → #updates` | Nav button. `#updates` also focuses the email field. |
| `mission` | — | `{ title, founded, founders, tail, backedBy }`. `founders` is `{ name, href? }[]`; names are underlined, and linked when they have an `href`. |
| `manifesto` | — | `{ kicker, title }`: the small line and the big serif statement. |
| `letter` | — | `{ paragraphs, signoff, signers, stampValue }`. Each signer gets a signature generated from their name, so a name always signs the same way. |
| `careers` | — | `{ title, body, action }` for the card over the skyline. |
| `details` | HQ, press kit, email | `{ label, value, href?, kind? }[]`. `kind: "email"` adds a copy button and `"download"` an arrow chip. `\n` in `value` breaks the line. |
| `closing` | — | `{ title, body, action }`. |
| `footerLinks` / `socials` | sensible defaults | `socials` kinds: `"x"`, `"linkedin"`, `"github"`, `"instagram"`. |
| `subscribePlaceholder` / `onSubscribe` | — | `onSubscribe(email)` is awaited. If it throws, the field shows an error instead of the confirmation. |
| `copyright` / `credit` | `© {brand} 2025` / `Painted pixel by pixel` | Over the snowy park. |
| `theme` | `"auto"` | `"auto"` follows a `.dark` class on an ancestor; `"light"` / `"dark"` force it. |
| `animateIn` | `true` | The fade-and-rise on load. |
| `height` | `"100svh"` | Minimum hero height. Always a definite length. |
| `className` | `""` | Extra classes on the root. |

## Notes

- **Dark mode** turns the page navy and the letter card dark. The paintings
  keep their own light, so the postmark switches from ink to chalk.
- **Repaints are cheap and rare.** Each scene paints once per size and scene,
  debounced on resize. The pixel size is a whole number of CSS pixels, so
  edges stay crisp. Moving things (fireflies, birds, ducks, snow, lamp
  flicker) live on a separate overlay at about 30 fps, and only while that
  scene is on screen.
- **Accessibility.** The headline is a real `<h1>`. The clock is a labelled
  button that says what it will change to. The stamp is a toggle with
  `aria-pressed`, the subscribe field has a label and a live status line, and
  all the art is `aria-hidden`.
- **`prefers-reduced-motion`.** No intro, parallax, overlays, signature
  drawing or hover motion. The clock still changes the scene and the stamp
  still postmarks.
- **Reveal on scroll** only hides content that starts below the fold, and only
  once JS runs, so server-rendered pages and screenshots are never blank.
- All names, companies, investors and addresses in the defaults are fictional.
  Swap in your own.
