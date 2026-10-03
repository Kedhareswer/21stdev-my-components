# Beam Wordmark Footer

A midnight-navy closing section with a slow diagonal shaft of light running
across it, and the brand set as a giant wordmark cropped by the bottom edge.

The top row has a copyright label over a hairline, glassy square social
buttons, and a two-line credit, then link columns with accent labels over
hairlines. Under them the wordmark is fitted to the column width, one span per
letter. Each letter paints the same beam and pointer glow as the backdrop,
lined up to the section's own coordinates, so the light reads as one shaft
that passes behind the columns and through the letters.

**No dependencies.** React is the only import. No images or fonts are loaded.
The icons are inline SVG, and the wordmark is live text set in whatever sans
the page already has.

## Interaction

- **Beam**: it sways slowly on its own. Move the pointer across the footer and
  it leans toward it, then eases back to its sway when the pointer leaves. The
  top hairline brightens where the beam crosses it.
- **Pointer glow**: a soft accent glow follows the pointer and lights every
  letter it passes.
- **Letters**: they lift and brighten on hover. **Click** one and it hops.
- **Socials**: the glass square lifts and fills with accent, and a label drops
  down under it on hover or keyboard focus.
- **Links**: an accent tick draws in, the label slides right, and an arrow
  follows it. Keyboard focus gets the same, plus an underline.
- **Reveal**: the first time the footer is on screen, the hairlines draw in,
  the links fade up in sequence, and the letters rise out of the bottom edge
  one by one.

## Usage

```tsx
import BeamWordmarkFooter from "@/components/ui/beam-wordmark-footer"

<BeamWordmarkFooter />
```

Give it a parent with a width and nothing else (see `demo.tsx`). Its height
comes from its content.

Re-brand, re-word and re-ink it through props (see `demo-ember.tsx`):

```tsx
<BeamWordmarkFooter
  brand="Saffron"
  company="Saffron Studio"
  background="#0b0503" ink="#f6eee6" muted="#9d8d80"
  accent="#ff7a2f" wordTop="#9a3712" wordFoot="#170703"
  socials={[{ label: "GitHub", href: "https://github.com/you", icon: "github" }]}
  credits={[{ lead: "Roasted in ", label: "Lisbon", tail: " since 2019" }]}
  columns={[{ title: "Menu", links: [{ label: "Blends", href: "/blends" }] }]}
  onLinkClick={(label, href) => track(label)}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `brand` | `"Zephyr"` | Used in the wordmark, the copyright and the default credit. |
| `wordmark` | `brand` | What the giant wordmark spells. A short word is capped at 42% of the width in height, so it never towers. |
| `company` / `year` | `"<brand> LLC"` / current year | Copyright line. |
| `socials` | X, LinkedIn, YouTube, Instagram | `{ label, href?, icon }[]`. `icon` is `"x" \| "linkedin" \| "youtube" \| "instagram" \| "github" \| "dribbble"` or your own 24×24 SVG children. |
| `credits` | two lines | `{ lead?, label, href?, tail? }[]`. `label` is bright, and a link when it has an `href`. |
| `columns` | Our Product, Company | `{ title, links: { label, href? }[] }[]`. Any number; two fit the reference layout. |
| `onLinkClick` | none | `(label, href)` for every social, credit and column link. |
| `cut` | `0.14` | Where the bottom edge cuts the wordmark, in em below its baseline. `0` sits on the baseline. Negative values cut into the letters. |
| `background` / `ink` / `muted` | `#02040b` / `#eef1f8` / `#8a91a6` | Hex. Page, bright text, credit text. |
| `accent` | `#3d6bff` | Hex. Labels, hairlines, beam, glow, tooltips. |
| `wordTop` / `wordFoot` | `#1d3fa3` / `#060b22` | The wordmark's resting fill, from cap height down to its foot. |
| `fontSans` | system sans stack | Nothing is loaded. Pass a family your page already loads; the wordmark re-fits once `document.fonts` is ready. |
| `wordWeight` | `500` | Wordmark weight. |
| `animate` | `true` | `false` holds the beam still. The pointer glow still follows. |
| `className` | `""` | Appended to the root `<footer>`. |

## Notes

- **Intrinsic height.** There is no `height` prop and no percentage height. The
  wordmark measures its own width and sets its own pixel height.
- **The crop follows the font.** The wordmark's box ends `cut` em below the
  baseline, read from the real font's metrics on a canvas. The crop looks the
  same in any typeface.
- Sizes are in container units (`cqw`) off the component's own width, so it
  scales with its column rather than the viewport. Under 760px of width the
  brand block takes the full row and the link columns sit side by side
  beneath it.
- The CSS is one scoped `<style>` block, with every rule under `.bwf`. Element
  resets go through `:where(.bwf)`, so they never out-rank the component's own
  classes or yours.
- The footer paints its own palette and ignores the page's light/dark theme.
  Colour props take hex, because the beam and glow are mixed from them with
  alpha.
- `href: "#"` and missing hrefs never touch the page's URL hash. External
  `http(s)` links open in a new tab.
- Off screen, the beam stops.
- `prefers-reduced-motion`: no sway, reveal, hop or hover transitions.
  Everything shows at once. The pointer glow still works, because it only
  moves when you do.

## Credit

Layout and palette after a reference shot of a dark agency footer template.
The beam, the letter lighting, the icons, the interactions and the code are
original.
