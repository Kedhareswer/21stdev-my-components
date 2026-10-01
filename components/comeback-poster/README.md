# Comeback Poster

A full-bleed hero laid out like a printed gig poster. A paper masthead carries
a swash title and a grid of theme words, over an oil-painted field of red
poppies. A hooded figure in a white robe stands in the field, and its empty
face turns toward you.

Everything is drawn in code, with no images. The field is two canvases (the
poppies behind the figure, then the ones in front of it): a hazy backdrop of
hills, a few thousand brush marks and a few hundred live poppies on springs.
The figure, the star, the barcodes, the emblems and the contour lines are SVG.

## What it does

- **The field breathes.** Poppies sway in a slow wind and part around the pointer.
- **Click or tap the field** and a clutch of new poppies blooms there, throwing petals.
- **Hover a theme word** and the title decodes into it. Click to keep it: the
  word inverts, a gust sweeps across the field, and `onKeywordSelect` fires.
  Click again to let it go.
- **The masthead's contour lines** swell around the pointer like a lens.
- **The figure watches.** The hood turns toward the pointer and the void inside
  it turns further. Hover the figure and its red drips run.
- **The corner dots are controls.** Bottom-left stills or restarts the wind.
  Bottom-right sends a gust.
- Hovering the emblems spins them, and hovering the rings pulls them apart.

```tsx
import ComebackPoster from "@/components/ui/comeback-poster"

// As printed
<ComebackPoster />

// Your own
<ComebackPoster
  title="Homecoming"
  keywords={["Studio", "Letters", "Prints", "Motion", "Type", "Colour",
             "Friends", "Garden", "Archive", "Night", "Bloom", "Again"]}
  from="01.10.26"
  to="31.10.26"
  palette={{ paper: "#efe7d8", ink: "#1f2a44", poppy: "#e89a1c" }}
  seed={21}
  onKeywordSelect={(w) => console.log(w)}
/>
```

**No dependencies beyond React.**

## Props

| Prop | Default | Description |
|---|---|---|
| `title` | `"Comeback"` | The big word. First and last letters use the swash script. A last letter with a descender is set as a capital so it doesn't hang into the grid. |
| `keywords` | 12 words | Theme words. Laid out 6 / 4 / rest like the print, or in rows of 4 below 640px. |
| `onKeywordSelect` | — | `(word \| null) => void`, called when a word is kept or released. |
| `from` / `to` | `"25.02.25"` / `"05.03.25"` | The dates stacked down each side. Split on `.`, `/`, `-` or spaces. |
| `topNote` | — | Fine print at the top of the masthead (hidden below 640px). |
| `footNote` | — | Fine print along the foot (hidden below 640px). |
| `edition` | `"No. 01 / The return issue"` | Caption beside the left barcode. |
| `palette` | see below | Partial hex overrides. |
| `poppies` | `220` | Live poppies (0–600). The backdrop paints thousands more on its own. |
| `seed` | `7` | Reshuffles the field, the drips and the barcodes. Deterministic. |
| `figure` | `true` | Show the hooded figure. |
| `interactive` | `true` | Pointer, click and gust interactions on the painting. |
| `fontHref` | Google Fonts URL | Stylesheet for Bodoni Moda, Pinyon Script and Syncopate. `null` loads nothing. |
| `displayFont` / `scriptFont` / `labelFont` | stacks | Font stacks for the title caps, the swash letters and everything else. |
| `height` | `"100svh"` | Root height. Must be a definite length, never a percentage. |
| `className` | `""` | Extra root classes. |

| Palette key | Default | Used for |
|---|---|---|
| `paper` | `#eae8e2` | the masthead |
| `ink` | `#3a2b27` | title, words, rules, the big star |
| `poppy` | `#d9301d` | every poppy, petal and drip |
| `field` | `#2b3226` | the ground and foliage |
| `haze` | `#b4b4ad` | sky, hills, horizon mist |
| `robe` | `#e2e1dc` | the figure |
| `mark` | `#f5f2ec` | type and outlines printed over the painting |

Palette values must be hex (`#rgb` or `#rrggbb`), because the painter mixes its
shades from them. Any other value falls back to the default.

## Notes

- **Fonts** are loaded with an injected `<link>`, never `@import`. The poster
  still reads on the fallback stacks (Bodoni 72/Didot, Snell Roundhand, Helvetica).
  The 21st capture sandbox blocks external origins, so render covers with
  `fontHref={null}` or supply your own `--preview`.
- **Reduced motion** holds the field still. Words are set without the decode,
  blooms appear fully grown and nothing spins.
- The painting pauses off-screen and in background tabs. DPR is capped at 2.
- The poster has its own palette, so it looks the same in light and dark themes.
