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
- Each quote's type is fitted to its tile (largest size that fits, refitted on resize), so
  a long quote never clips at any height.
- Every quote on a page shares one type size, so the two rows read as a set.
- Narrow containers (under `stackBelow`, 720px by default) show one stacked pair. Quote and
  photo still trade places each step, under a field-coloured sweep that crosses the pair in
  the swipe direction.
  The stacked layout is a CSS container query, so it follows the component's own width and
  the first paint on a phone is already stacked.
- Photos are optional. A testimonial without one (or whose photo fails) gets a plate in the
  preset's third tone carrying a logo, a figure from the story, or the person's initials, so a
  text-only quilt still reads as four tiles (see `demo-text-only.tsx`).
- The first page's portraits load eagerly; later pages are lazy and preloaded one step ahead.
  Unsplash URLs get a 600/1200/1800w `srcset`.

No dependencies. Styles are scoped to `.cqt` in one inline `<style>`.

## Props

| Prop | Default | |
|---|---|---|
| `testimonials` | 6 physio-clinic patients | `{ quote, name, context?, photo?, alt?, focus?, logo?, stat? }[]`. Without a photo, the plate shows `logo` (an image URL), else `stat` (`{ value, label }`), else initials. `focus` is a CSS `object-position`. Quotes up to about 240 characters; the type steps down for long ones. |
| `heading` | "Back on their feet, in their own words." | Any node. Pass `null` to drop it (then `ariaLabel` names the section). |
| `cta` | none | `{ label, href?, onClick? }`, shown in the heading band. |
| `preset` | `"bottle"` | `bottle` (green / butter), `oxblood` (wine / blush), `marigold` (ink / marigold), `mint`, `cobalt`. |
| `palette` | none | Override any of `fieldA inkA fieldB inkB band bandInk plate plateInk`. `plate` is the third tone behind portraits. |
| `rows` | `2` | Pairs per step on a wide container. `1` gives a single wide pair. |
| `autoplay` | `8000` | ms per step. `0` turns it off. |
| `defaultPage` | `0` | Page shown first. |
| `height` | `clamp(560px, 76cqi, 1180px)` | Height of the quilt on a wide container. Follows the component's width, so tiles stay near 4:3 like portraits. |
| `mobileHeight` | `min(700px, calc(100svh - 120px))` | Height of the stacked pair on a narrow container. |
| `stackBelow` | `720` | Container width in px below which it stacks. |
| `quoteFont` / `uiFont` | system serif / system sans | Pass your own stacks, e.g. `"var(--font-serif)"`. |
| `onChange` | none | Called with the page index after each step. |
| `className`, `style`, `ariaLabel` | | |

## Demos

- `demo.tsx`: a physio clinic, bottle preset, two rows, with photos.
- `demo-wine-bar.tsx`: a wine bar's regulars, oxblood preset.
- `demo-text-only.tsx`: a finance product with no photos (figures on the plates), mint preset, autoplay off.

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
