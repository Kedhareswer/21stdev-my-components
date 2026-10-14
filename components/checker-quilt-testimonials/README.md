# Checker Quilt Testimonials

A testimonials section laid out as a full-bleed checkerboard. Each row pairs a quote,
set large on a solid colour field, with a portrait of the person who said it. Two rows
sit diagonally, so the fields and faces alternate like a quilt.

**The step:** each row's field sweeps across and covers the old portrait, then pulls
back to the other side and shows the new one, which settles from a slightly tight crop.
The fields trade places, so the checkerboard inverts every step.

- Prev / next, a `02 / 03` counter, and autoplay with a progress line. Autoplay pauses
  on hover, on keyboard focus, in a hidden tab and with the pause button. It is off under
  `prefers-reduced-motion`, where steps swap instantly.
- `←` / `→` on the focused quilt, and swipe on touch.
- Narrow containers (under `stackBelow`, 720px by default) show one quote-over-photo pair
  that sweeps vertically. The layout follows the component's own width, not the viewport.
- A portrait that is missing, loading or blocked leaves a monogram plate in a mix of the
  two field colours, so the quilt still looks designed.

No dependencies. Styles are scoped to `.cqt` in one inline `<style>`.

## Props

| Prop | Default | |
|---|---|---|
| `testimonials` | 6 physio-clinic patients | `{ quote, name, context?, photo?, alt?, focus? }[]`. `focus` is a CSS `object-position`. Quotes up to about 240 characters; the type steps down for long ones. |
| `heading` | "Back on their feet, in their own words." | Any node. Pass `null` to drop it (then `ariaLabel` names the section). |
| `cta` | none | `{ label, href }`, shown in the heading band. |
| `preset` | `"bottle"` | `bottle` (green / butter), `oxblood` (wine / blush), `marigold` (ink / marigold), `mint`, `cobalt`. |
| `palette` | none | Override any of `fieldA inkA fieldB inkB band bandInk plate plateInk`. |
| `rows` | `2` | Pairs per step on a wide container. `1` gives a single wide pair. |
| `autoplay` | `8000` | ms per step. `0` turns it off. |
| `height` | `clamp(560px, 84svh, 940px)` | Height of the quilt on a wide container. |
| `mobileHeight` | `760px` | Height of the stacked pair on a narrow container. |
| `stackBelow` | `720` | Container width in px below which it stacks. |
| `quoteFont` / `uiFont` | system serif / system sans | Pass your own stacks, e.g. `"var(--font-serif)"`. |
| `onChange` | none | Called with the page index after each step. |
| `className`, `style`, `ariaLabel` | | |

## Usage

```tsx
import CheckerQuiltTestimonials from "@/components/ui/checker-quilt-testimonials"

<CheckerQuiltTestimonials
  preset="oxblood"
  heading="What our guests remember."
  cta={{ label: "Reserve a table", href: "/book" }}
  testimonials={[
    { quote: "…", name: "Ana Ruiz", context: "Anniversary dinner", photo: "/guests/ana.jpg", focus: "50% 30%" },
    // …
  ]}
/>
```

## Photos

Default portraits are from Unsplash (Unsplash License), loaded from `images.unsplash.com`:
`photo-1438761681033-6461ffad8d80`, `photo-1472099645785-5658abf4ff4e`,
`photo-1494790108377-be9c29b29330`, `photo-1507003211169-0a1dd7228f2d`,
`photo-1544005313-94ddf0286df2`, `photo-1500648767791-00dcc994a43e`. The names, quotes
and clinic are fictional placeholders: replace them with your own customers and photos.
