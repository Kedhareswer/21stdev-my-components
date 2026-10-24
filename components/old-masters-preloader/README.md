# Old Masters Preloader

A preloader staged like a classical diorama, for a portfolio that wants to
open with some grandeur. The wordmark is the loader: it stands in the middle
of a black stage as hairline outlines and fills with marble from the bottom
as the load climbs, inside a slowly turning Greek meander. At 100 the stage
floods with colour, the word settles to the floor, and a cast of statues
rises out of the dark in front of it, each on its own depth, lit by shafts
of light and drifting dust. The landing is live.

1. **Quarry.** The rule draws across the top with the eyebrow set into it;
   nav, brand and four-point stars come in; the outlined word fades up letter
   by letter and the meander engraves itself round it, then keeps turning.
   The outlined labels arrive at 20% and 50%; a Bodoni numeral and a ratio
   read-out (`0.4700 — LOADING`) count bottom right.
2. **Marble.** The letters fill from the bottom like rising stone, a line of
   light on the surface. A click, Enter, Space or **Skip** rushes it.
3. **Unveil.** A sheen sweeps the finished word, the meander turns to light
   and swells away, colour floods the stage from the centre, and the word
   drops to the floor on a heavy ease. The cast rises out of the dark one
   after another, the far ones behind the word and the near ones in front;
   the light comes up through them, then the tagline, the call to action,
   the asides and the bracketed tags.
4. **Landing.** The whole scene tilts and parts under the pointer at three
   depths, a spotlight follows it, the figure nearest the cursor leans in,
   and a letter hollows back to its outline under the hand. With `children`,
   a scroll, a swipe, the call to action or `holdMs` lifts the stage off the
   page beneath.

**The cast needs no cutouts.** Each figure is a photograph of a statue on a
black ground; its own luminance is turned into an SVG mask (a colour matrix,
then a linear transfer round `threshold`), so the ground is keyed out and the
lit marble stands free. In the carmine tone the figures are graded as a
two-ink print between `ground` and `highlight`. Flip `subject: "dark"` for
ink or watercolour on paper, where the figure is darker than its ground.

```tsx
import OldMastersPreloader from "@/components/ui/old-masters-preloader"

// The full opening, then the landing
<OldMastersPreloader />

// As a gate over your page, paced by a real loader
<OldMastersPreloader progress={loaded} onComplete={() => {}}>
  <YourPage />
</OldMastersPreloader>

// Your own cast, word, copy and tone
<OldMastersPreloader
  tone="noir"
  face="grotesk"
  scriptInitial
  wordmark="Erudition"
  figures={[
    { src: "https://images.unsplash.com/photo-…", x: 50, h: 112, depth: 0.8, threshold: 0.3 },
    { src: "https://images.unsplash.com/photo-…", x: 24, h: 70, depth: 1.25 },
    { src: "https://images.unsplash.com/photo-…", x: 80, h: 92, depth: 1.05, flip: true, phone: false },
  ]}
  tagline="We are the product of everything that came before us."
  eyebrow="Philosophia · Sapientia"
  brand="E."
  labels={["Philosophia", "Sapientia"]}
  nav={[{ label: "Essays", href: "/essays" }, { label: "Letters", href: "/letters" }]}
  cta={{ label: "Begin reading", href: "/essays" }}
/>

// Returning visitors: straight to the landing
<OldMastersPreloader skipIntro />
```

**React is the only import.** The faces (Bodoni Moda, Bebas Neue, Pinyon
Script, Jost) arrive through one injected Google Fonts `<link>`; pass
`fontHref={null}` to load nothing and fall back to the system stacks. The
meander, the stars, the tags and the barcode are drawn in the file; the
light and the dust are a 2D canvas; the grain is painted onto a canvas tile
once on mount. One `requestAnimationFrame` loop drives the load, the fill,
the read-outs, the parallax and the nearest figure.

## Photographs

Every image is a prop. The demos use these, all on Unsplash:

