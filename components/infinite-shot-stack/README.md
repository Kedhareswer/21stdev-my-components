# Infinite Shot Stack

A selected-work gallery for a studio or portfolio. Shots stand in a deck that
recedes up the screen, each one smaller, darker and higher than the one in
front, until only their top edges show. Move on and the front shot falls away
while the next comes forward on a spring; the deck loops forever. A rotating
"View case" badge follows the pointer over the front shot, the caption
underneath names the work, and the studio's name sits huge and faint behind
everything.

- **Three ways to drive it** (`mode`):
  - `pin` (default): the section pins, page scroll walks the deck once round,
    then the page carries on. Scroll back and it walks back. This mode never
    traps the page.
  - `wheel`: the wheel and trackpad drive the deck forever while the pointer is
    over it, like the full-screen original. Best as a whole page.
  - `buttons`: only drag, swipe, the arrow keys and the buttons.
- **Drag** with a mouse (up and down, like the deck) or swipe on touch
  (sideways, so the page still scrolls vertically). Flicks carry to the next
  shot. A drag never counts as a click.
- **Click** the front shot to follow its `href` or call `onSelect`. Click a
  shot behind it to bring that one forward.
- **Keys**: arrows and Page Up / Page Down. Only the front shot is in the tab
  order, and the caption is announced politely.
- **Autoplay** (optional, not in `pin`) pauses on hover, focus and off screen.

```tsx
import InfiniteShotStack from "@/components/ui/infinite-shot-stack"

<InfiniteShotStack />                                  // pinned, dark, nine studio shots

<InfiniteShotStack
  mode="wheel"
  brand="halden"
  items={[
    { image: "/work/petal.jpg", title: "Petal", client: "Petal Florists", year: "2026", tags: ["iOS app"], href: "/work/petal" },
    { image: "/work/lumen.jpg", title: "Lumen", client: "Lumen Bank", year: "2026", tags: ["Brand", "3D"], href: "/work/lumen" },
  ]}
  onSelect={(item) => router.push(item.href)}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `items` | nine shots | `{ image, alt?, title, client, year, tags?, href? }` |
| `brand` | `"halden"` | The huge word behind the deck |
| `tagline` | none | Optional line, top left |
| `links` | none | Optional `{ label, href }[]`, top right |
| `visible` | `6` | How many shots stand in the deck |
| `badge` | `"View case"` | The word on the rotating badge |
| `mode` | `"pin"` | `pin`, `wheel` or `buttons` (see above) |
| `autoPlay` | `0` | Milliseconds per shot; `0` is off. Not used in `pin` |
| `theme` | `"dark"` | `dark`, `light` or `system` |
| `height` | `"100svh"` | The visible frame. Pinned, the section scrolls about 0.42 viewports per shot beyond it |
| `onSelect` | none | `(item, index)`; without it the front shot follows its `href` |
| `className` | none | On the root |

## Notes

- **Performance.** The spring runs in one animation frame loop, writes only
  `transform`, `opacity` and a dim variable to each shot, and stops when it
  settles. React re-renders only when the front shot changes.
- **Reduced motion.** The spring jumps and the badge stops spinning.
- **Photos.** The default shots are Unsplash photos (Unsplash License): a phone
  render, pastel spheres, a pool house, a tablet with a magazine site, a blue
  spiral, a wooden ceiling, a phone in a torus, a desk at night and a tablet
  with a community app. The studios and clients named on them are made up.
- Reference: Shakuro's "Infinite Gallery" on CodePen, for the receding deck.
  The modes, interaction, caption and code here are new.
