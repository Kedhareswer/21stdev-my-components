# pinwheel-gallery

A dark hero with a pinwheel of poster cards. Seven cards hang off one axis like the blades of a
pinwheel, seen from just off the axis. On load the wheel whips round with motion trails and
bowed blades, then winds down to a slow drift. Drag to fling it: the faster it spins the more
the cards bow and the longer their trails. As the section scrolls away the camera swings in
and the blades open up like the pages of a book. Bottom left: a short line about
Kedhareswer and one call to action.

## Props

| Prop | Default | Notes |
|---|---|---|
| `images` | nine generated posters | `{ src, alt? }[]`, portrait 3:4 works best. |
| `count` | `7` | Cards on the wheel, 3–12 (the first `count` images). |
| `eyebrow` | `"Motion & identity · Kedhareswer"` | Small line above the title. |
| `title` | "I set brands / in motion." | Any node; two `<span>`s give the offset second line. |
| `subtitle` | one line | |
| `cta` | `{ label: "Start a project", href: mailto }` | Mails kedhareswer.12110626@gmail.com. Pass `null` to drop it. |
| `height` | `"100svh"` | Section height. A definite length. |
| `className`, `style` | – | |

## Notes

- No dependencies beyond React. Pure CSS 3D: each card is three hinged strips so it can bow;
  two ghost copies per card trail behind at speed, fading out at rest.
- Images load from `https://kedhar-components.pages.dev/pinwheel-gallery/`; pass your own
  `images` in production.
- The section carries its own near-black look; the CTA focus ring uses `--color-primary`.
- Below 900 px wide the wheel sits above the copy.
- `prefers-reduced-motion`: no entry spin, no drift and no fling; the camera follows scroll
  without easing.
