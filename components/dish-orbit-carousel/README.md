# Dish Orbit Carousel

A smart-kitchen-display menu. The plated dish sits on the left beside its
two-weight name, with a chef card and a thumbnail strip. Changing dish swings
the plate out over the top on a wide orbit while the next plate swings in from
the other side. The thin title line wipes out to the right and the heavy line
to the left, then the next name wipes back in. The chef card and its coloured
rating badge cross-fade, and a pastel band along the plates' orbit stretches
between the two plates, then settles and takes the new dish's colour.

The page scroll drives it. The section pins, and each stretch of scroll brings
the next dish, snapping one at a time. With `loop` on (the default) it runs
forever both ways: past the last dish comes the first, and scrolling up from
the first brings the last. The arrows, the thumbnails, the side pager, the
arrow keys and a sideways swipe on the plate jump too, and move the scroll
with them. Nothing plays on its own.

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
| `height` | `"100svh"` | Height of the pinned stage. Use a definite length; percentages collapse on a host page. The section is this tall plus 0.7 of it per dish of scroll. |
| `backdrop` | none | A photo behind the display, such as a kitchen wall. The theme background washes it, so it reads as daylight on a light theme and lights-off on a dark one. |
| `loop` | `true` | Scroll on forever in both directions. |
| `fontSrc` | embedded Outfit | Pass `null` to use the host's font. |
| `onPlay`, `onOrder` | | The "Play video" and "Order food" buttons. |
| `onChange` | | Called with the new index. |

The layout is a 960 × 520 display canvas, scaled to fit the stage. Below a 640 px
container width it restacks into one column (plate, title, card) sized to fit
one phone screen; the strip hides there, and the pager, swipes and scroll cover it.
Title lines shrink to fit, so long names don't run into the card.

Likes, the dislike and the card tabs keep their own state. Wire `onPlay`/`onOrder` for the rest.

Reduced motion: the swap is instant and the CSS transitions are off.

**Dependency: `gsap`** with its `ScrollTrigger` plugin, which pins nothing itself:
the stage is `position: sticky`, and ScrollTrigger reads the progress and snaps.

`gsap` is declared in the root `package.json`.

**Font:** Outfit by the Outfit Project Authors, SIL Open Font License 1.1,
embedded as a Basic Latin subset (about 19 KB).

**Demo photos:** free Unsplash photos, cut out and inlined as WebP (IDs in
`demo.tsx`). The wall photo was shrunk, with the plain wall extended round it.
