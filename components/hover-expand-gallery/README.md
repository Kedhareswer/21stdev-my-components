# Hover Expand Gallery

A row of hairline-separated panels with vertical labels. Hover (or tap) one and
it absorbs the free space, revealing its image; the rest stay rail-width. Below
1024px the same list becomes a vertical accordion — tapping a row opens its
image above the label.

Self-contained: Tailwind utilities only, no CSS file, no local imports, no npm
dependencies beyond React. The open/close motion is a CSS `flex-grow`
transition, so there is no animation library to install.

## Usage

```tsx
import HoverExpandGallery from "@/components/ui/hover-expand-gallery"

<HoverExpandGallery />                          // full viewport, gradient panels
<HoverExpandGallery items={projects} />         // your own images
<HoverExpandGallery height="40rem" />           // inside a page section
```

It sizes itself — no wrapper height needed. Do not pass `height="100%"` unless
every ancestor up to `<html>` has a definite height; the desktop row is
percentage-based below the root and collapses to 0px without one.

## Items

```ts
type HoverExpandItem = {
  title: string     // the rotated label. Keep it short — the rail clips it.
  meta?: string     // small label at the top of the open panel: a year, a client
  src?: string      // image URL. Omit it and `accent` shows instead.
  alt?: string
  accent?: string   // any CSS background — a gradient, a solid. Also the colour
}                   // behind the image while it decodes.
```

The default items ship **gradients, not photos**, on purpose: no external
origin means `21st render` can generate a cover and the component draws
correctly on first install. `demo-photos.tsx` shows the real shape.

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | 12 gradient panels | |
| `height` | `"100svh"` | **Must be a definite length.** Desktop only — below 1024px the accordion sizes itself. |
| `railWidth` | `64` | Width of a closed panel, and of the label rail. |
| `maxOpenWidth` | `520` | Cap on the open panel. Without it a short list opens into a near-square block; the row centres in whatever is left. |
| `mobileImageHeight` | `420` | Height of the open image below 1024px. |
| `defaultIndex` | `0` | Which panel starts open. One is always open. |
| `duration` | `620` | ms. |
| `onChange` | — | `(index, item)` when the open panel changes. |
| `className` | — | |

## Notes

- **Item count sets the proportions.** The open panel takes the free space, so
  keep `items.length * railWidth` comfortably under 1024px — past that the row
  squeezes rather than opening. 12–15 items at the default rail is the range
  this was built for.
- The breakpoint is `lg` (1024px), not `md` — at 768px a horizontal row of
  rails has no room left to open into.
- Panels are `<button>`s, so Tab moves through them and focus opens a panel;
  `prefers-reduced-motion` drops every transition.
- Assumes the semantic Tailwind tokens `background`, `foreground`, `border`.
  Works in both themes — the images carry the colour.

## Credit

A re-creation of Skiper UI's [Hover Expand](https://skiper-ui.com/v1/skiper35),
rebuilt from the rendered page rather than its source: CSS transitions instead
of framer-motion, an explicit accordion breakpoint, and a capped open panel.
