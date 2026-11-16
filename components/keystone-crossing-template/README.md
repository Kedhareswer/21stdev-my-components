# Keystone Crossing Template

A one-page portfolio for Kedhareswer, told as a single camera move through a stone-bridge town. The hero bridge carries a huge serif name. As you scroll the camera creeps forward, then rushes up until the arch frames the whole screen and the valley behind it melts into a turquoise blur. It glides through the arch into a riverside old town, where a headline settles over the sky. A row of frosted project cards then slides across the rooftops. A contact band closes the page.

```tsx
import KeystoneCrossingTemplate from "@/components/ui/keystone-crossing-template"

export default function Page() {
  return <KeystoneCrossingTemplate />
}
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | Height of the pinned stage. Use a definite length, never a percentage. |
| `length` | `7` | How many stage heights of scrolling the camera move takes. |
| `email` | `kedhareswer.12110626@gmail.com` | Every card and call to action is a `mailto:` to this address. |
| `assetBase` | component site | Where `hero.webp`, `bridge.webp` and `town.webp` live. Point it at your own copy to self-host them. |
| `className`, `style` | | Passed to the root. |

## Sections

1. **Hero:** the bridge between two towers. "KEDHAR" sits in the sky, with a one-line intro and three cream chips inside the arch.
2. **Bridge:** the arch fills the screen, sharp against a blurred, washed valley. "The bridge is where ideas cross." with two figures.
3. **Town:** the riverside town comes into focus. A blue scrim rises behind "The work keeps people close." and an *Open selected work* pill.
4. **Work:** six frosted cards (Project 1 to 5 and an open slot) arrive from the right and keep travelling left as you scroll. Round arrows step the row by hand.
5. **Contact:** a cream band (deep teal in dark mode) with the email, Client 1 to 3 and a photo strip.

The nav links (Intro, Bridge, Town, Work) scroll to their point in the camera move, and the current one is underlined.

## Motion

Measured frame by frame from the reference recording, an 11.6 s phone video of the site on a laptop. The screen was perspective-corrected to 1120 × 700 and mapped onto a 1440 × 900 viewport. The forward scroll runs from 0 to 9.2 s and maps linearly onto the pinned stage (p = t / 9.2).

- **Title out, 0.7 to 1.25 s:** opacity to 0, `blur(14px)`, 60px rise. The intro and chips leave from 0.65 to 1.15 s, sinking 26px.
- **Creep, 0.3 to 1.33 s:** the scene scales from 1.05 to 1.10.
- **Rush, 1.3 to 1.85 s:** an ease-in-out up to the arch. The zoom is computed so the arch runs off both screen edges: 2.7× at 1440 × 900, with at least 1.85× on phones. The valley layer blurs to 13px and takes a sky-to-turquoise wash. The bridge layer stays sharp because it is a cut-out of the same photo, so the two always line up.
- **Glide, 1.9 to 3.3 s:** the arch keeps growing about 22% and rises 7vh.
- **Through, 3.24 to 3.6 s:** the arch overshoots and fades. The town crossfades in from `blur(16px)` and 1.12× scale.
- **Town copy:** in from 4.0 to 4.5 s, out from 5.6 to 6.1 s, with a blur and rise.
- **Cards:** in from 6.85 to 7.4 s (`blur(16px)`, 26vw from the right), drifting 30vw left until 8.7 s, then blurring out by 9.0 s.
- The page follows the scrollbar through a light trail (14% per frame), like the reference's smoothed wheel.
- **Hover:** this only applies where a mouse can hover. Nav underlines grow from the left. Chips and the pill lift 2px and the pill's arrow nudges. Cards rise 6px with a deeper shadow, arrows grow, and the photo strip zooms 4%.

`prefers-reduced-motion` is read at runtime. It drops the zoom, drift, blur and scroll trail, so each section simply crossfades into the next as the reader scrolls.

## Pictures

All three pictures are original images generated with ChatGPT for this template: the hero bridge and the riverside town. `bridge.webp` is the hero photo with its sky and the view through the arch cut away, so it can stay sharp while the valley behind it blurs. They are served as WebP from `https://kedhar-components.pages.dev/keystone-crossing-template/`, and the sources are in `dev/public/keystone-crossing-template/` in this repo.

The fonts are embedded, renamed subsets: Gilda Display for the serif and Inter Tight (weights 400 to 600) for the sans, both OFL.

No dependencies besides React.
