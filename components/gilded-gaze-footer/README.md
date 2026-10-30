# Gilded Gaze Footer

A closing poster for a site's last screen. The house line sits alone at the
top in heavy condensed type, with one letter set small. Below it, a Rajasthani
elder, rendered in an animated-film style, rises out of the bottom edge with
her chin resting on her fist. Her closed eyes ignite, and molten gold pours from them across her
temples into two baroque wings. The wings are sweeping bands of curling
acanthus scrolls, paisleys, rosettes, gold filigree and pearl drops, and they
run off both edges of the page. The link columns sit in the quiet corners under the wings.

## Storyboard

1. **Statement.** When the footer reaches the screen, "The / Art of /
   Promoting" rises line by line out of masks. The small "m" drops into its
   slot with a little overshoot, then the description fades up.
2. **Rise.** She rises out of the bottom edge: silver hair under a magenta
   bandhani dupatta with a zari border, a borla on her parting, a nath with
   its chain, silver jhumkas, layered beads and ivory bangles.
3. **Ignite.** Each eye pops a white-hot core, blooms a halo and throws a lens
   flare. A warm wash spreads over her face.
4. **Pour.** Four braided strands of molten gold stream from each eye, hot
   white at the eye and cooling to metal, to a jewelled clasp at the temple.
5. **Grow.** From the clasp, the ornament grows outward on a soft radial
   front. Six gold currents run out, each ending in a true volute at its own
   depth and sprouting acanthus scrolls on alternate sides. Paisleys,
   rosettes, leaves and buds pop in from the inside out on an enamel ground,
   and gold filigree curls fade in between them.
6. **Hang.** Pearl drops fall into place along the lower edge and sway.
7. **Live.** She breathes. The wings breathe, sparkles glint on the outer motifs, and the
   eyes flicker. As the footer scrolls in, the wings open out from her eyes.
   The pointer tilts the wings around her eyes, so the streams never come
   loose, and the eyes burn brighter as it nears them. **Click her eyes** (a real,
   focusable button) and rings burst out while a ripple of light runs through
   every motif. Links draw a gold underline, and the social buttons lift and
   fill.

The reveal plays once. It does not replay on resize or theme change.

**No dependencies, nothing fetched.** React is the only import. Every
ornament is SVG drawn in the file, so the wings recolour with a palette. She is
a 720 × 900 transparent WebP embedded as a data URI (about 100 KB), so she
survives installation too. Swap her for anyone through the `portrait` prop.

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
  portrait={{ src: "/brand/founder-cutout.png", alt: "…", eyes: [[0.41, 0.33], [0.6, 0.33]], cutout: true }}
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
| `portrait` | the embedded elder | `{ src, alt?, eyes?, cutout?, outline? }`. `eyes` are the two pupils as image fractions, left then right. Set `cutout` for an image with a transparent background: it is drawn as is, with its side edges feathered. Otherwise pass `outline`, a cut-out polygon in image fractions, or the image gets a soft oval vignette. |
| `preset` | `"gold"` | `gold` (gold, crimson, teal and lapis) or `moon` (silver, indigo and violet). |
| `palette` | — | Overrides merged over the preset: `metal` (7 stops), `edge`, `shadow`, `ground`, `enamel`, `enamelInk`, `pearl`, `pearlEdge`, `core`, `coreOuter`, `halo`, `flare`, `wash`, `spark`, `stream`, `accent`, `accentInk` |
| `seed` | `7` | Which arrangement of scrolls and motifs grows. |
| `sceneHeight` | `clamp(500px, 46vw, 720px)` | A definite length. Never a percentage. |
| `displayFont` / `fontFamily` | Anton, then Impact / Inter, then system | Faces come from the host page. |
| `fontHref` | — | Optional stylesheet injected once, e.g. Google Fonts for Anton (the demos pass one). |
| `backToTop` | `true` | Shows the "Back to top" button. |
| `parallax` | `true` | Pointer tilt of the wings and the eye glow that follows the pointer. |

## Using your own portrait

A transparent cut-out works best: pass it with `cutout: true`. Otherwise pick a frontal portrait with the face in the upper third. Open it, read the
two pupils as fractions of the image width and height, and pass them as
`eyes`. For the cut-out, trace the head and shoulders as a polygon of
fractions and pass it as `outline`. Points may run slightly past 0 or 1 where
the body leaves the frame. With a crop URL (imgix `fit=crop`), measure on the
cropped image.

## Notes

- **The elder.** An animation-style render generated for this component and
  cut out on transparency. The wings sit on her temples and her eyes carry the
  glow, so a new portrait only needs its eye positions.
- **Layout.** At 1280px and up, the columns sit in the corners under the
  wings. Below that, they flow under the scene in four columns, then two. On
  phones she fills the width. At every size the wings run off both sides.
- **Performance.** Each wing is one SVG stamped from four shared motif
  symbols with `<use>`. The wings open through a CSS radial mask on an
  animated, registered length (`@property`). Browsers without `@property`
  show the wings at the midpoint of the reveal instead of growing them. After
  the reveal the big layers never repaint. Everything that keeps moving lives
  in its own small layer: the swaying drops, the sparkles and the eyes. Breathing is a composited transform. The scroll
  listener only runs while the scene is on screen.
- **Accessibility.** The drawn layers are `aria-hidden`, and the portrait's
  `alt` is read as text. The link columns are labelled navs. Every link and
  button has a visible focus ring. The eyes are a named `<button>`, so
  keyboard users can light them too.
- **Reduced motion.** Everything appears at once, finished. Breathing,
  sparkles, sway, parallax and the surge are off.
- **21st covers.** The component fetches nothing, but the demos load Anton
  through `fontHref`, which the capture sandbox blocks. Drop `fontHref` for a
  server-side cover (it falls back to Impact), or supply your own `--preview`
  (see `media/gilded-gaze-footer/cover.png`).
