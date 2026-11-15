# Agent Scan Carousel

A stream of website cards drifts through a glowing scanner line. To the right of the line, each card is the page people see. To the left, the same card has been rewritten as lean semantic markup for AI agents. A "Token reduction" pill on the scanner counts up as each card goes through, and lime and cream pixels shed off the scan front onto the page.

The copy is about Kedhareswer. The cards are his services, home, pricing, case study (Client 1), journal (Clients 2 and 3) and studio pages. The contact is `kedhareswer.12110626@gmail.com`.

**No dependencies.** React is the only import. The cards are plain DOM. One canvas draws the beam and the pixels.

## Interaction

| Input | What happens |
|---|---|
| Idle | The stream drifts left at 48 px/s. The page side is clipped at the scanner and the code side is its complement. |
| Drag | The stream follows the pointer. On release it coasts, then settles back to the drift (relaxes with τ = 0.55 s). Vertical page scroll still works on touch. |
| ← / → | Nudges the stream when it has focus. |
| Reduced motion | No drift and no pixels. The beam and counter are static. Dragging and the arrow keys still move the stream. |

The loop pauses when the carousel is offscreen or the tab is hidden.

## Usage

```tsx
import AgentScanCarousel from "@/components/ui/agent-scan-carousel"

<AgentScanCarousel />
<AgentScanCarousel speed={30} accent="#7cf0ff" ctaColor="#111" />
<AgentScanCarousel cards={[{ label: "Home", face: <MyCard />, markup: "<h1>…</h1>", original: 90000, compressed: 1800 }]} />
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `cards` | six built-in pages | `{ face, markup, notes?, original, compressed, label }`. `face` is drawn at 800 × 500. |
| `eyebrow` / `title` / `titleItalic` / `description` | Kedhareswer copy | Header block. |
| `ctaLabel` / `ctaHref` | "Work with me" / mailto | Set `ctaLabel=""` to hide the button. |
| `counterLabel` | "Token reduction" | |
| `speed` | `48` | Drift in px/s, as measured on the reference. |
| `accent` | `#d8fc3b` | Beam, pixels and pill. |
| `ctaColor` | `#2f4fff` | |
| `height` | `max(100svh, 900px)` | Must be a definite length. |
| `imageBase` | `https://kedhar-components.pages.dev/agent-scan-carousel/` | `sky`, `dusk`, `grass`, `lichen`, `bloom` `.webp`. |
| `fontHref` | Google Fonts (Newsreader, Inter, IBM Plex Mono, Handjet) | Pass `null` to bring your own. |

## Notes

- The photographs were generated with ChatGPT. They are served from the catalog site, so the file stays well under 200 kB.
- Only `--color-background` and `--color-foreground` are assumed. The stage is a warm tint of the background, and the cards keep their own colours in both themes.
- The cards scale down to fit narrow screens, with a 16 px gutter on each side.
