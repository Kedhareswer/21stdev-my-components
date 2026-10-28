# Pixel Wordmark Footer

The brand as a huge pixel wordmark, drawn in code one SVG square per pixel. As the footer scrolls into view the pixels gather from a scattered cloud into the word, tied to how much of the footer is showing, so scrolling back scatters them again. Below it: a small mark (the brand's first letter in the same pixel face), a note and a row of links.

**Requires `gsap`.** No font file is loaded. It works inside any scroll container.

```tsx
import PixelWordmarkFooter from "@/components/ui/pixel-wordmark-footer"

<PixelWordmarkFooter
  brand="Frameloom"
  note="Made from a sentence."
  links={[{ label: "Docs", href: "/docs" }, { label: "Back to top", onClick: () => scrollTo({ top: 0 }) }]}
/>
```

## Props

| Prop | Default | What it does |
|---|---|---|
| `brand` | `"Frameloom"` | The big pixel word, and the letter in the small mark. |
| `note` | `"Made from a sentence."` | Beside the mark. |
| `links` | three | `{ label, href?, onClick? }`. With `href` it is a link, without one a button. |
| `color` | white | Wordmark pixel colour. |
| `background` | near-black with a plum glow | Any CSS background. |
| `gather` | `true` | Gather the pixels on scroll. Off: the word is simply there. |
| `className` | | On the root. |

Reduced motion shows the finished word. Part of the Mosaic kit. The full page is `mosaic-prompt-template`.
