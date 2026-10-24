# Old Masters Preloader

A preloader cut like an editorial poster, for a portfolio that wants to open
with some grandeur. The load is a Greek meander engraved round a numeral on a
black stage; at 100 the ring flashes, dissolves outward, and a classical
photograph develops out of the dark while a giant wordmark rises letter by
letter **behind the figure**. What follows is a live landing: parallax and a
spotlight under the pointer, a tagline, a call to action, nav, outlined
labels, two asides, bracketed measurement tags and a plate number.

1. **Curtain.** The rule draws across the top with the eyebrow set into it,
   the nav and the brand fade in, four-point stars blink on at the corners,
   the outlined labels arrive at 20% and 50%.
2. **Meander.** A continuous Greek key draws itself clockwise round the ring
   as the load climbs, over a ghost of the full pattern. The numeral counts
   and a ratio read-out (`0.4700 — LOADING`) ticks under it.
3. **Unveil.** At 100 the key turns to light, the ring swells and fades, the
   photograph develops from black (exposure, focus and a slow pull-back), and
   the wordmark rises from below the frame, one letter after the next, set
   between the dark ground and the lit marble. The tagline and the call to
   action fade up; the measurement tags draw on.
4. **Landing.** The stage stays live. Every layer parts under the pointer at
   its own depth and a warm spotlight follows it across the figure. With
   `children`, the whole stage lifts off the page after `holdMs`, or as soon
   as the call to action is pressed.

**The word behind the figure needs no cutout.** The photograph's own
luminance is turned into an SVG mask (a colour matrix, then a linear
transfer round `threshold`), so the type is covered wherever the picture is
lit and shows wherever it is dark. Any lit figure on a dark ground works:
marble, a chiaroscuro painting, a studio portrait. Flip `subject="dark"` for
ink on paper, where the figure is darker than the ground. On stages narrower
than `behindBelow` the word is set in front instead, because a phone crop is
mostly figure.

```tsx
import OldMastersPreloader from "@/components/ui/old-masters-preloader"

// The full opening, then the landing
<OldMastersPreloader />

// As a gate over your page: the stage lifts off it
<OldMastersPreloader progress={loaded} holdMs={2600} onComplete={() => {}}>
  <YourPage />
</OldMastersPreloader>

// Your photograph, word, copy and tone
<OldMastersPreloader
  tone="carmine"
  face="condensed"
  image="https://images.unsplash.com/photo-…"
  focal={[0.5, 0.25]}
  threshold={0.42}
  wordmark="Arcadia"
  tagline="Your craft. Your name. Your rules."
  eyebrow="Studio · Est. MMXIX"
  brand="A."
  labels={["How it works", "Reviews"]}
  nav={[{ label: "Work", href: "/work" }, { label: "About", href: "/about" }]}
  cta={{ label: "Sign up", href: "/signup" }}
/>

// Returning visitors: straight to the landing
<OldMastersPreloader skipIntro />
```

**React is the only import.** The faces (Bodoni Moda, Bebas Neue, Pinyon
Script, Jost) arrive through one injected Google Fonts `<link>`; pass
`fontHref={null}` to load nothing and fall back to the system stacks. The
meander, the stars, the tags and the barcode are drawn in the file; the grain
is painted onto a canvas tile once on mount. One `requestAnimationFrame` loop
drives the load, the ring, the read-outs and the parallax.

## Photographs

Every image is a prop. The demos use these, all on Unsplash:

