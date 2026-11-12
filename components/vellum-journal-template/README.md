# Vellum Journal Template

A scroll-driven landing page for a small photography journal. The demo brand is
**Vellum** (invented). Three pages share one pinned stage, then the page scrolls on normally:

1. **Cover.** A light, condensed serif headline sits in a field of small photographs. On load each
   line flips upright out of a rippling reflection, the photographs pop in, and an orange pen line
   starts to draw. The photographs drift with the cursor at different depths and fly off faster
   than the headline as you scroll.
2. **About.** A black page rises over the cover. Its headline arrives letter by letter: each letter
   slides in from the right, out of a blur. A thin white line then draws itself across the page.
3. **Gallery.** A cream page is tossed onto the black one like a card. A corner shows first, then
   the page swings through a quarter turn and lands square. On it: a huge headline with an orange
   flower between its words, a hand-drawn underline, two short columns and a shelf of words that
   slides past.
4. **After the pin.** The feature photograph (whose top edge was already on the card) continues
   into a full-width plate with a vertical year, then a closing call to action and the wordmark.

Every photograph is painted on `<canvas>` at runtime: portraits, figures against the sky and a
still life, each with soft light, lens softness and grain. Nothing is fetched. They paint one per
frame after mount, so the intro never stutters, and are cached for the life of the page.

## Fonts

The display face is a subset of **Instrument Serif**, the about headline uses **Source Serif 4**
(a weight 400, optical size 60 instance) and the small labels use **DM Sans** (weight 500). All
three are SIL Open Font License 1.1 fonts, embedded as base64 woff2 inside the component. As the
licence asks of modified copies, the subsets are renamed `VgDisplay`, `VgText` and `VgSans`.
Together they add about 33 KB.

It needs nothing beyond React.

```tsx
import VellumJournalTemplate from "@/components/ui/vellum-journal-template"

<VellumJournalTemplate
  brand="Vellum"
  headline={["Notice The Light", "Wherever It Falls"]}
  aboutTitle={["A Room For The", "Patient Image Makers"]}
  galleryTitle={["Light", "On Paper"]}
  primaryAction={{ label: "Submit your work", href: "/submit" }}
/>
```

## Interactions

- **Context cursor.** With a mouse, the cursor is a small orange dot. Over the cover and anything
  you can click it grows into a badge with a turning ring of text that says what a click will do:
  *Scroll*, *View photo*, *Menu*, *Pick me*, *Next*, *Close*.
- **Magnetic buttons.** The menu button and the call-to-action pills lean toward the cursor, their
  labels a little further, and spring back when it leaves.
- **Lightbox.** Click any photograph on the cover to open it large. Click it (or press →/←) for the
  next one; Escape or a click outside closes it.
- **Menu.** Jumps to the cover, the about page, the gallery page (each lands on a held beat, never
  mid-motion), the feature plate or the closing section.
- **Easter egg.** Tap the orange flower in the gallery headline five times quickly. It is golden
  hour: the paper warms, the photographs turn amber and the flower goes gold. Five more taps bring
  daylight back.

The cursor, the parallax and the magnets only run under `(hover: hover) and (pointer: fine)` and
only for mouse pointers; on touch screens everything is a plain tap.

With `prefers-reduced-motion: reduce`, nothing pins, flips, swings or drifts. The three pages simply
stack as ordinary sections, each in its finished state, followed by the rest of the page.

## Props

| Prop | Default | |
|---|---|---|
| `height` | `"100svh"` | Height of the pinned stage. Every page is laid out against it. |
| `scrollLength` | `4.6` | Scroll travel, in stage heights, that the pinned story plays across. |
| `brand` | `"Vellum"` | Logo, side label, email and wordmark. |
| `headline` | two lines | Cover headline. |
| `tagline` | `"& frame it your own way"` | Small caption under it. |
| `aboutTitle`, `aboutBody` | two lines, two paragraphs | The black page. |
| `galleryTitle` | `["Light", "On Paper"]` | The flower sits between the two halves. |
| `galleryBody` | two paragraphs | Columns under the gallery headline. |
| `shelf` | five words | Words that slide past under it. |
| `issue`, `year` | | Note above the feature plate and its vertical year. |
| `primaryAction`, `secondaryAction` | | `{ label, href?, onClick? }`. Without either, a click shows a short note. |

## Performance

Scrolling reads the root's position once per scroll event. Section offsets are cached on mount and
on resize. The frame loop eases toward the scroll and the pointer and writes a few CSS custom
properties. It never reads layout, and it stops when the template is off screen.
