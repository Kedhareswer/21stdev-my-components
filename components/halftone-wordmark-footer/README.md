# Halftone Wordmark Footer

A site footer whose wordmark is set enormous and cropped by the bottom edge,
printed as a field of halftone dots. Each dot is sized by how much of the letter
covers its cell, so the type keeps its edges at any width. Above it sit your
studio line, tracked link columns and a back-to-top link, over a fine print
grain.

## Interaction

- **Move** across the word and the dots part around the pointer on springs,
  warming in colour as they are pushed off their place.
- **Click** and a shock ring runs out through the letters.
- **Leave it** and every dot settles home. The canvas stops drawing once
  nothing moves, and sleeps off-screen.

**No dependencies.** React is the only import. A 2D canvas for the dots and
the grain, real anchors for the links, nothing fetched.

```tsx
import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer"

<HalftoneWordmarkFooter />

<HalftoneWordmarkFooter
  preset="paper"
  wordmark="tessera"
  label="Tessera Type Foundry"
  meta="©2026 · Basel"
  columns={[
    { title: "Fonts", links: [{ label: "Catalogue", href: "/fonts" }, { label: "Trials", href: "/trials" }] },
    { title: "Follow", links: [{ label: "Instagram", href: "https://instagram.com/…" }] },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `wordmark` | `"halden"` | The giant word. Lowercase reads best. |
| `label` / `meta` | `"Halden Studio"` / `"©2026 · Oslo / Lisbon"` | Top-left lines. |
| `columns` | Work · Studio · Contact | `{ title, links: { label, href? }[] }[]` |
| `backToTop` | `true` | Scrolls the window to the top. |
| `preset` | `"night"` | `night` · `paper` · `ember` · `cobalt` |
| `palette` | — | `{ background, ink, warm }` overrides. `warm` is the colour a pushed dot turns. |
| `dotGap` | `6` | Distance between dot centres in CSS px. Smaller is a finer screen. |
| `radius` | `80` | How far the pointer pushes, in CSS px. |
| `crop` | `0.2` | How much of the word's cap height hangs below the edge, 0–0.6. |
| `grain` | `0.5` | Print grain, 0–1. |
| `interactive` | `true` | Pointer and click response. |
| `fontFamily` / `fontWeight` | Inter Tight → Helvetica / `800` | Face for the wordmark. Heavy grotesks print best. |
| `monoFamily` | JetBrains Mono → system | Face for the small type. |
| `height` | `560px` | A definite length. |

## Notes

- **Late web fonts.** If your wordmark font arrives after first paint, the word
  is re-set in the real face as soon as it lands.
- **Accessibility.** The canvas is hidden from screen readers. The wordmark is
  also in the page as text, and every link is a real, focusable anchor.
- **Reduced motion.** The dots stay still and the click ring is off.
