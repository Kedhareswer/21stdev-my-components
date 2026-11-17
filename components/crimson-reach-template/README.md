# Crimson Reach Template

A dark, red-lit one-page studio site for Kedhareswer.

The page opens on a red hero card where two hands reach across, drifting apart as you scroll. After that:

- A manifesto inks in word by word.
- A wide dune is cut into three panels, which flip into journey cards and fan out.
- Six service rows lead into a giant *Featured Work* title that shrinks onto a project carousel.
- A wall of client tiles, a testimonial slider, and a contact pair with rolling counters follow.
- A red statue card closes the page.

```tsx
import CrimsonReachTemplate from "@/components/ui/crimson-reach-template"

export default function Page() {
  return <CrimsonReachTemplate />
}
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | Height of the hero. Use a definite length, never a percentage. |
| `email` | `kedhareswer.12110626@gmail.com` | Every call to action is a `mailto:` to this address. The footer address and the *Copy* link put it on the clipboard. |
| `brand` | `"Kedhar."` | The italic serif wordmark in the nav. |
| `works` | six placeholder projects | `{ id, title, tags[] }[]`. `id` is also the picture's file name (`<id>.webp`). |
| `quotes` | Client 1, 2 and 3 | `{ id, name, role, quote }[]`. `id` names the portrait. |
| `assetBase` | component site | Where the `.webp` pictures live. Point it at your own copy to self-host them. |
| `className`, `style` | | Passed to the root. |

## Motion

- **Intro:** the page fades up from black. The headline words rise out of a blur one after another, and *Scroll to Explore* rolls on a loop.
- **Hero:**
  - Both hands are cut-out layers over a clean red plate. Each drifts on its own slow loop and they part as you scroll.
  - The nav starts as a bar across the top of the card. Once the hero is mostly gone it becomes a centred, blurred pill.
- **Manifesto:** the section pins for 2.4 screens while the words light from 26 % to full, in reading order. Beneath it, a client marquee scrolls between laurels.
- **Journey:** the section pins for 3.4 screens and runs in four steps:
  1. The uncut dune holds while the title brightens.
  2. Gaps cut it into three panels, and the image stays continuous across the cuts.
  3. Each panel flips on Y into a card (silver, red or charcoal), a beat apart.
  4. The cards fan out at −12°, 0° and 8°.
- **Featured Work:**
  - A 3.3× serif title holds centre stage, then shrinks to the top.
  - The carousel rises under it. Click a side card or an arrow to bring it into the middle. Cards slide and scale on one easing curve.
- **Testimonials:** a looping slider with dimmed neighbours, arrows and a dot pill. It autoplays every 6.5 s.
- **Contact:** the two cards swing in from steeper angles. On hover both straighten and lift. The counters roll their digits as the section scrolls in.
- **Closing card:** it grows from 90 % with rounder corners while the statue settles from a zoom. The copy comes into focus out of a blur.
- **Hover:** labels roll on links and buttons. Service images zoom and their titles glow. Client tiles lift, and the side projects brighten.

`prefers-reduced-motion` shows the finished state of every scroll piece. It stops the loops and autoplay, and makes transitions instant.

## Notes

- **No dependencies beyond React.** STIX Two Text (regular and italic) and Geist, both SIL OFL, are subset to Latin and embedded as woff2 (about 30 kB).
- **Pictures:** 21 ChatGPT-generated images (440 kB in all) are served from `kedhar-components.pages.dev/crimson-reach-template/`. The hands were cut out of one generated hero, so the plate and the hands always match.
- **Always dark:** the page sets its own black ground and doesn't follow a `.dark` ancestor, because the red light only reads on black.
- **Phones:** below 860 px the nav keeps only the wordmark and button, the journey cards overlap in a tighter fan, service rows stack, the client wall is 3 columns wide, and the testimonial card puts the photo on top.
- All copy is placeholder: the projects, clients, numbers and quotes are examples to swap for your own.
