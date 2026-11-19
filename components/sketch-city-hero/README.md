# Sketch City Hero

A travel landing hero on warm paper. The header has a logo mark, a "Cities" dropdown, a dotted divider, a second link, and search, saved and menu icons. Below it sit a two-line grotesque headline, a stats line with coral numbers, and a serif blurb. Behind them, a hand-drawn panorama of mixed world cities bleeds off the right and bottom edges: canal boats, a stone bridge, whitewashed houses, an arch, a busy street and a skyline, with a few coral details over pale mint silhouettes.

The copy is about Kedhareswer, under the placeholder wordmark "Kedhar's Atlas".

**No dependencies.** React is the only import.

## Motion

| What | How |
|---|---|
| Headline | Each word rises out of its line, 70 ms apart. It waits for the web fonts so it never swaps face mid-rise. |
| Stats | The numbers count up (ease-out cubic, 1.5 s). Each number has a reserved slot, so the words after it never shift. |
| Drawing | The streets ink in from left to right behind a soft edge. The mint skyline washes in 0.75 s behind them. |
| Parallax | The skyline drifts slowly and follows the pointer and the scroll more than the streets do. Every input is eased. |
| Reduced motion | Nothing moves. The text, numbers and drawing are all in place on the first frame. |

The parallax loop pauses when the hero is off screen or the tab is hidden.

## Layout

- The drawing is two transparent layers, `skyline.webp` (the mint) and `streets.webp` (ink, coral and opaque paper fills). The mint layer is painted 14 drawing px under the streets, so the layers can move apart without opening a gap. Parallax is capped below that.
- The component measures the copy's real text boxes and knows the drawing's skyline, the topmost drawn pixel in each of 48 columns (`SKY`). It then picks the largest scale and smallest rightward bleed that keep every line of copy in open sky with 16 px of clearance. The headline and blurb never sit on top of drawn lines, at any size.
- The drawing is laid out at its on-screen size and never enlarged with `transform: scale`.
- Below 720 px of width, the copy stacks above the drawing. The drawing then fills the remaining height, spires included.
- Type scales with both the width and the height of the hero (container query units), so short, wide screens keep the reference's proportions.

## Usage

```tsx
import SketchCityHero from "@/components/ui/sketch-city-hero"

<SketchCityHero />
<SketchCityHero headline={["Slow down.", "Look up."]} stats={[{ value: 9, label: "Cities" }]} accent="#d9603b" />
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `brand` | `"Kedhar's Atlas"` | Wordmark beside the logo. |
| `menuLabel` / `menuItems` | `"Cities"` / six cities | The dropdown. The menu button shows the first four items plus `linkLabel`. |
| `linkLabel` / `linkHref` | `"Field Notes"` / `#field-notes` | The link after the dotted divider. |
| `headline` | `["For the unhurried.", "Travel off-script."]` | Two lines. |
| `stats` | 18 Cities, 24 Itineraries, 5,312 places | `{ value, label }[]`, joined with commas. |
| `blurb` | Kedhareswer copy | Serif paragraph under the stats. |
| `accent` | `#ee7454` | Numbers, chevron and focus rings. |
| `height` | `100svh` | Must be a definite length. |
| `imageBase` | `https://kedhar-components.pages.dev/sketch-city-hero/` | Holds `skyline.webp` and `streets.webp`. |
| `fontHref` | Google Fonts (Bricolage Grotesque, Newsreader) | Pass `null` to bring your own. |

## Notes

- The drawing was generated with ChatGPT and split into its two layers locally. It is served from the catalog site, so the component file stays well under 200 kB.
- It assumes no theme tokens. The paper and ink are its own. Under `.dark`, the paper turns to near-black and the drawing is inverted with a hue rotation, so the lines read cream and the coral stays coral.
- The dropdown and the menu close on Escape or on a click outside them.
