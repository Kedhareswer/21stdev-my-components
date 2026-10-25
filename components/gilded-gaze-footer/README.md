# Gilded Gaze Footer

A closing poster for a site's last screen. The house line sits alone at the
top in heavy condensed type, with one letter set small. Below it, an
illustrated Rajasthani elder rises out of the bottom edge, chin resting on her
fist. Her closed eyes ignite, and molten gold pours from them across her
temples into two baroque wings. The wings are curling acanthus
scrolls, paisleys, rosettes and pearl drops, and they grow out to the edges of
the page. The link columns sit in the quiet corners under the wings.

## Storyboard

1. **Statement.** When the footer reaches the screen, "The / Art of /
   Promoting" rises line by line out of masks. The small "m" drops into its
   slot with a little overshoot, then the description fades up.
2. **Rise.** She rises out of the bottom edge while the gold zari border of
   her dupatta draws itself in around her face. She is drawn in the same
   enamel-and-gold language as the wings: a bandhani-dotted dupatta that
   crosses her chest, a borla on her parting, a nath with its chain into her
   hair, jhumkas, a hansli collar, and ivory chooda up her forearm.
3. **Ignite.** Each eye pops a white-hot core, blooms a halo and throws a lens
   flare. A warm wash spreads over her face.
4. **Pour.** Four braided strands of molten gold stream from each eye, hot
   white at the eye and cooling to metal, to a jewelled clasp at the temple.
5. **Grow.** From the clasp, the ornament grows outward on a soft radial
   front. Five gold currents run out, each ending in a true volute and
   sprouting acanthus scrolls on alternate sides. Paisleys, rosettes, leaves
   and buds pop in from the inside out on an enamel ground.
6. **Hang.** Pearl drops fall into place along the lower edge and sway.
7. **Live.** She breathes, her jhumkas swing, and the folds of her dupatta
   shimmer. The wings breathe, sparkles glint on the outer motifs, and the
   eyes flicker. As the footer scrolls in, the wings open out from her eyes.
   The pointer tilts the wings around her eyes, so the streams never come
   loose, and the eyes burn brighter as it nears them. **Click her eyes** (a real,
   focusable button) and rings burst out while a ripple of light runs through
   every motif. Links draw a gold underline, and the social buttons lift and
   fill.

The reveal plays once. It does not replay on resize or theme change.

**No dependencies, nothing fetched.** React is the only import. She and every
ornament are SVG drawn in the file, so the whole piece recolours with a
palette and survives installation. A photo can stand in for her through the
optional `portrait` prop.

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
  palette={{ figure: { veil: ["#4a56c8", "#27308f", "#121755"] } }}
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
| `portrait` | — (the illustration) | Optional photo in her place: `{ src, alt?, eyes?, outline? }`. `eyes` are the two pupils as image fractions, left then right. `outline` is an optional cut-out polygon in image fractions. Without it, the image gets a soft oval vignette. |
| `figureAlt` | a description of her | What a screen reader hears for the illustration. |
| `preset` | `"gold"` | `gold` (gold, crimson, teal and lapis) or `moon` (silver, indigo and violet). |
| `palette` | — | Overrides merged over the preset: `metal` (7 stops), `edge`, `shadow`, `ground`, `enamel`, `enamelInk`, `pearl`, `pearlEdge`, `core`, `coreOuter`, `halo`, `flare`, `wash`, `spark`, `stream`, `accent`, `accentInk`, and `figure` for her (merged separately): `skin`, `line`, `blush`, `lips`, `bindi`, `hair`, `veil`, `veilDot`, `blouse`, `blouseDot`, `flower`, `ivory`, `bangle`, `bead`. |
| `seed` | `7` | Which arrangement of scrolls and motifs grows. |
| `sceneHeight` | `clamp(500px, 46vw, 720px)` | A definite length. Never a percentage. |
| `displayFont` / `fontFamily` | Anton, then Impact / Inter, then system | Faces come from the host page. |
| `fontHref` | — | Optional stylesheet injected once, e.g. Google Fonts for Anton (the demos pass one). |
| `backToTop` | `true` | Shows the "Back to top" button. |
| `parallax` | `true` | Pointer tilt of the wings and the eye glow that follows the pointer. |

## Using a photo instead

Pick a frontal portrait with the face in the upper third. Open it, read the
two pupils as fractions of the image width and height, and pass them as
`eyes`. For the cut-out, trace the head and shoulders as a polygon of
fractions and pass it as `outline`. Points may run slightly past 0 or 1 where
the body leaves the frame. With a crop URL (imgix `fit=crop`), measure on the
cropped image.

## Notes

- **The illustration.** Drawn on a 600 × 750 artboard from point lists run
  through one smooth-curve helper, cel-shaded with flat shadow shapes, and
  recoloured entirely by `palette.figure`. The moon preset dresses her in
  indigo and silver.
- **Layout.** At 1280px and up, the columns sit in the corners under the
  wings. Below that, they flow under the scene in four columns, then two. On
  phones the portrait fills the width and the wings bleed off both sides.
- **Performance.** Each wing is one SVG stamped from four shared motif
  symbols with `<use>`. The wings open through a CSS radial mask on an
  animated, registered length (`@property`). Browsers without `@property`
  show the wings at the midpoint of the reveal instead of growing them. After
  load only small parts move: breath, earrings, cloth, drops and sparkles. The
  scroll listener only runs while the scene is on screen.
- **Accessibility.** The drawn layers are `aria-hidden`, and `figureAlt` (or
  a photo's `alt`) is read as text. The link columns are labelled navs. Every link and
  button has a visible focus ring. The eyes are a named `<button>`, so
  keyboard users can light them too.
- **Reduced motion.** Everything appears at once, finished. Breathing,
  swinging, sparkles, sway, parallax and the surge are off.
- **21st covers.** The component fetches nothing, but the demos load Anton
  through `fontHref`, which the capture sandbox blocks. Drop `fontHref` for a
  server-side cover (it falls back to Impact), or supply your own `--preview`
  (see `media/gilded-gaze-footer/cover.png`).
