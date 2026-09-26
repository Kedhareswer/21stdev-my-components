# Alter Ego Mask Reveal

A portrait landing page with a secret. A quiet civilian portrait sits on a
charcoal backdrop. Move the pointer over it and a gooey blob follows you,
uncovering the masked hero underneath, but only where you have been. The
trail melts back within a second, so the mask closes behind you and is gone
once you leave. Click (or press Enter) to suit up completely; click again to
take it off.

**No dependencies.** React is the only import. Both portraits (the civilian
and the red web mask with mesh lenses) are SVG drawn from numbers on one
shared face geometry, so the mask lands exactly on the face. No images, no
fonts to load. To use two photos instead, pass `baseSrc` and `revealSrc`.

## How it plays

| Input | What happens |
|---|---|
| idle | a ghost pointer circles the face, peeking at the mask (`autoPeek`) |
| hover | a liquid blob sits under the pointer, a trail of drops follows it |
| stop / leave | the drops swell, sag a little, and melt away over `linger` ms |
| click / Enter / Space | the whole stage floods into hero mode; again to undo |
| civilian eyes | follow the pointer |

The goo is an SVG mask: blurred circles run through an alpha threshold (the
classic gooey filter) plus a little turbulence so the edge wobbles like
liquid. The same shape, dilated, draws the glowing `accent` rim.

## Usage

```tsx
import AlterEgoMaskReveal from "@/components/ui/alter-ego-mask-reveal"

<AlterEgoMaskReveal />

<AlterEgoMaskReveal
  name="Jane Doe"
  revealName="Night shift"
  word="DOE"
  revealWord="BOO!"
  accent="#6b5bff"
/>

// Your own two photos: civilian first, hero second.
<AlterEgoMaskReveal
  baseSrc="/me.jpg"
  revealSrc="/me-masked.jpg"
  revealFit={{ x: 0.7, y: -2, scale: 0.78 }}
/>
```

### Lining up two photos

Both photos are laid into a 3:4 portrait frame with `object-fit: cover`
behaviour. If the faces are not the same size or place in both shots, nudge
the hero with `revealFit`: `x` and `y` move it in percent of the frame,
`scale` shrinks or grows it around the frame centre. Match the eyes: once the
eyes line up, everything else does. Photo edges fade into the backdrops, so
set `backdrop` / `revealBackdrop` close to each photo's own background.

## Props

| Prop | Default | Notes |
|---|---|---|
| `word` | `"PARKER"` | Big outlined word behind the civilian. Stretched to fit. |
| `revealWord` | `"THWIP!"` | Big solid word behind the hero. |
| `name` | `"Peter Parker"` | Top-left name line. |
| `revealName` | `"Your friendly neighbour"` | Seen through the mask. |
| `label` / `revealLabel` | `"File 001 · Civilian"` / `"… · Masked"` | Small kicker above each. |
| `caption` | `"Queens, NY — …"` | Bottom-right. Empty hides it. |
| `hint` | `"Hover his face"` | Pill shown until the first interaction. Empty hides it. |
| `baseSrc` | none | Civilian photo; replaces the drawn civilian. |
| `revealSrc` | none | Hero photo; replaces the drawn mask. |
| `revealFit` | `{ x: 0, y: 0, scale: 1 }` | Aligns `revealSrc` onto the base face. |
| `brush` | `78` | Blob radius in 1/1000ths of the stage height. Shrinks with the portrait on narrow screens. |
| `linger` | `950` | How long the trail lasts (ms). |
| `accent` | `"#e23a44"` | Rim glow, hero word, hero kicker. |
| `backdrop` | `"#1c2225"` | Civilian backdrop. |
| `revealBackdrop` | `"#070708"` | Hero backdrop (a faint web is drawn over it). |
| `autoPeek` | `true` | Ghost pointer until someone interacts. |
| `fontFamily` | Anton / Bebas Neue / Oswald / Impact… | Any bold face; nothing is loaded. |
| `height` | `"100svh"` | Stage height. **Must be a definite length.** |
| `className` | `""` | Appended to the root. |

## Notes

- Touch: tap to suit up / down; dragging a finger paints the trail until the
  page takes over the gesture for scrolling (`touch-action: pan-y`).
- Reduced motion: no ghost peek, no drip or wobble, the trail is shorter and
  the full reveal snaps instead of flooding.
- Two instances on one page are fine; every SVG id comes from `useId`.
