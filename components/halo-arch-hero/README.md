# Halo Arch Hero

A portfolio intro told as one camera move. While a loading count rolls in like an odometer, your work flies up card by card from the bottom of the page and lines the inside of a half-tunnel: an arch of portrait cards seen end-on, filling from its crown down to both feet. When the arch closes, a sunset sky fades in behind it, and the arch tilts back and opens out into a wide arc of cards across the page, the crown cards turning to face you. The page then frames itself around the scene: a nav, a two-line headline with underlined words, and three stats that count up. The arc keeps drifting; drag it to spin it.

The sibling component `halo-ring-hero` tells the same story with a ring you dive into.

The same card objects persist from the first frame to the last, and one clock drives everything (camera, cards, sky, counter and page). Nothing swaps or crossfades between two different pictures.

## Usage

```tsx
import { HaloArchHero } from "@/components/ui/halo-arch-hero"

export default function Page() {
  return <HaloArchHero />
}
```

```tsx
<HaloArchHero
  height="100svh"
  name="Kedhar"
  nameSuffix=" Naidu"
  cards={["/work/01.webp", "/work/02.webp" /* 20 to 48 portrait images, all different */]}
  sky="/sky.webp"
  links={[{ label: "Work", href: "#work" }, { label: "About", href: "#about" }]}
  headline={[
    [{ text: "I build interfaces for " }, { text: "founders", underline: true }],
    [{ text: "and free kits for " }, { text: "students", underline: true }, { text: "." }],
  ]}
  stats={[
    { value: 296, suffix: "+", label: "Components" },
    { value: 84.6, decimals: 1, suffix: "K", label: "Installs" },
    { value: 12.4, decimals: 1, suffix: "K", label: "Followers" },
  ]}
/>
```

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `height` | `string` | `"100svh"` | Definite height of the hero. |
| `name` | `string` | `"Kedhar"` | Short wordmark shown big while loading, then in the nav. |
| `nameSuffix` | `string` | `" Naidu"` | Written in after the short name once it reaches the nav. |
| `cards` | `string[]` | 40 hosted images | Portrait (9:16) pictures, cover-cropped and rounded. Half of them show at once, so pass at least twice as many as you want visible and keep them all different. |
| `sky` | `string` | hosted sunset | Background shown once the arch closes. |
| `links` | `{ label, href }[]` | Work, Components, Notes | Nav links (hidden below 720 px). |
| `headline` | `{ text, underline? }[][]` | two lines | Words with `underline` get an animated underline. |
| `stats` | `{ value, decimals?, suffix?, label }[]` | three figures | Count up at the end of the intro. |
| `loadingLabel` | `string` | `"Loading work"` | Small caps under the loading count. |
| `className` | `string` | | Added to the root. |

A **Replay** button in the nav plays the intro again.

## Timeline (seconds after the pictures are ready)

| Phase | Time |
|---|---|
| Odometer count 000 → 100, top right | 0 – 1.15 |
| Wordmark letters rise in | 0.15 – 0.65 |
| Cards fly up from the bottom centre into the arch, crown first, then down both sides | 0 – 1.75 |
| Sky fades in behind the arch | 2.08 – 2.38 |
| The arch tilts back and opens into a wide arc; cards grow and turn to face you | 2.2 – 3.2 |
| Wordmark shrinks into the nav, surname writes in | 2.3 – 3.3 |
| Page frames the scene, headline rises, stats count up | 3.2 – 4.6 |
| Arc drifts (one card every 2.6 s), drag to spin | from 1.1, eased in |

The arc turns in one direction only and its speed never drops to zero once it starts, and every value of the opening (radius, tilt, card size, lean) moves one way, so there is no pause or reversal at the hand-off.

## Notes

- **Dependencies:** `three` (WebGL). Text and controls are HTML over the canvas.
- **Pictures** load from `https://kedhar-components.pages.dev/halo-arch-hero/`. Pass your own `cards` and `sky` in production; hosts must allow cross-origin image loading (they become WebGL textures).
- The clock starts when the pictures are ready (or after 5 s, whichever is first).
- **Reduced motion:** the opened arc is shown without animation or drift.
- Rendering pauses while the hero is off screen.
- Uses only `--color-background` and `--color-foreground`; the page around the scene follows light and dark.
