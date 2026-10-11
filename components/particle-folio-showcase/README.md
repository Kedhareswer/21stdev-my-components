# Particle Folio Showcase

A portfolio-directory promo laid out on a sunlit green cutting mat, with desk
clutter around the edges: crumpled paper, paper clips, scissors, a binder clip,
tortoiseshell glasses, earphones, a red pen and pink folders.

On the left is a browser window showing the directory's grid of curated
portfolios. On the right is a fan of three portfolio cards. Stepping the
carousel dissolves the centre cover into sand that blows off up and to the
right on a breeze, then settles back as the next cover. The same particles
change colour in flight.

**No dependencies.** React is the only import. The mat is raw WebGL2 and the
dissolve is canvas 2D. Every prop is drawn as inline SVG, so nothing is
downloaded.

## Usage

```tsx
import ParticleFolioShowcase, { type FolioItem } from "@/components/ui/particle-folio-showcase"

const items: FolioItem[] = [
  {
    src: "/covers/tara.jpg",
    name: "Tara Iyer",
    country: "India",
    role: "Visual & Communication Designer",
    style: "Interactive",
    experience: "Less than 1 year",
    accent: "#e11d48",
    companies: [{ name: "Parcel", color: "#ef4444" }, { name: "Tandem", color: "#0f766e" }],
  },
  // …
]

<ParticleFolioShowcase items={items} autoplay={5000} />

<ParticleFolioShowcase
  items={items}
  heading="Our design index"
  captions={{ showcase: "Hand-picked every week", details: "Who made it", companies: "and where they shipped" }}
  matColor="#1f3a8a"
  particleSize={3}
  showProps={false}
/>
```

## How the dissolve works

Both covers are painted once into device-resolution pixel buffers, and each
gets one averaged colour per `particleSize` cell. On every frame:

1. Start from the outgoing cover.
2. Clear the cells whose particle has left, and paste the incoming cover into
   the cells whose particle has landed.
3. Draw the particles that are still in the air. Each one follows a closed
   cubic loop downwind and fades from the old colour to the new one, glinting
   a little at the top of its arc.

So the first frame is exactly the old cover and the last frame is exactly the
new one, and the swap to the real `<img>` at either end never shows. The left
edge lifts off first, so it reads as wind rather than noise.

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | required | `FolioItem[]`: `src`, `name`, plus optional `alt`, `country`, `role`, `style`, `experience`, `accent`, `companies` (`{ name, color?, initials? }[]`). The grid shows the first six. |
| `heading` | `"This portfolio website"` | Headline over the browser window. |
| `captions` | see below | `{ showcase, details, companies }`: the three white notes. |
| `pageTitle` | `"Curated Portfolios For You !"` | Heading inside the browser window. |
| `tabs` | `["Portfolios", "Case Studies", "Job Tracker"]` | Browser nav. The first one is shown as active. |
| `filters` | fictional company names | Filter chips. Clicking one toggles it; filtering itself is cosmetic. |
| `ctaLabel` / `loginLabel` | `"Submit Portfolio"` / `"Log in/Signup"` | Nav buttons. |
| `url` | `"folio.directory/curated"` | Fake address bar. |
| `initialIndex` | `0` | Wraps if it's out of range. |
| `autoplay` | `0` | ms between steps. Never shorter than `duration + 400`. Pauses on hover, on focus and while the tab is hidden. |
| `duration` | `1800` | Dissolve length in ms. |
| `particleSize` | `2` | CSS px per particle. 3–4 is chunkier and cheaper. |
| `onChange` | none | `(index) => void`. |
| `matColor` / `sunColor` | `"#0c7f55"` / `"#fff0cf"` | Mat and sunlight colours, hex. |
| `intensity` / `speed` | `1` / `1` | Sunlight strength and drift speed, as in sunlit-cutting-mat. |
| `showProps` | `true` | Desk clutter. Fewer pieces are drawn on smaller screens. |
| `height` | `"100svh"` | **Minimum** root height. Must be a definite length. The layout grows past it on small screens. |
| `className` | `""` | Appended to the root. |

Default captions: "Showcases the best design portfolios", "Along with the
details of the designer", "and the companies they have worked with".

## Interaction

- Use the arrow buttons, the dots, a click on either side card, or a click on
  any tile in the browser grid.
- When the card fan has focus, ← / → step the carousel.
- Clicking again mid-dissolve cancels the current dissolve and starts the next
  one.

## Notes

- **Image origin.** The dissolve reads the covers' pixels, so `src` must be
  same-origin, a `data:`/`blob:` URL, or served with CORS headers. A cover the
  browser won't let it read swaps instantly instead.
- **Reduced motion.** Covers swap without particles, the mat paints a single
  still frame, and the CSS entrances are off.
- **No WebGL2.** The mat falls back to a flat CSS grid in `matColor`.
- The mat shader is a copy of [sunlit-cutting-mat](../sunlit-cutting-mat). The
  test fails if the two shaders drift apart.
- The colours are fixed (white paper on green vinyl), so it looks the same in
  light and dark themes.
