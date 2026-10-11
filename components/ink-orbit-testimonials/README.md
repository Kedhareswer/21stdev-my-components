# Ink Orbit Testimonials

The testimonials section from `ink-orbit-saas-template`, standalone and
unchanged: a hatched page background, a bracketed frame holding a
snap-scrolling row of quote cards (star rating, drawn quote marks, greyscale
portrait), an arrows-and-dots pager, and a marquee of customer names, each with
a generic drawn mark.

**No dependencies, no assets.** Portraits and marks are inline SVG. React is the
only import. Pass an `avatar` URL per testimonial to use a photo instead.

## Usage

```tsx
import InkOrbitTestimonials from "@/components/ui/ink-orbit-testimonials"

<InkOrbitTestimonials />
<InkOrbitTestimonials
  theme="light"
  tag="Customers"
  title={"Support teams *sleep*\nbetter."}
  testimonials={[{ quote: "…", name: "Hana O.", role: "Support Lead", rating: 5 }]}
  logos={["Brightdesk", "Kinfolk", "Meridian"]}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `theme` | `"auto"` | `light` \| `dark` \| `auto` (prefers-color-scheme). |
| `tag` | `"Testimonial"` | Small label above the title. Empty hides it. |
| `title` | `"Trusted by *Teams*\nWorldwide."` | `*word*` is muted; `\n` breaks the line. |
| `testimonials` | 6 samples | `{ quote, name, role, rating?, avatar? }[]`. `rating` 1–5. |
| `logos` | 7 sample names | Marquee names. `[]` hides the marquee. |
| `marqueeSpeed` | `34` | Seconds per loop. |
| `className` / `style` | — | On the root. |

## Notes

- Cards: 1 per view on phones, 2 from 560px, 3 from 900px of the component's
  own width (container queries, not the viewport).
- The pager wraps: next on the last page goes back to the first. ←/→ work when
  the track is focused.
- The marquee pauses on hover. Names are announced once as a group, not twice.
- `prefers-reduced-motion` stops the marquee and the reveal.
- The marks are generic shapes, never anyone's real logo.