| Demo | Photographs |
|---|---|
| default | Nayani Teixeira — the Apollo Belvedere ([photo-1574359587026](https://images.unsplash.com/photo-1574359587026-daf1bfd26baa)); Şafak Atalay — a marble Hercules torso ([photo-1567522874215](https://images.unsplash.com/photo-1567522874215-d5e2f1bee83d)); Clarence E. Hsu — a standing figure with flowers ([photo-1662808141421](https://images.unsplash.com/photo-1662808141421-54240cbfd45f)); backdrop: Jack Hunter — the head of David ([photo-1601887389937](https://images.unsplash.com/photo-1601887389937-0b02c26b602c)) |
| noir | Content Pixie — a helmeted Minerva ([photo-1670813885725](https://images.unsplash.com/photo-1670813885725-e3c5391dcd31)); Filipe Nobre — a kneeling figure ([photo-1786708598101](https://images.unsplash.com/photo-1786708598101-080be8c5bd45)); ONUR KURT — a standing nude ([photo-1772617616150](https://images.unsplash.com/photo-1772617616150-06035fa7ff44)); backdrop: Europeana — a hermit by candlelight ([photo-1584727638096](https://images.unsplash.com/photo-1584727638096-042c45049ebe)) |
| vellum | National Gallery of Art — Perseus with the head of Medusa, a watercolour on paper ([photo-1767257147797](https://images.unsplash.com/photo-1767257147797-9628b6c3d934)) |

Pick statues shot against black, one figure each. Set `threshold` so the
ground disappears and nothing else; raise `softness` for a painted edge,
lower it for a cut one. `x` is where the figure stands across the stage,
`h` its height as a share of the stage, `depth` how near it is: nearer
figures move more under the pointer, rise later, and stand in front of the
word once `depth` reaches `wordDepth`.

## Props

| Prop | Default | Description |
|---|---|---|
| `progress` | — | Real progress, `0`–`100`. Leave it out for a simulated load. |
| `durationMs` | `4800` | Length of the simulated load. It surges and stalls like a real one. |
| `minLoadMs` | `2600` | The word fills at least this long, however fast the load. |
| `skippable` | `true` | A click, Enter, Space or **Skip** rushes the load to 100. |
| `skipIntro` | `false` | Open straight on the landing. |
| `figures` | three statues | `{ src, alt?, x, y?, h, depth?, flip?, subject?, threshold?, softness?, phone? }[]`. See above. |
| `backdrop` | David | A photograph behind everything, darkened and softened. `null` for none. |
| `wordDepth` | `0.9` | Figures at this depth or nearer stand in front of the word. |
| `exposure` | `1` | Brightness multiplier for the figures once they are up. |
| `duotone` | carmine only | Grade the figures as a two-ink print. |
| `rays` | `true` | Volumetric light from above. |
| `dust` | `true` | Dust drifting in the light. |
| `tilt` | `2.5` | How far the scene tilts under the pointer, in degrees. |
| `wordmark` | `"Arcadia"` | The large word, fitted to the width of the stage. |
| `face` | `"didone"` | `"didone"` (Bodoni Moda), `"condensed"` (Bebas Neue) or `"grotesk"` (Jost). |
| `scriptInitial` | `false` | Set the first letter in Pinyon Script, overlapping the rest. |
| `tagline` | — | Set in italic above the cast. |
| `eyebrow` | `"Portfolio · MMXXVI"` | Small line set into the top rule. |
| `brand` | `"A."` | The mark in the middle of the nav. |
| `nav` | Work, Studio, Journal, Contact | `{ label, href? }[]`, split left and right. Hidden under 640px. |
| `labels` | Ars longa, Vita brevis | Two outlined labels under the nav. |
| `asides` | two columns | `{ title, text }[]`, left and right. 1024px and up. |
| `annotations` | three | `{ x, y, label }[]`, bracketed tags over the scene, in percent of the stage. Hidden under 640px. |
| `plate` | `"Pl. I"` | Plate number beside the final ratio. |
| `loadingLabel` | `"Loading"` | Beside the counter. |
| `cta` | `{ label: "Enter" }` | With `href` it's a link. |
| `onEnter` | — | Fired when the call to action is pressed. |
| `onLoaded` | — | Fired once the landing is up. |
| `onComplete` | — | With children: fired once the stage has lifted. |
| `children` | — | The page behind the stage. Rendered from the first frame so it loads under the word. |
| `holdMs` | `0` | With children: lift on its own after this long. `0` waits for a scroll or the call to action. |
| `scrollToEnter` | `true` | With children: a wheel or a swipe lifts the stage. |
| `tone` | `"carmine"` | `"carmine"`, `"noir"` or `"vellum"`. |
| `palette` | from `tone` | Partial overrides, see below. |
| `fontHref` | Google Fonts URL | Stylesheet for the faces. `null` loads nothing. |
| `height` | `"100svh"` | Root height. Always a definite length, never `h-full`. |
| `className` | `""` | Extra root classes. |

### Palette

| Key | Carmine | Used for |
|---|---|---|
| `stage` | `#7a1511` | The stage once it has flooded. |
| `ground` | `#1a0706` | The dark before the flood; the deepest shadow of the print. |
| `text` | `#f6ead6` | Interface text, the numeral, the tagline. |
| `muted` | `#dba79d` | Eyebrow, read-outs, asides. |
| `accent` | `#f6ead6` | The meander, the stars, the script initial, aside titles. |
| `word` | `#f8eedc` | The wordmark. |
| `rule` | `#b2463c` | Hairlines and outlines. |
| `glow` | `#ffdcb0` | The light: shafts, the flash, the line on the rising marble. |
| `highlight` | `#f0b08f` | The lit marble of the print. |

## Notes

- The stage carries its own colours, so it reads the same on light and dark
  hosts. `tone="vellum"` is the one for a light page.
- On stages narrower than 640px the word stands in front of the cast, and
  figures marked `phone: false` are left out.
- The masks are SVG `<mask>` elements referenced from CSS `mask`, supported
  in current Chrome, Safari and Firefox.
- The default wordmark, copy and tags are invented. Swap in your own.
- `prefers-reduced-motion` stops the tilt, the parallax, the turning ring,
  the bob, the twinkle, the dust and the grain; the letters fade, the word
  jumps to the floor, the cast fades up in place, and the stage lifts in
  half the time.
- The counter is a `role="progressbar"` with its value; the landing is
  announced through a live region. During the load the root takes focus so
  Enter and Space can skip. Nav items without `href` render as buttons.