| Demo | Photograph |
|---|---|
| default | Jack Hunter — the head of Michelangelo's David ([photo-1601887389937](https://images.unsplash.com/photo-1601887389937-0b02c26b602c)) |
| carmine | Nayani Teixeira — the Apollo Belvedere against black, graded as a two-ink print ([photo-1574359587026](https://images.unsplash.com/photo-1574359587026-daf1bfd26baa)) |
| gilt | Europeana — a hermit scholar by candlelight, an old-master painting ([photo-1584727638096](https://images.unsplash.com/photo-1584727638096-042c45049ebe)) |
| vellum | National Gallery of Art — Perseus with the head of Medusa, a watercolour on paper ([photo-1767257147797](https://images.unsplash.com/photo-1767257147797-9628b6c3d934)) |

Pick a picture with one lit figure and a quiet, dark ground, then set
`threshold` so the word disappears behind the figure and nowhere else; raise
`softness` for a painted edge, lower it for a cut one. `focal` anchors the
crop. `exposure` lifts a dark photograph once it has developed.

## Props

| Prop | Default | Description |
|---|---|---|
| `progress` | — | Real progress, `0`–`100`. Leave it out for a simulated load. |
| `durationMs` | `4600` | Length of the simulated load. It surges and stalls like a real one. |
| `minLoadMs` | `2400` | The ring is shown at least this long, however fast the load. |
| `skippable` | `true` | A click, Enter, Space or **Skip** rushes the load to 100. |
| `skipIntro` | `false` | Open straight on the landing. |
| `image` | David | The photograph. |
| `imageAlt` | — | Its alt text. |
| `focal` | `[0.5, 0.36]` | Where the crop is anchored, `[x, y]` in 0–1. |
| `subject` | `"light"` | `"light"` for a lit figure on a dark ground, `"dark"` for ink on paper. |
| `behind` | `true` | Set the wordmark behind the figure. `false` stacks it in front. |
| `behindBelow` | `640` | Stages narrower than this set the word in front. |
| `threshold` | `0.4` | Luminance where the figure starts to cover the word. |
| `softness` | `0.22` | Width of the soft edge round that threshold. |
| `exposure` | `1` | Brightness multiplier for the developed photograph. |
| `duotone` | carmine only | Grade the photograph as a two-ink print in the stage colour. |
| `wordmark` | `"Kallisto"` | The large word, fitted to the width of the stage. |
| `face` | `"didone"` | `"didone"` (Bodoni Moda), `"condensed"` (Bebas Neue) or `"grotesk"` (Jost). |
| `scriptInitial` | `false` | Set the first letter in Pinyon Script, overlapping the rest. |
| `tagline` | — | Set in italic over the figure. |
| `eyebrow` | `"Portfolio · MMXXVI"` | Small line set into the top rule. |
| `brand` | `"K."` | The mark in the middle of the nav. |
| `nav` | Work, Studio, Journal, Contact | `{ label, href? }[]`, split left and right. Hidden under 640px. |
| `labels` | Ars longa, Vita brevis | Two outlined labels under the nav. |
| `asides` | two columns | `{ title, text }[]`, left and right. 1024px and up. |
| `annotations` | three | `{ x, y, label }[]`, bracketed tags over the photograph, in percent of the stage. Hidden under 640px. |
| `plate` | `"Pl. I"` | Plate number beside the final ratio. |
| `loadingLabel` | `"Loading"` | Under the ring. |
| `cta` | `{ label: "Enter" }` | With `href` it's a link. |
| `onEnter` | — | Fired when the call to action is pressed. |
| `onLoaded` | — | Fired once the landing is up. |
| `onComplete` | — | With children: fired once the stage has lifted. |
| `children` | — | The page behind the stage. Rendered from the first frame so it loads under the ring. |
| `holdMs` | `2600` | With children: how long the landing holds before lifting. `0` waits for the call to action. |
| `tone` | `"noir"` | `"noir"`, `"carmine"` or `"vellum"`. |
| `palette` | from `tone` | Partial overrides, see below. |
| `fontHref` | Google Fonts URL | Stylesheet for the faces. `null` loads nothing. |
| `height` | `"100svh"` | Root height. Always a definite length, never `h-full`. |
| `className` | `""` | Extra root classes. |

### Palette

| Key | Noir | Used for |
|---|---|---|
| `stage` | `#0b0a09` | Background. |
| `text` | `#efe6d6` | Interface text, the numeral, the tagline. |
| `muted` | `#9a917f` | Eyebrow, read-outs, asides. |
| `accent` | `#d9b25c` | The key, the stars, the script initial, aside titles. |
| `word` | `#f1e9d8` | The wordmark. |
| `rule` | `#4a4336` | Hairlines and outlines. |
| `glow` | `#ffd98a` | The flash and the spotlight. |

## Notes

- The stage carries its own colours, so it reads the same on light and dark
  hosts. `tone="vellum"` is the one for a light page.
- The mask is an SVG `<mask>` referenced from CSS `mask`, supported in
  current Chrome, Safari and Firefox. Where it isn't, the word is set in front.
- The default wordmark, copy and tags are invented. Swap in your own.
- `prefers-reduced-motion` stops the parallax, the twinkle and the grain; the
  photograph and the letters fade in instead of developing and rising, the
  ring doesn't swell, and the stage lifts in half the time.
- The ring is a `role="progressbar"` with its value; the landing is announced
  through a live region. During the load the root takes focus so Enter and
  Space can skip. Nav items without `href` render as buttons.
