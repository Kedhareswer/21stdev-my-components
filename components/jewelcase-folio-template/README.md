# Jewelcase Folio Template

A long scrapbook-style portfolio for Kedhareswer, done in a Y2K print look. The hero is a pink portrait CD in a clear jewel case under a cut-out "PORTFOLIO" title, with a pink ring and a star doodle. Stickers slap onto the case. The work follows in alternating ink and paper bands joined by torn edges. Headings are ransom-note letters cut from five faces, and every label is a strip of grey tape.

```tsx
import JewelcaseFolioTemplate from "@/components/ui/jewelcase-folio-template"

export default function Page() {
  return <JewelcaseFolioTemplate />
}
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | Minimum height of the hero's first screen. Use a definite length, never a percentage. |
| `email` | `kedhareswer.12110626@gmail.com` | Every contact link is a `mailto:` to this address. |
| `assetBase` | component site | Where the 47 `.webp` pictures live. Point it at your own copy to self-host them. |
| `className`, `style` | | Passed to the root. |

## Sections

1. **Hero:** "Kedhar's PORTFOLIO 2026" over the jewel-case CD. Lips, smiley, leopard-star and heart stickers sit on the case with "web design", "component design" and "template projects" labels. A pink "About the artist" tab crosses the torn edge.
2. **About:** introduction, experience (Client 1, Client 2), education placeholders and four skill tiles.
3. **Graphic posters:** ten made-up Y2K posters, edge to edge, five across.
4. **Pubmats and social:** two event posters, then five taped client boards: an announcement board with a phone feed, a holiday campaign, a menswear moodboard, a florist's Photos panel and a skincare set with a story phone.
5. **Mall posters:** two taped cobalt posters.
6. **Magazine:** four full-bleed shots of covers, a folder and two spreads.
7. **Branding projects:** three identities, a streetwear label, a florist and a tea bar, each with a logo, type specimen, palette and mock-ups.
8. **Packaging design:** a pizza box and juice cartons with hand-written notes.
9. **Thank you:** ransom "THANK YOU" with contact links.

## Motion

- On load, the title letters drop in one after another and the stickers slap down.
- Sections rise in as they enter the view.
- Hover lifts posters, cards and skill tiles, and grows the stickers.
- Under `prefers-reduced-motion` everything is shown at once with no animation.

## Notes

- Self-contained: React only. Six fonts are embedded as small subsets: a Poppins-style sans, Archivo Black, Anton, Abril Fatface, Permanent Marker and Pacifico. Subsets cover only the glyphs used, so long custom headings may fall back for rare characters.
- Ransom letters are seeded from the word itself, so server and client render the same letters.
- Every picture is an original ChatGPT image. All copy is placeholder work for Kedhareswer.
