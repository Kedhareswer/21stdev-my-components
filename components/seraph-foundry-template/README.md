# Seraph Foundry Template

A launch page for a display typeface, printed in two riso inks: hot-pink line
engravings and navy type on grey paper. It is a type specimen a foundry would
actually ship: the face set big in the hero, the face in use on a record sleeve,
a live tester, a glyph inspector, licensing with a running total, and a closing
"Thank You" plate.

```
section     what happens
----------  ----------------------------------------------------------------------------
header      sticky, tucks away on scroll down, pink progress hairline, Buy CTA
hero        band wipes in, crest engraving prints top-down, letters rise thin → regular,
            swashes draw on; scroll thickens the face; letters swell under the pointer
in use      sticky stage: sleeve settles, the record slides out and turns with scroll,
            giant vertical word drifts; pick a pressing, play/pause, drag to scratch
tester      editable specimen: size, weight, tracking, case, ink, sample phrases
glyphs      count-up badge, tabbed character sets, inspector with real cap/x/baseline
licensing   Desktop / Web / App cards, seat tiers, bundle discount, onBuy
closing     pink square and angel rise into place, "Thank You" gathers, swashes draw
```

## How it works

- **Engravings.** The photos are real (Unsplash) and are re-cut at runtime into
  line engravings on a canvas: a tonal line pass whose lines bend and thicken with
  the shadows, a cross-hatch for the darkest tones, an elliptical fade into the
  paper, then riso speckle where the ink "didn't take". If an image is CORS-blocked
  or fails, or `engrave={false}`, the slot shows a flat duotone of the same photo.
- **Swashes** are broad-nib strokes computed from a centreline (thick where the
  pen travels across the nib, hairline along it, tapered ends, dot terminals), so
  they stay calligraphic at any size. They draw on through an SVG mask.
- **The variable face.** Weight is a sum of three CSS variables per letter: the
  scroll morph, the entrance and the pointer lens. That keeps the three effects
  from fighting over one property.
- **Motion** is GSAP + ScrollTrigger inside one `gsap.context` (reverted on
  unmount) and `gsap.matchMedia`. The sleeve stage is CSS `position: sticky`, not
  a pin spacer, so React's DOM is never rewritten.

## Dependencies

- **`gsap`** (with its bundled `ScrollTrigger`). It is declared in the root `package.json`.

## Usage

```tsx
import SeraphFoundryTemplate from "@/components/ui/seraph-foundry-template"

<SeraphFoundryTemplate
  preset="riso"                       // "riso" | "verdigris" | "ember"
  typeface={{ name: "Seraphine", foundry: "Ashgrove Type Co.", glyphs: 963 }}
  hero={{ lines: ["Gr[an]der", "the", "He[av]en"] }}   // [brackets] = highlight ink
  onBuy={(order) => checkout(order)}  // { licenses, seats, total, currency }
/>
```

| Prop | Default | |
|---|---|---|
| `height` | `"100svh"` | Height of one stage (hero, sleeve, closing). Must be a definite length. |
| `preset` | `"riso"` | Ink palette. |
| `colors` | — | Override `paper`, `ink`, `accent`, `tint`, `blue`. |
| `theme` | `"auto"` | `"auto"` follows a `.dark` ancestor. |
| `typeface` | Seraphine | `name`, `foundry`, `family`, `labelFamily`, `glyphs`, `weights`. |
| `fontHref` | Google Fonts (Grenze Gotisch + Poppins) | `null` loads nothing. Point it at your own face. |
| `hero` | — | `kicker`, `sub`, `lines`, `credit`, `note`. |
| `pressings` | 3 records | `{ title, kicker, label }` for the sleeve. |
| `samples` | 4 phrases | Tester phrases; the first is set on load. |
| `licenses` | Desktop / Web / App | `{ id, name, blurb, price, unit }`. |
| `currency` | `"$"` | |
| `images` | Unsplash | `crest`, `sleeve`, `ornament`, `angel`: a URL or `{ src, focus, levels, alt }`. |
| `engrave` | `true` | Re-cut photos as engravings. |
| `closing` | — | `kicker`, `title`, `vertical`. |
| `onBuy` | — | Called with the order. |

Licensing: two licences save 10%, three save 20%; seat tiers 1 / 3 / 5 / 10 / 25
multiply by 1 / 2 / 3 / 5 / 9.

## Accessibility

- Headline and sleeve title carry the full text as `aria-label`; letter spans are hidden.
- Every control is a real button / radio / tab / range with visible focus.
- `prefers-reduced-motion` skips all GSAP choreography (the page renders finished),
  stops the twinkle and the record's spin.

## Photo credits (Unsplash)

- Crest: `photo-1561084763-cf94ae5d59ac` (winged skull-faced statue)
- Sleeve: `photo-1565854713475-6e297773a53f` (Trevi Fountain)
- Ornament: `photo-1565123005357-a99c149b7dbe` (baroque fountain statues)
- Angel: `photo-1758651794755-465d25631649` (marble angel)
- Verdigris demo crest: `photo-1573823252145-4df9430b057a` (bronze angel in fog)

## Notes for publishing

- The default font and photos come from Google Fonts and Unsplash. 21st's capture
  sandbox blocks external origins, so supply `media/seraph-foundry-template/default.png`
  as `--preview`.
- Reference image: `media/seraph-foundry-template/reference.webp` (local only).
