# Dish Orbit Carousel

A smart-kitchen-display menu. The plated dish sits on the left beside its
two-weight name, with a chef card and a thumbnail strip. Changing dish swings
the plate out over the top on a wide orbit while the next plate swings in from
the other side. The thin title line wipes out to the right and the heavy line
to the left, then the next name wipes back in. The chef card and its coloured
rating badge cross-fade, and a pastel arc behind the scene sways and takes the
new dish's colour.

The arrows, the thumbnails, the side pager, the arrow keys and a sideways
swipe on the plate all drive it, endlessly in both directions. Jumping from a
thumbnail swings the short way round. Nothing plays on its own.

```tsx
import DishOrbitCarousel from "@/components/ui/dish-orbit-carousel"

<DishOrbitCarousel dishes={dishes} backdrop="/kitchen-wall.webp" />
<DishOrbitCarousel dishes={dishes} height="720px" onOrder={(d) => addToCart(d)} />
```

```ts
type Dish = {
  title: string          // thin first line, e.g. "Char grill"
  subtitle: string       // heavy second line, e.g. "Ribeye"
  image: string          // top-down plate photo, a square cut-out works best
  alt?: string
  eyebrow?: string       // defaults to "#n Most loved dish"
  label?: string         // thumbnail label, defaults to title + subtitle
  rating: number
  chef: string
  kitchen?: string
  description: string
  likes: number
  ingredients?: string[] // shown on the card's Ingredients tab
  accent: string         // badge and arc colour
}
```

## Props

| Prop | Default | |
|---|---|---|
| `dishes` | | The menu. |
| `height` | `"100svh"` | Root height. Use a definite length; percentages collapse on a host page. |
| `backdrop` | none | A photo behind the display, such as a kitchen wall. The theme background washes it, so it reads as daylight on a light theme and lights-off on a dark one. |
| `initialIndex` | `0` | |
| `fontSrc` | embedded Outfit | Pass `null` to use the host's font. |
| `onPlay`, `onOrder` | | The "Play video" and "Order food" buttons. |
| `onChange` | | Called with the new index. |

The layout is a 960 × 600 display canvas, scaled to fit the root. Below a 640 px
container width it restacks into one column: plate, title, strip, card, nav.
Title lines shrink to fit, so long names don't run into the card.

Likes, the dislike, the card tabs, the bottom nav and the microphone toggle
keep their own state. Wire `onPlay`/`onOrder` for the rest.

Reduced motion: the swap is instant and the CSS transitions are off.

**Dependency: `gsap`** (declared in the root `package.json`).

**Font:** Outfit by the Outfit Project Authors, SIL Open Font License 1.1,
embedded as a Basic Latin subset (about 19 KB).

**Demo photos:** free Unsplash photos, cut out and inlined as WebP (IDs in
`demo.tsx`). The wall photo was shrunk, with the plain wall extended round it.
