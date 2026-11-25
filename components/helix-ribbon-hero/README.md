# Helix Ribbon Hero

A portfolio hero on a flat red field. The name lands letter by letter beside a small portrait. Scrolling pulls the two lines of the name apart while a ribbon of project screenshots, bent around a helix, rises through the screen and spins past. When it has gone, the first six projects slide into a captioned grid, which then scrolls up to show both rows.

- Scroll-pinned: the section is `screens + 1` stage heights tall, and the stage sticks while the story plays.
- The ribbon is built from DOM slices in CSS 3D (four per card, two faces each), so both sides of the ribbon read the right way round. There is no WebGL and no dependency beyond React.
- The headline sits inside the same 3D scene, a little behind the ribbon's front, so the near cards pass in front of the letters and the far ones go behind.
- Scroll input is eased, and the loop sleeps while the section is off screen.
- `prefers-reduced-motion`: no intro, no ribbon and no autoplay. The hero fades out and the grid fades in as you scroll.

## Props

| Prop | Default | |
|---|---|---|
| `height` | `"100svh"` | Stage height. Must be a definite length. |
| `screens` | `5` | Screen heights of scroll the story takes. |
| `greeting` / `name` | `"Hey, I'm"` / `"Kedhar’"` | The two headline lines. |
| `portrait` | catalogue image | Square-ish photo set beside line one. |
| `projects` | 12 placeholder sites | `{ src, title }`. Up to 12 ride the ribbon; the first 6 fill the grid. Screenshots about 3:2. |
| `brand`, `links`, `cta` | Kedhareswer, Home / Services / About / Contact, Book a call | Navigation. |
| `count`, `bio`, `scrollHint` | | The small copy around the headline. |
| `background` / `foreground` | `#f2140c` / `#f7f3ee` | The scene's own palette. It uses no theme tokens. |
| `autoPlay` | `false` | Loops the scroll story for an unattended preview, starting only from the top. Any wheel, touch, key or scroll hands control back. |
| `fontHref` | Google Fonts (Anton, Inter Tight) | Pass `null` to load the faces yourself. |

## Assets

The twelve screenshots and the portrait are generated placeholders served from `https://kedhar-components.pages.dev/helix-ribbon-hero/`. Replace `projects` and `portrait` with your own.
