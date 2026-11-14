# Scrap Wall Archive

A pinned archive stage, lifted from the Bunkum Studio template. It opens in preview mode: one large card, a row of small scraps either side and a caption pill. Scroll and it zooms out into an endless wall of scraps that keeps panning as you scroll.

## Interactions

- **Scroll.** A little way into the track the preview zooms out to the wall (450 ms). The wall then pans down many rows as you keep scrolling, and the counter bottom right runs from `Scrap 0001 / 1204` to `1204 / 1204`. Scroll back to the top and the preview returns.
- **Drag** (mouse). Pan the wall in any direction. Touch scrolls the page as normal.
- **Click a scrap** on the wall to bring it back to the preview. In the preview, the small scraps swap into the big card, and the big card opens a lightbox (arrow keys step through, Escape closes).
- **Context label.** On a mouse, a small pill follows the pointer and names what a click will do ("Look closer", "Show", "Open"). The system cursor stays.

## Props

| Prop | Default | |
|---|---|---|
| `items` | 18 embedded illustrations | `{ src, name }[]`. Square art reads best; the wall crops each scrap to one of a few shapes. The wall's picture order steps 7 per column, so a set of 7 (or 1) repeats down whole columns; 8 or more reads best. |
| `title` | `"Archive"` | Heading, bottom left. |
| `height` | `"100svh"` | Height of the pinned stage. The track is 3.4 stages tall. Keep it a definite length. |
| `className`, `style` | none | Passed to the root. |

```tsx
import ScrapWallArchive from "@/components/ui/scrap-wall-archive"

<ScrapWallArchive
  title="Sketchbook"
  items={[
    { src: "/scraps/fox.webp", name: "Fox in a hat" },
    { src: "/scraps/kettle.webp", name: "Kettle face" },
  ]}
/>
```

## Motion

Same constants as the template: preview to wall in 450 ms; grid pitch 1/13.5 of the width on a desktop (1/8 under 1000 px, 1/4.5 under 640 px); rows 1.75 pitches apart; the scroll and the drag ease toward their targets with τ = 80 ms and 90 ms. A fixed pool of 16 × 10 cells wraps round to tile forever, and each cell's picture is chosen so no two neighbours match.

The frame reads layout once (the root's box). Sizes are measured on resize only, and the loop sleeps when the archive is off screen. The context label only exists where `(hover: hover) and (pointer: fine)` matches.

With `prefers-reduced-motion`, the archive shows a still wall (scroll doesn't pan it, drag moves it without easing) and transitions are instant.

## Pictures and fonts

The eighteen default illustrations were generated for the Bunkum template with ChatGPT's image model. They're embedded as compressed WebP data URIs (about 520 KB), so the component makes no network requests. Each picture is set once as a CSS custom property on the root, so a scrap that appears many times on the wall doesn't copy the data. Pass `items` to use your own.

Text uses subsets of **Inter Tight** (400 and 700) and **JetBrains Mono** (capitals), both SIL Open Font License 1.1, embedded as base64 woff2 and renamed (`BkmSans`, `BkmMono`) as the licence asks of modified copies.

No dependencies beyond React.
