# Halo Ring Hero

A portfolio intro told as one camera move. A loading count rolls in like an odometer while your work, as a ring of portrait cards, assembles card by card. When the ring closes, a sunset sky fades in behind it and the camera dives through the open top until you stand inside the ring, looking across it. The page then frames itself around the scene: a nav, a two-line headline with underlined words, and three stats that count up. The ring keeps turning; drag it to spin it.

The same card objects persist from the first frame to the last, and one clock drives everything (camera, cards, sky, counter and page). Nothing swaps or crossfades between two different pictures.

## Usage

```tsx
import { HaloRingHero } from "@/components/ui/halo-ring-hero"

export default function Page() {
  return <HaloRingHero />
}
```

```tsx
<HaloRingHero
  height="100svh"
  name="Kedhar"
  nameSuffix=" Naidu"
  cards={["/work/01.webp", "/work/02.webp" /* 16 to 32 portrait images */]}
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
| `cards` | `string[]` | 24 hosted images | Portrait (9:16) pictures; they are cover-cropped and rounded. |
| `sky` | `string` | hosted sunset | Background shown once the ring closes. |
| `links` | `{ label, href }[]` | Work, Components, Notes | Nav links (hidden below 720 px). |
| `headline` | `{ text, underline? }[][]` | two lines | Words with `underline` get an animated underline. |
| `stats` | `{ value, decimals?, suffix?, label }[]` | three figures | Count up at the end of the intro. |
| `loadingLabel` | `string` | `"Loading work"` | Small caps above the loading count. |
| `className` | `string` | | Added to the root. |

A **Replay** button in the nav plays the intro again.

## Timeline (seconds after the pictures are ready)

| Phase | Time |
|---|---|
| Wordmark letters rise in | 0 – 0.65 |
| Odometer count 000 → 100 | 0.05 – 0.8 |
| Cards build the ring (fast up the right side, even across the back, quick close at the front-left) | 0.1 – 1.87 |
| Sky fades in behind the ring | 2.02 – 2.45 |
| Camera dives in through the open top | 2.0 – 2.85 |
| Wordmark shrinks into the nav, surname writes in | 2.2 – 3.4 |
| Page frames the scene, headline rises, stats count up | 3.15 – 4.6 |
| Ring spins (one card every 0.9 s), drag to spin | from 3.0 |

The ring turns in one direction only and its speed never drops to zero, from the first card to the idle spin, and the camera keeps moving from the build into the dive, so there is no pause at the hand-off.

## Notes

- **Dependencies:** `three` (WebGL). Text and controls are HTML over the canvas.
- **Pictures** load from `https://kedhar-components.pages.dev/halo-ring-hero/`. Pass your own `cards` and `sky` in production; hosts must allow cross-origin image loading (they become WebGL textures).
- The clock starts when the pictures are ready (or after 5 s, whichever is first).
- **Reduced motion:** the final inside-the-ring state is shown without animation or spin.
- Rendering pauses while the hero is off screen.
- Uses only `--color-background` and `--color-foreground`; the page around the scene follows light and dark.
