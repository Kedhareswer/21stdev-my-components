# Runway Lookbook

A fashion-house runway page. The collection's looks queue up in depth across
the stage, each one further back smaller, softer and paler. Scroll, and the
front look walks off to the right while the whole queue steps forward and
comes into focus. The look number rolls over, and the product rail beside the
stage scrolls to the pieces of the new look.

The page scroll drives it. The section pins while you scroll through it, one
look per stretch of scroll. When you stop scrolling, it eases onto the nearest
look. With `loop` on (the default) it runs on forever both ways.

```tsx
import RunwayLookbook from "@/components/ui/runway-lookbook"

<RunwayLookbook looks={looks} firstNumber={21} />            // as in the demo
<RunwayLookbook looks={looks} rail={false} />                // the stage only
<RunwayLookbook looks={looks} brand="Studio Nine" title="Resort 2027" fontSrc={null} />
```

```ts
type RunwayLook = { src: string; alt?: string; products?: RunwayProduct[] }
type RunwayProduct = {
  name: string
  price: string
  src?: string                                    // defaults to the look's own image
  crop?: { top: number; bottom: number; x?: number } // slice of the image, fractions of its height
}
```

**Looks want cut-out figures**: transparent PNG or WebP, head to toe, cropped
tight to the figure. Product cards reuse the look's image cropped to the
piece, so one image per look is enough. Give a product its own `src` for a
packshot.

**Dependency: `gsap`** (declared in the root `package.json`). Its
`ScrollTrigger` scrubs the queue's position and snaps it with a
`power2.inOut` ease.

## Props

| Prop | Default | Notes |
|---|---|---|
| `looks` | — | Required. |
| `height` | `"100svh"` | Height of the pinned stage. **Must be a definite length.** The section is this tall plus `scrollPerLook` of it per look. |
| `brand` | `"Maison Halden"` | Top left of the header. |
| `tabs` / `activeTab` | `["Runway", "The House", "Atelier"]` / `0` | Header tabs. Each is a label, or `{ label, href }` for a real link. The current one is set in the foreground; the rest are dimmed and brighten on hover. |
| `nav` / `activeNav` | six categories / `2` (Lookbook) | The category row under the header, same shape as `tabs`. The current one is underlined, and on hover an underline draws in from the edges. On narrow stages the row scrolls sideways with faded edges. `-1` marks none. |
| `onNavigate` | — | Called with `{ kind, index?, label? }` when a tab, category, Login, Search, Wishlist or Cart without an `href` is pressed. |
| `title` / `blurb` | `"Spring Summer 2026"` / a line of copy | Top left of the stage. |
| `firstNumber` | `1` | Number of the first look. |
| `ctaLabel` / `onShopLook` | `"Shop the look"` / — | The link under the look number. Called with the current look's index. |
| `cartCount` | `0` | Shown as `Cart (0)`, or a small filled badge once it's above zero. |
| `rail` | `true` | The product rail. It hides itself on stages narrower than 720 px. |
| `scrollPerLook` | `0.55` | Scroll per look, as a fraction of the stage height. |
| `loop` | `true` | Scroll forever. Past the last look the first walks in again, and up past the first the last comes back. The page can't scroll beyond the section, so use it as the page or a full-screen view. `false` ends at the last look and lets the page carry on. |
| `fontSrc` | embedded Lexend Zetta | URL of a woff2 for the wide capitals. `null` keeps the host font. |
| `onIndexChange` | — | Called with the front look's index. |
| `ariaLabel` / `className` | `"Runway lookbook"` / `""` | |

## Geometry

Measured off the reference and kept as fractions of the stage. The front look
stands 0.79 of the stage tall, centred 0.74 across, feet 0.90 down. The looks
behind stand 0.58, 0.42, 0.32, 0.26 and 0.22 tall. Each one is further left
and higher, and softer and paler (blur up to 2.1 % of the stage height). The
look that has walked off moves to 1.28 across, under the rail. Between slots,
every value interpolates, so the scroll moves the whole queue continuously.

On a stage narrower than 0.9 of its height, the queue tucks left and the
figures shrink to fit. The header tabs and rail hide below 720 px. The category row stays, and
scrolls sideways.

## Interaction

- **Scroll** the page with a wheel, trackpad, touch, keys or the scrollbar.
  Nothing is hijacked. The stage is `position: sticky`.
- **Click** a look in the queue (or Tab to it and press Enter) to scroll it to
  the front.
- **Reduced motion**: the queue follows the scroll with no smoothing and no
  eased snap, the look number swaps without rolling, and the header links
  change colour and underline without transitions.

## Fonts

The wide capitals use Lexend Zetta (SIL Open Font License), weights 200–600,
subset to Basic Latin and embedded as a ~16 KB woff2 data URI, so the
component makes no font request. Body copy uses the host font.

## Demo images

Six free Unsplash photos ([unsplash.com/license](https://unsplash.com/license)),
backgrounds removed and inlined as WebP data URIs, so the demo makes no
off-origin requests. Photo IDs are in a comment in `demo.tsx`.
