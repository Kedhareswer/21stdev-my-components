# Synapse Folio Template

A blueprint-blue, one-page portfolio for Kedhareswer that builds itself in front of you.

When the page loads, four agent cursors (Scout, Weaver, Pilot and Relay) assemble the hero:

- **Scout** types the statement word by word with an I-beam. The inline objects' slots show as dashed outlines while that happens.
- **The others** pick up each object, introduce it with a selection frame and a file label (`hand.webp`, `lab.webp`, `spark.svg`…), carry it into its slot and paste it with a `⌘V` chip.
- Bigger pieces are drawn in instead: the grid paper and the *Essentially* card are marqueed with a live W × H badge, the globe grows out of its centre, and the pointer wire is drawn with a pen.

The crew then leaves by the nearest edge, and the page left behind is exactly the server render.

After that the page stays live:

- Drag the hand, note, photo, prosthesis and bust around the board. Double-click one to put it back.
- The board objects sway with the pointer at different depths.
- The grid lights the cell under the pointer.
- The eye's pupil follows the pointer.
- The globe turns faster towards the side the pointer is on.
- The pattern toggle swaps the board between grid and dot paper.
- Work cards, client rows and the contact block reveal as they scroll in.
- The nav button skips the build while it runs and replays it afterwards.

```tsx
import SynapseFolioTemplate from "@/components/ui/synapse-folio-template"

export default function Page() {
  return <SynapseFolioTemplate />
}
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | Minimum height of the hero. Use a definite length, never a percentage. |
| `brand` | `"KEDHAR"` | Wordmark in the nav. |
| `lead`, `body` | the two statement paragraphs | Arrays of tokens: a string of words, `{ box: "…" }` for the outlined phrase, or `{ slot: "star" \| "links" \| "eye" \| "coral" }` for an inline object. |
| `note`, `noteTag` | about his practice | The pinned note card on the board. |
| `essentially` | one-paragraph summary | The *Essentially* card. |
| `projects` | Project 01–03 | `{ title, kind, year, blurb, image }[]`. `image` is a file name under `assetBase`. |
| `clients` | Client 1–3 | `{ name, work, year }[]`. |
| `closing`, `email` | `kedhareswer.12110626@gmail.com` | The contact block. Project cards and the address are `mailto:` links. |
| `city`, `timeZone` | `"HYD"`, `"Asia/Kolkata"` | The live local-time readout in the nav. |
| `agents` | Scout, Weaver, Pilot, Relay | `{ name, color }[]`. Phones use the first three. |
| `playIntro` | `true` | Play the build on load. The nav button replays it either way. |
| `assetBase` | component site | Where the `.webp` pictures live. Point it at your own copy to self-host them. |
| `className`, `style` | | Passed to the root. |

## Notes

- **Dependencies:** `gsap`, which drives the build on one paused timeline, plus React. Fonts are embedded as small subsets: Source Serif 4 Light and JetBrains Mono, both under the OFL.
- **Pictures:** the stippled hand, bust, prosthesis and coral are single-ink cut-outs, drawn through CSS masks so they take the theme's ink in light and dark mode. The four duotone photos are plain WebP. All are ChatGPT-generated.
- **Reduced motion:** with `prefers-reduced-motion: reduce` there is no build, no sway and no scroll reveal; you get the finished page.
- **Touch:** objects are draggable only with a fine pointer, so touch scrolling is never captured.
- **Dark mode:** the palette follows a `.dark` class on an ancestor.
