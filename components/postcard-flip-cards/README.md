# Postcard Flip Cards

Photo postcards that turn over in 3D. The front is a full-bleed photo with an italic place name inside a thin inset frame. Hovering (or pressing Turn) flips the card on a springy curve that overshoots and settles, and a light sheen crosses the back as it lands. The back is airmail paper: a striped border, a circular postmark, a perforated stamp cut from the same photo, a handwritten-style note, and a price with a booking button. The cards deal in from a fanned pile on load.

Touch screens flip with the Turn and Back buttons only, so a scroll never flips a card by accident.

```tsx
import PostcardFlipCards from "@/components/ui/postcard-flip-cards"

<PostcardFlipCards
  heading="Postcards from the season"
  cards={[
    { place: "Ericeira", meta: "Portugal · 7 nights", image: "/ericeira.webp", message: "Walked the boardwalk out to the water every morning…", from: "Inês & Rui", postmark: "ERICEIRA · 14 JUN", price: "€980", href: "/trips/ericeira" },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `cards` | required | `{ place, image, message, meta?, alt?, from?, postmark?, price?, cta?, href? }[]`. Portrait photos (about 3:4). |
| `eyebrow` | `"Greetings from"` | Mono label over the heading. |
| `heading` | `"Postcards from the season"` | Serif heading. |
| `description` | short line | Under the heading. |
| `height` | `"100svh"` | Minimum height of the section. |
| `className` | `""` | On the section. |

## Notes

- Pure CSS flip on one `data-flipped` attribute; no animation library and nothing measured.
- The hidden face's controls leave the tab order, so keyboard users only reach what they can see.
- Reduced motion: no deal-in, sheen or zoom; the flip is instant.
- The demo inlines three free Unsplash photos as small WebP so it makes no off-origin requests.
