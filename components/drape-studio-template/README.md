# Drape Studio Template

A one-page site for Kedhareswer's design and front-end practice, dressed in deep red leather, soft window light and big type. A three-ring glass mark loads in a progress ring and blooms into the hero. After the hero come a pinned row of pillar cards over perforated leather, a globe with client pins, a "next step" call with three leather orbs, giant letter columns, the name stamped in leather, a "YOU DESIGN / I DELIVER" letter scatter, two turning swatch wheels, an industries carousel, a newsletter envelope and a footer with a live studio clock.

## What it does

- **Load.** The count runs from 3% to 100% while the mark turns red, then black, then glass. At the same time it spins 150° inside a red progress ring. Then three petals of the hero fabric open out from the mark and fill the screen. The glass mark rides on top and settles at its hero size.
- **Hero.** The fabric drifts slowly. The glass mark sits in the middle: a lens that blurs and lifts the fabric behind it, under a lit bevel rim, and it tilts toward the cursor. The two headline lines rise in, and the "Browse Selected Work" pill unrolls out of its red dot.
- **Nav.** A frosted brand chip and a round menu button stay pinned. The language and section links fade away after the hero. The chips switch between light and dark to match the section underneath.
- **Pillars.** The section pins for 2.6 screens while five cards slide sideways across a perforated-leather backdrop.
- **Globe.** Pins pop in and cards rise beside them. Three tabs (Clients, Studio, Partners) cycle every five seconds with a progress bar, and you can click them.
- **Ink headings.** Words go from grey to ink as a heading climbs the screen.
- **Letters.** Four giant letter columns slide against each other as you scroll.
- **Name.** "Kedhareswer" is filled with perforated leather. Its letters stamp in out of order while the word settles from 114% to 100%.
- **Scatter.** "YOU DESIGN" breaks apart letter by letter (blur, grey, drift), and "I DELIVER" assembles in its place.
- **Wheels.** Two big wheels of swatch tiles turn with scroll, colour satins on the left and material finishes on the right. The colour tile at the front feeds the centre card.
- **Industries.** Six products swap inside a ring, one per stretch of scroll, with a counter, a label and a moving marker on the ruler.
- **Newsletter.** The form is a letter in a leather envelope. Once the email is valid and the box is ticked, Submit turns black. On submit, the letter drops into the envelope, and a red leather card and a frosted "Thank You!" card rise out.
- **Feel.** Mouse-wheel scrolling glides (off for touch, keyboard and reduced motion; `smoothScroll={false}` turns it off). A quiet film grain sits over the page. Pill buttons lean toward the cursor, card panels sharpen on hover, swatches zoom.
- **Footer.** A closing line, the email, section links, the studio's local time (IST) and a back-to-top button over a giant dark wordmark.
- **Mobile.** Below 760px the nav keeps only the chips and the menu sheet, and cards stack. The globe hides its address cards, the wheels scale down, and the industries label adds a line of description.

## Motion

Measured frame by frame on the reference screen recording (1440 × 806 at 0.25s steps), then compared side by side with this build at the same moments.

| | Value |
|---|---|
| Load count | 0 → 100% in 1.9s, ease-in-out; mark spins 0 → -150° |
| Mark colour | red until 38%, black by 52%, glass from 78% to 92% of the count |
| Bloom | starts as the count lands, 1s quadratic in-out; petals ≈ 3.5× the mark 0.5s after 100%; ring fades in the first 20% |
| Reveals | y 28 → 0 with fade, 0.9s `cubic-bezier(.16,1,.3,1)` |
| Hero | headline lines rise 1.1s (2nd line +0.12s); pill unrolls 1s from its dot (+0.45s); fabric drifts on a 22s loop |
| Pillars | track x runs from the gutter to the far gutter over 2.6 screens; backdrop 1.04 → 1.12 |
| Letter columns | odd columns sink, even ones rise, 0.42 of the viewport each way across the section |
| Scatter | letter *i* leaves over 0.28 + 0.022*i* → +0.12 of the pin; letter *j* arrives over 0.5 + 0.024*j* → +0.12; 8px blur, 24px drift |
| Wheels | radius 787px at 1440, a tile every 10°, front tiles at 24.3% and 72.4% of the width; turn -40° → 70° |
| Industries | six equal stretches; product swap 0.6s fade, 0.8s rotate ±24° / scale .72 |
| Envelope | letter drops 0.8s `cubic-bezier(.65,0,.35,1)`; cards rise 1.1s at +0.55s / +0.7s |

One scroll handler runs per frame and only while scrolling. **Reduced motion:** with `prefers-reduced-motion`, the loading screen is skipped. Nothing drifts, blurs or spins, headings are fully inked, the scatter swaps in one step half-way through, and the globe tabs don't advance by themselves.

## Usage

```tsx
import DrapeStudioTemplate from "@/components/ui/drape-studio-template"

export default function Page() {
  return <DrapeStudioTemplate />
}
```

| Prop | Default | |
|---|---|---|
| `height` | `"100svh"` | Height of one screen: the hero and every pinned scene. Use a definite length. |
| `email` | Kedhareswer's address | Where "Contact Us" and the footer link write to. |
| `assetBase` | the component site | Base URL of the pictures, if you host them yourself. |
| `skipIntro` | `false` | Start without the loading screen. |
| `smoothScroll` | `true` | Eased mouse-wheel scrolling. |
| `className`, `style` | | Passed to the root. |

The root is `width: 100%` and scrolls with the page. Styles are scoped to `.ds-root` and use only the component's own colours. A `.dark` ancestor turns the paper sections to near-black. The red, the leather and the dark scenes stay as they are.

## Assets and dependencies

- **Only `react`.** No other packages.
- **Pictures:** 32 WebP images generated with ChatGPT for this template. They are the red leather hero, soft window-blind light, black perforated leather, Earth over Asia, nine satin swatches, nine material finishes, four dark close-ups and six red leather products. They are served from `kedhar-components.pages.dev/drape-studio-template/` and kept out of the file so it stays under 21st's 200 kB limit. Pass `assetBase` to host your own, and keep the file names.
- **Font:** a Latin subset of Inter Tight (SIL Open Font License), variable weights 400–600, embedded as `DsSans`.
- **The mark** is an original three-ring SVG, drawn in code. The glass is a CSS `backdrop-filter` lens masked to the mark, under an SVG specular-lighting bevel.
