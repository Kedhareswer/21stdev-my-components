# Fanned Deck Slider

Product cards held like a hand of playing cards. The chosen card stands upright in the middle, lifted and a little larger, with a gloss sweeping across it. The rest fan out round a pivot below the deck, tilting, shrinking and dimming the further they are from it. Every card rides its own spring, the outer ones a beat behind, so each change ripples through the hand. On first view the hand deals itself out of a single stack.

Drag the deck sideways (it rubber-bands past the ends), click any card, use the arrow buttons, or the arrow / Home / End keys when it has focus. Under the deck, a line of copy and a call-to-action follow the chosen card.

```tsx
import FannedDeckSlider from "@/components/ui/fanned-deck-slider"

<FannedDeckSlider
  eyebrow="Drop 07 · nine pieces"
  title={<>The autumn <em>edit</em></>}
  cards={[
    { tag: "Audio", title: "Solace Over-Ear", price: "$349", blurb: "Closed-back, forty hours a charge…", href: "/p/solace", image: "/solace.webp" },
    { tag: "Time", title: "Kumo Field Watch", price: "$420", image: "/kumo.webp" },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `cards` | required | `{ title, image, alt?, tag?, price?, blurb?, href? }[]`. Portrait photos (about 5:7). Five to twelve suit the fan. |
| `title` | "The autumn *edit*" | Heading over the deck (string or node; an `<em>` takes the accent). |
| `eyebrow` | `"Drop 07 · twelve pieces"` | Small line above the heading. |
| `ctaLabel` | `"Reserve"` | Button under the deck; a card with `href` renders a link. |
| `spread` | `7` | Degrees each card tilts per step from the centre. |
| `background` / `ink` / `accent` | `#120e14` / `#f6efe8` / `#ff7a45` | Stage, text and accent colours. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |
| `onChange` / `onCta` | none | `(index)` and `(card, index)`. |

The frame loop runs only while a card is still moving and the deck is on-screen. It reads no layout (sizes come from a `ResizeObserver`) and writes only `transform`, `z-index` and opacity.

With `prefers-reduced-motion`, cards jump straight to their places with no springs, deal or gloss.

No dependencies beyond React.
