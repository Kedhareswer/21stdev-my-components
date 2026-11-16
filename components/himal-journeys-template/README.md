# Himal Journeys Template

A one-page site for Himalayan tours that Kedhareswer designs and leads. The hero sits over a dawn range, and the serif accent in its headline morphs between phrases. Below it is a curved 3D coverflow of tours on a spring. Each card morphs into a full detail sheet. Next comes an about line that inks in word by word as you scroll, then a bento of three cards and a strip of rolling counters.

```tsx
import HimalJourneysTemplate from "@/components/ui/himal-journeys-template"

export default function Page() {
  return <HimalJourneysTemplate />
}
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | Height of the hero. Use a definite length, never a percentage. |
| `email` | `kedhareswer.12110626@gmail.com` | Every call to action is a `mailto:` to this address. |
| `brand` | `"Kedhar Trails"` | Name in the nav and footer. |
| `tours` | five placeholder tours | `{ id, name, price, days, start, blurb, season, peak, group, plan[] }[]`. `id` is also the picture's file name (`<id>.webp`). |
| `assetBase` | component site | Where the `.webp` pictures live. Point it at your own copy to self-host them. |
| `className`, `style` | | Passed to the root. |

## Motion

- **Nav:** a sticky bar that morphs into a floating glass pill once you scroll past the hero. An ink pill follows the pointer and, once the nav is a pill, marks the current section. It clips an inverted copy of the labels, so text flips colour mid-letter. Its two edges ride separate springs: the leading edge darts ahead and the trailing edge catches up. This is adapted from `ink-pill-navbar`, without gsap. On phones the menu icon morphs into a cross and opens a sheet.
- **Hero:** the photo settles from a slow zoom and parallaxes on scroll. The words rise in out of a blur. The italic phrase cycles through *Without Limits. / Above the Clouds. / On Your Terms. / Beyond the Map.*: its width glides while the old letters blur away and the new ones settle in. The button's label rolls and an arrow dot grows on hover.
- **Coverflow:**
  - Five cards sit on a curve, the centre one raised. The cards move on a damped spring.
  - You can drag or flick them, use the ← → keys, or press the round buttons.
  - The carousel loops both ways and autoplays. Autoplay pauses on hover, while dragging, off-screen or while a sheet is open.
- **Shared-element sheet:** press *Explore* on the centre card and the card lifts out, then grows from its exact rectangle into a dialog. The photo slides to the left half while the details slide in. Closing shrinks it back onto the card. Esc and the backdrop close it.
- **Bento:**
  - The *all-inclusive* switch's knob stretches as it travels. The copy blurs between two offers, and the button label rolls between *Tailor-Made* and *Route Only*.
  - The *Made for You* pill morphs into a panel with trip details.
  - The 50+ counter rolls up and the dot bars pop in one by one.
- **Stats:** every digit is an odometer column that spins once and lands. Sections fade in out of a blur as they enter the viewport.

`prefers-reduced-motion` stops autoplay and phrase cycling. Springs snap into place, and transitions and animations collapse to an instant.

## Notes

- **No dependencies beyond React.** Inter Tight and Playfair Display italic (both SIL OFL) are subset to Latin and embedded as woff2 (about 44 kB together).
- **Pictures:** seven ChatGPT-generated photos (`hero`, `everest`, `annapurna`, `pokhara`, `kathmandu`, `himalaya`, `trekker`) are served from `kedhar-components.pages.dev/himal-journeys-template/`. They are 60–160 kB each, 726 kB in all.
- **Dark mode:** a `.dark` ancestor switches the page to a deep navy palette. The hero and photos stay as they are.
- **Layout:** below 860 px the nav collapses to a menu and the coverflow shows the neighbours peeking in. The about and bento sections stack, and the stats become a 2 × 2 grid.
- All copy is placeholder: the tours, prices and itineraries are examples to swap for your own.
