# Badge Strip Footer

The bottom of the Bunkum Studio template, on its own. A rolling strip of round illustrated badges runs across a speckled cobalt ground. Below it sits a legal row with a hand-drawn signature, a © line and a back-to-top button.

## Interactions

- **The strip.** Badges scroll right to left in a seamless loop, one full row every 46 seconds. Each one leans a little (−8°, −4°, 0°, 4°, 8°, repeating). The row is rendered twice so the loop never shows a seam.
- **Back to top.** Scrolls the window to the top, smoothly. Pass `onBackToTop` to do something else, such as scrolling a container.
- **Context label.** With a mouse, a small pill next to the cursor says "Wheee" over the back-to-top button. It only exists where `(hover: hover) and (pointer: fine)` matches. Touch never drives it. The system cursor stays as it is.
- Below 640 px wide, the legal row stacks.

**Reduced motion.** With `prefers-reduced-motion: reduce`, the strip stands still, transitions are instant, and back to top jumps instead of gliding.

## Usage

```tsx
import BadgeStripFooter from "@/components/ui/badge-strip-footer"

<BadgeStripFooter height="420px" copyright="© 2026 Your Studio" />
```

## Props

| Prop | Default | |
|---|---|---|
| `badges` | the 18 template drawings | Image URLs for the round badges. Square pictures work best. |
| `copyright` | "© 2026 Bunkum Studio · drawn by hand, mostly" | The middle of the legal row. |
| `signatureLabel` | `"Bunkum signature"` | Accessible name of the signature drawing. |
| `backToTopLabel` | `"Back to top ↑"` | Text of the button. |
| `onBackToTop` | scroll the window to the top | Replaces the default behaviour. |
| `height` | `"420px"` | **Minimum** height of the footer, applied as `min-height`. It must be a definite length. The strip and the legal row sit at the bottom. For a compact footer, pass something like `"420px"`. |
| `className`, `style` | | Applied to the root `<footer>`. |

The colours are the template's Cobalt palette, set as custom properties on the root: `--blue` (ground), `--butter` (text and signature), `--ink` (badge rims), `--deep` and `--paper`. Override them through `style` to recolour it.

## Pictures and fonts

The eighteen square illustrations from the template are served full-size from `https://kedhar-components.pages.dev/bunkum/` (embedding them would push the file past 21st's 200 kB limit); to self-host, copy them and change `IMG_BASE` at the bottom of the file. Each picture is set once as a CSS custom property on the root, so the strip's second copy doesn't fetch it again. Pass `badges` to use your own.

Text uses subsets of **Inter Tight** 400 and **JetBrains Mono** (capitals), embedded as woff2 and renamed `BkmSans` and `BkmMono` as their SIL OFL 1.1 licence asks. The back-to-top button is set in `BkmSans`, as in the template, because its `font: inherit` overrides the mono face.

It needs nothing beyond React and Tailwind's base styles.
