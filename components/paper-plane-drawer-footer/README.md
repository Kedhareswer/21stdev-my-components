# Paper Plane Drawer Footer

A site footer that is the front of a desk drawer. Bring the cursor up to its handle and the drawer slides out over the desk strip above it, showing a pile of letters, envelopes and a notebook inside. A paper plane glides in and lands on the pile. Each time you open the drawer, one more plane joins them. Below the handle are the usual link columns, and the name is pressed into the paper along the bottom.

## Interactions

- **Opening by proximity (mouse).** The drawer comes out as soon as the pointer is anywhere over the desk strip, on the handle, or just under it (up to 28 px below the handle). Drop to the link rows, or leave the footer, and it goes back in after 120 ms.
- **The handle** is a real `<button>` with `aria-expanded`. Touch, keyboard and pen users open and close the drawer with it. A mouse click toggles it too: clicking while the drawer is out pushes it in, and it stays in until the cursor leaves the handle zone and comes back.
- **The drawer.** These timings were measured off the reference video at 60 fps:
  - Opening takes 630 ms. The front lifts 5 px as it unseats. Then the drawer's box grows upward from the front's top edge, and the pile rises into view from behind the front. The front ends 20–48 px lower, about 3 % of the width.
  - Closing takes 370 ms. It's the same curve played backwards, so it ends with the same small lift and seat.
  - The handle crossfades from a dark recess to a cream pull with the mark on it. Both skins have the same geometry.
  - The pressed name stays put while the front's top edge travels, so the front reads as tipping toward you.
- **Planes.** 450 ms after the drawer starts to open, one plane leaves from outside the drawer and glides for 1.2 s along a curve to its landing spot:
  - The first comes in over the top-left and lands right of centre. The second comes in low from the left and lands near the front.
  - The nose leans into the path (at most ±26°) and settles flat at the end.
  - The plane's shadow starts far below it and slides in under it as it comes down.
  - Planes stay where they land. There are five spots. Once they're all used, the oldest plane is recycled while the drawer is shut (never in view) and flies in again on the next opening.
- **Reduced motion.** With `prefers-reduced-motion: reduce`, the drawer jumps straight open or shut, and each new plane is simply there, already landed.

## Usage

```tsx
import PaperPlaneDrawerFooter from "@/components/ui/paper-plane-drawer-footer"

<PaperPlaneDrawerFooter
  brand="Northfold"
  copyright="© 2026 Northfold"
  tagline={"Keeping every\nloose page in order."}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `brand` | `"Northfold"` | The name pressed into the bottom. It's stretched to the column width (SVG `textLength`). |
| `copyright` | `"© 2026 Northfold"` | The red small-caps line. |
| `tagline` | `"Keeping every\nloose page in order."` | Under the copyright line. `\n` breaks the line. |
| `columns` | Product / Company / Legal | `{ title, links: { label, href, external? }[] }[]`. External links open in a new tab and get a `↗`. |
| `drawerImage` | the drawer picture on kedhar-components.pages.dev | The drawer's contents: wide, with the back wall in the top third. It's cropped with `object-fit: cover` at `50% 22%`. |
| `defaultOpen` | `false` | Start with the drawer out (pinned), with the first plane on its way. |
| `onOpenChange` | | Called with `true` / `false` whenever the drawer starts to open or close. |
| `height` | `"100svh"` | **Minimum** height of the whole footer. It must be a definite length. |
| `drawerHeight` | `"clamp(200px, min(30vw, 42svh), 520px)"` | Height of the desk strip the drawer comes out of. It must be a definite length. |
| `className`, `style` | | Applied to the root `<footer>`. |

## Theme

Everything is mixed from the semantic tokens `--color-background`, `--color-foreground` and `--color-muted-foreground`, so in dark mode the paper turns a dark warm brown. The drawer's contents and the planes stay paper-coloured. To recolour the footer, override these on the root through `style`:

- `--ppd-face`: the front;
- `--ppd-desk`: the desk strip;
- `--ppd-hi` / `--ppd-lo`: the pressed-in light and shade;
- `--ppd-accent`: the copyright line.

## Picture

`drawer.webp` (1942×809, 125 KB) is a ChatGPT-generated image of a drawer full of blank stationery. It's served from `https://kedhar-components.pages.dev/paper-plane-drawer-footer/` (the source lives in `dev/public/paper-plane-drawer-footer/`). To self-host it, copy it and change `IMG_BASE` near the top of the props section, or pass `drawerImage`.

No dependencies beyond React. The planes, the contour lines, the mark and the pressed name are inline SVG; the name uses the system serif.
