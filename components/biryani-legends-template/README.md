# Biryani Legends Template

A printed coffee-table book of biryani legends, as a whole page. Each legend
gets one chapter, laid out as an open two-page spread on cream paper:
- the name in saffron serif, with a handwritten title written over it
- justified book columns and an italic closing note
- an engraving that fades softly into the paper
- a pot of biryani resting on the page under its own shadow, with steam rising

Every spread is composed differently: the engraving runs across the bottom,
or sits top right, or top left, and the text and the pot move around it.

Legends are data. Add one to `legends` and the book grows a spread, a
contents line and a chapter tab.

**Requires `gsap`** (with ScrollTrigger), declared in the root `package.json`.

## Storyboard

1. **Load.** A closed book bound in madder cloth sits on the desk. It has a
   gold-foil title with a moving sheen, a spice wreath and a thin progress
   line ("Simmering on dum"). When the type has loaded, the cover swings open
   on its spine in 3D and the book slides to the centre.
2. **Contents.** The first spread holds the contents, where every line is a
   link to its chapter, and the title page.
3. **Turn.** You can turn the pages in several ways:
   - scroll
   - ← / →, PageUp / PageDown, Space, Home / End
   - swipe sideways on a phone
   - the chapter tabs
   - the corner arrows

   A real leaf turns around the spine, scrubbed by scroll and snapped to the
   nearest spread. It shades as it lifts and casts a shadow.
4. **Arrive.** When a spread arrives (halfway through the turn), it goes
   through its intro:
   - the engraving inks itself in from left to right
   - the spice wreath in the corner is drawn
   - the name rises letter by letter out of a blur
   - the script title writes itself in
   - the columns settle line by line
   - the pot lowers onto the page while its shadow tightens beneath it, and
     steam starts to rise

   This plays once per spread.
5. **Live.** Once a spread has arrived, it keeps moving:
   - the wreaths breathe
   - the paper catches a soft light that follows the pointer
   - pots and engravings shift slightly with the pointer (parallax)
   - hovering a pot lifts it and widens its shadow
   - in the engravings, ships drift, dhows sail, the sea shimmers, the
     fountain plays, and smoke rises from the ghat
6. **Phones.** The book becomes one page at a time, in reading order. Each
   page turns away to reveal the next.
7. **Reduced motion.** Nothing turns and nothing draws itself in. Spreads
   change with a calm fade, and steam and drift are off.

The stage is `position: sticky` inside a tall section, and scroll is the only
source of truth for which page is open. Keys, tabs and swipes just scroll the
window to the right place. There is no ScrollTrigger pinning.

