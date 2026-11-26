# folding-card-reel

A rolodex of square photo cards. Cards wait in a stack that leans back from a hinge; one
after another the front card tips over, bends like card stock as it falls, and lands face-up
on the fallen stack in front, so the next photo is revealed behind it. The coloured edges of
the cards fan out in both stacks. Hovering pauses the reel (a card already in the air lands
first) and leans the front card toward you; clicking lifts it out flat to face you, and
clicking again puts it back.

## Props

| Prop | Default | Notes |
|---|---|---|
| `images` | nine generated photos | `{ src, alt? }[]`. Square images work best; at least 2. |
| `cardSize` | `340` | Largest card edge in px. The card also stays within `62vw` and `36svh`. |
| `interval` | `760` | ms between flips. |
| `flipDuration` | `520` | ms one flip takes. |
| `autoPlay` | `true` | Keep flipping on its own. |
| `height` | `"100svh"` | Height of the stage. A definite length. |
| `className`, `style` | – | |

## Notes

- No dependencies beyond React. Pure CSS 3D: each card is six hinged strips, so it can curl
  as it falls; the front and back faces show the same photo, the back pre-flipped so it lands
  upright. A pool of 12 cards is recycled, whatever the number of images.
- Images load from `https://kedhar-components.pages.dev/folding-card-reel/`; pass your own
  `images` in production.
- The stage is transparent, so the cards sit on your page's background in light and dark.
- The whole stage is one button ("Lift the front card") with a focus ring in
  `--color-primary`; the photos' alt texts are listed for screen readers.
- `prefers-reduced-motion`: the reel stands still and the lift is instant.
