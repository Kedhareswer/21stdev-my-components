# Featured Cities Carousel

A "Featured Cities" heading and serif subtitle sit on the left, with round previous and next buttons on the right. Below them, a row of tall peach cards runs off the right edge of the screen. Each card has a city name, a short witty serif blurb and a hand-drawn landmark anchored to its bottom: Amsterdam, New Orleans, Prague, Lisbon, Kyoto, Mexico City, Istanbul, Marrakech and Havana.

The subtitle mentions Kedhareswer. The cities are real, and the blurbs are original.

**No dependencies.** React is the only import.

## Interaction

| Input | What happens |
|---|---|
| Arrow buttons | Move exactly one card. They disable at either end. |
| ← / → on the focused row | Move one card. Home and End jump to either end. |
| Mouse drag | The row follows the pointer, then glides to the nearest card. A drag never follows a card's link. |
| Touch and trackpad | Native horizontal scrolling with scroll snapping. |
| Hover | The card lifts 8 px with a soft shadow. Its drawing rises 6 px over a faint coral glow. |
| First view | The cards slide in one after another. |
| Reduced motion | No entrance, lift or glide. The arrows and keys jump instead of scrolling smoothly. |

A polite live region announces the city at the start of the row.

## Layout

- The heading, the first card and, at the end of the row, the last card all line up on one page gutter, `max(20px, 6%, (100% − 1180px) / 2)`. Cards snap to the same gutter.
- Cards are 300 px wide (268 px under 1100 px, about 74% of the width on phones), with 20 px gaps. Their height follows the section height, between 400 and 470 px.
- Each drawing is laid out at its on-screen size, contained in the card's lower part, and sits on the card's bottom edge.

## Usage

```tsx
import FeaturedCitiesCarousel from "@/components/ui/featured-cities-carousel"

<FeaturedCitiesCarousel />
<FeaturedCitiesCarousel
  title="Featured Cities"
  cities={[{ name: "Lisbon", blurb: "Seven hills…", image: "lisbon", href: "/lisbon" }]}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `title` / `subtitle` | "Featured Cities" / Kedhareswer line | |
| `cities` | nine cities | `{ name, blurb, image, href? }`. `image` is a file name under `imageBase`, without `.webp`. |
| `accent` | `#ee7454` | Focus rings, arrow hover and the hover glow. |
| `cardColor` | `#fbe8de` | Card fill in light mode. |
| `height` | `680px` | Must be a definite length. |
| `imageBase` | `https://kedhar-components.pages.dev/featured-cities-carousel/` | |
| `fontHref` | Google Fonts (Bricolage Grotesque, Newsreader) | Pass `null` to bring your own. |

## Notes

- The drawings were generated with ChatGPT as one sheet of nine. They were cut on its empty gutters, and each cut was checked to have no stroke touching its edge. They are served from the catalog site.
- It assumes no theme tokens. Under `.dark`, the section turns warm black, the cards turn deep brown and the drawings are inverted with a hue rotation.