```tsx
import BiryaniLegendsTemplate from "@/components/ui/biryani-legends-template"

<BiryaniLegendsTemplate />

<BiryaniLegendsTemplate
  preset="midnight"
  title="Biryani Legends"
  legends={[
    {
      name: "Faiza Abdulla",
      title: "A Thalassery Biriyani Legend",
      city: "Thalassery",
      layout: "shore",            // engraving across the bottom
      engraving: "harbour",
      story: ["…left page…"],
      continued: ["…right page…"],
      note: "…italic closing note…",
      dish: { vessel: "brass", rice: "jeerakasala" },
      // or real assets:
      // dish: { src: "/legends/faiza-handi.webp", alt: "…" },
      // engravingImage: { src: "/legends/tellicherry.webp", aspect: 1600 / 520 },
    },
  ]}
  onSubscribe={(email) => fetch("/api/list", { method: "POST", body: email })}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `legends` | Faiza Abdulla, K. Selvarajan, Sonia Singh | `BlLegend[]`, described below. |
| `title` / `subtitle` / `edition` / `publisher` | `"Biryani Legends"` / `"Stories from the handi"` / `"Volume One"` / `"The Saffron Press"` | Cover, title page, top bar. |
| `epigraph` | a line about dum | Quote under the contents. |
| `closing` | — | `{ heading, script, body, primary, secondary, newsletter }` for the last spread. |
| `columns` / `socials` | kitchens, book, visit; four icons | Colophon links. Socials use the `instagram`, `youtube`, `x`, `facebook` and `mail` icons. |
| `colophon` / `copyright` | — | Small print. |
| `onSubscribe` | — | Called with the address from the wax-seal form. |
| `cta` | `Order a handi` | Top-bar link. `null` hides it. |
| `preset` | `"parchment"` | `parchment` (warm desk) or `midnight` (a walnut desk under a lamp). The book stays cream. |
| `height` | `"100svh"` | Height of the sticky stage. A definite length. |
| `fontHref` | Google Fonts: Cormorant Garamond, Allura, Crimson Pro | `null` loads nothing. |
| `displayFont` / `scriptFont` / `bodyFont` | those three, then system serif / cursive | |
| `paperTexture` | grain generated at runtime | URL of a seamless paper texture, tiled at 512px and multiplied in. |

### `BlLegend`

| Field | |
|---|---|
| `name`, `title` | Saffron serif name and the handwritten line over it. |
| `city`, `dishName` | Tabs, contents and the running foot. |
| `layout` | `shore` (engraving across the bottom), `summit` (top right), `terrace` (top left). Cycle them for rhythm. |
| `engraving` | `harbour`, `fort` or `garden`: the drawn plates. |
| `engravingImage` | `{ src, alt?, aspect? }`: a real engraving instead. Use a transparent PNG or WebP where the ink is opaque and the paper is transparent. It is revealed by an ink sweep. |
| `tone` | `sepia` or `graphite` ink for a drawn plate. |
| `story` / `continued` / `note` | Left-page paragraphs, right-page paragraphs, italic closing note. |
| `dish` | `{ vessel: "brass" \| "clay" \| "enamel", rice: "jeerakasala" \| "seeraga" \| "basmati", seed }` to paint a pot, or `{ src, alt }` for a top-down photo cut-out. |

## Notes

- **The art is made here.** The engravings are SVG line work built by an
  engraver's toolkit in the file:
  - hatching clipped to shapes
  - contour lines that follow a ridge
  - palms, treelines, crenellated forts, East Indiamen, dhows, figures, a
    palanquin

  Every line has `pathLength = 1`, so GSAP inks a plate in by sweeping
  `stroke-dashoffset` on twelve left-to-right groups.

  The pots are painted on a canvas at runtime and handed to an `<img>` as a
  blob URL:
  - the vessel, with hammered copper, ridged clay or glossy enamel
  - thousands of grains coloured by a saffron noise field
  - meat with a bone
  - fried onion, cashews, raisins, mint, coriander, whole spices and a lime
  - ghee gloss and the light

  The paper grain and book cloth are generated the same way. Nothing is
  fetched except the font stylesheet.
- **Real images.** `demo-photos.tsx` is the same book with real assets:
  - three generated top-down photographs of the pots, cut out to transparency
  - three public-domain engravings (Tellicherry 1736, Ambur 1806, Lucknow
    1803), turned into ink on a transparent ground
  - a generated laid-paper tile

  They are embedded as AVIF and WebP `data:` URIs, so the demo fetches nothing
  and stays under 21st's 200 KB demo limit. AVIF needs Safari 16 or later.
  The full-size files are in `media/biryani-legends-template/legends/`, with
  their origins, prompts and processing in
  `media/biryani-legends-template/ASSETS.md`. In your own app, serve them from
  `public/` and pass the URLs as shown there.
- **Performance.**
  - Only the leaves next to the open spread are visible. Every other leaf is
    `visibility: hidden`.
  - Each page renders only the engraving lines that fall on its half.
  - The pots are painted one at a time after the cover has opened, then
    cached as images, so a turn is never interrupted.
  - The turn itself is a composited `rotateY`.
- **Layout.** Each block is placed in percent of the spread, with its own
  values for phones. The type is sized from the book's width, so a spread
  keeps its composition at every size, like a printed page.
- **Accessibility.**
  - The book is a labelled region, and the chapter tabs and arrows are real
    buttons.
  - The page number is announced politely.
  - Every link and button has a visible focus ring.
  - Names are headings with their full text as the label.
  - Text exists once: each block is rendered only on the page that shows it.
- **21st covers.** The demos load Google Fonts, which the capture sandbox
  blocks. Supply `media/biryani-legends-template/cover.png` as `--preview`.
  The cover is shot from `demo-photos.tsx`, which is the demo to publish.
