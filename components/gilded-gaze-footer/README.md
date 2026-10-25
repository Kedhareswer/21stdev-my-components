# Gilded Gaze Footer

A closing poster for a site's last screen. The house line sits alone at the
top in heavy condensed type, with one letter set small. Below it, a portrait
rises out of the bottom edge, her eyes ignite, and molten gold pours from them
across her temples into two baroque wings. The wings are curling acanthus
scrolls, paisleys, rosettes and pearl drops, and they grow out to the edges of
the page. The link columns sit in the quiet corners under the wings.

## Storyboard

1. **Statement.** When the footer reaches the screen, "The / Art of /
   Promoting" rises line by line out of masks. The small "m" drops into its
   slot with a little overshoot, then the description fades up.
2. **Preload.** The scene stays dormant until the portrait has loaded. Its
   real size is read so the eyes are placed exactly on the image.
3. **Rise.** The portrait rises out of the bottom edge, cut out along her veil.
4. **Ignite.** Each eye pops a white-hot core, blooms a halo and throws a lens
   flare. A warm wash spreads over her face.
5. **Pour.** Four braided strands of molten gold stream from each eye, hot
   white at the eye and cooling to metal, to a jewelled clasp at the temple.
6. **Grow.** From the clasp, the ornament grows outward on a soft radial
   front. Five gold currents run out, each ending in a true volute and
   sprouting acanthus scrolls on alternate sides. Paisleys, rosettes, leaves
   and buds pop in from the inside out on an enamel ground.
7. **Hang.** Pearl drops fall into place along the lower edge and sway.
8. **Live.** The wings breathe, sparkles glint on the outer motifs, and the
   eyes flicker. As the footer scrolls in, the wings spread outward. The
   pointer leans the wings toward it and the portrait away from it. The eyes
   burn brighter as the pointer nears them. **Click her eyes** (a real,
   focusable button) and rings burst out while a ripple of light runs through
   every motif. Links draw a gold underline, and the social buttons lift and
   fill.

The reveal plays once. It does not replay on resize or theme change.

**No dependencies.** React is the only import. Every ornament is SVG drawn in
the file from a seed, so it recolours with a palette and survives
installation. The only thing fetched is the portrait, which is a prop.

```tsx
import GildedGazeFooter from "@/components/ui/gilded-gaze-footer"

<GildedGazeFooter />

<GildedGazeFooter
  preset="moon"
  kicker="A"
  title="House of"
  subtitle="Moonlight"
  quirk="o"
  brand="Chandra Atelier"
  portrait={{
    src: "https://images.unsplash.com/photo-…",
    alt: "…",
    eyes: [[0.381, 0.414], [0.59, 0.414]],
    outline: [[0.445, 0.106], [0.595, 0.125] /* … */],
  }}
  columns={[{ title: "Atelier", links: [{ label: "Collections", href: "/collections" }] }]}
  socials={[{ icon: "instagram", href: "https://instagram.com/…" }]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `kicker` / `title` / `subtitle` | `"The"` / `"Art of"` / `"Promoting"` | The three lines of the house line. |
| `quirk` | `"m"` | The first match in the subtitle is set at half size. `""` for none. |
| `description` | promoting blurb | The small paragraph under the title. |
| `brand` / `brandHref` | `"Gilt & Gaze"` / `"#"` | Bottom bar. |
| `copyright` | `© <year> <brand>. All rights reserved.` | |
| `columns` | Studio, Company, Promote, Legal | `{ title, links: { label, href? }[] }[]`. The first half goes left, the rest right. |
| `socials` | Instagram, X, LinkedIn, YouTube | `{ icon: "instagram" \| "x" \| "linkedin" \| "youtube" \| "github" \| "facebook" \| "mail", href?, label? }[]` |
| `portrait` | Rajasthani elder, Unsplash | `{ src, alt?, eyes?, outline? }`. `eyes` are the two pupils as image fractions, left then right. `outline` is an optional cut-out polygon in image fractions. Without it, the image gets a soft oval vignette. |
| `preset` | `"gold"` | `gold` (gold, crimson, teal and lapis) or `moon` (silver, indigo and violet). |
| `palette` | — | Overrides merged over the preset: `metal` (7 stops), `edge`, `shadow`, `ground`, `enamel`, `enamelInk`, `pearl`, `pearlEdge`, `core`, `coreOuter`, `halo`, `flare`, `wash`, `spark`, `stream`, `accent`, `accentInk`. |
| `seed` | `7` | Which arrangement of scrolls and motifs grows. |
| `sceneHeight` | `clamp(500px, 46vw, 720px)` | A definite length. Never a percentage. |
| `displayFont` / `fontFamily` | Anton, then Impact / Inter, then system | Faces come from the host page. |
| `fontHref` | — | Optional stylesheet injected once, e.g. Google Fonts for Anton (the demos pass one). |
| `backToTop` | `true` | Shows the "Back to top" button. |
| `parallax` | `true` | Pointer lean and the eye glow that follows the pointer. |

## Placing a new portrait

Pick a frontal portrait with the face in the upper third. Open it, read the
two pupils as fractions of the image width and height, and pass them as
`eyes`. For the cut-out, trace the head and shoulders as a polygon of
fractions and pass it as `outline`. Points may run slightly past 0 or 1 where
the body leaves the frame. With a crop URL (imgix `fit=crop`), measure on the
cropped image.

## Notes

- **Default photo.** Himanshu Kiradiya, Ajmer, Rajasthan, on
  [Unsplash](https://unsplash.com/photos/an-old-woman-wearing-a-green-and-pink-sari-3Z7W5tLpYws)
  (Unsplash License). The moon demo uses Mehdi Raad's portrait,
  [Unsplash](https://unsplash.com/photos/elderly-woman-in-blue-headscarf-smiling-with-hand-on-chest-bdq86ixSt_M).
- **Layout.** At 1280px and up, the columns sit in the corners under the
  wings. Below that, they flow under the scene in four columns, then two. On
  phones the portrait fills the width and the wings bleed off both sides.
- **Performance.** Each wing is one SVG stamped from four shared motif
  symbols with `<use>`. Only the reveal mask, the drops and the sparkles
  animate after load, and the scroll listener only runs while the scene is on
  screen.
- **Accessibility.** The drawn layers are `aria-hidden`, and the portrait's
  `alt` is read as text. The link columns are labelled navs. Every link and
  button has a visible focus ring. The eyes are a named `<button>`, so
  keyboard users can light them too.
- **Reduced motion.** Everything appears at once, finished. Breathing,
  sparkles, sway, parallax and the surge are off.
- **21st covers.** The capture sandbox blocks external origins, so the
  Unsplash portrait and the Anton stylesheet stop server-side covers. Supply
  your own `--preview` (see `media/gilded-gaze-footer/cover.png`).
