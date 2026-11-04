# Bending Strip Carousel

A scroll-driven project strip. A row of narrow photo panels runs sideways as the page scrolls down past it. At rest the strip lies flat; the faster you scroll, the harder it bends round into a drum, the outer panels turning in and sinking away. When you stop it eases back flat. Panels sit in grayscale and the centred one takes its colour back, with the title and counter rising in below.

Click any panel and it opens out of its own spot into a full project view: photo, title, summary, client, year, role and a case-study link. Inside the view, the arrows (or arrow keys) step through projects and Esc or Close folds it back into the strip. With the strip focused, the arrow keys scroll to the next or previous project. The strip loops, so it never ends in empty space.

```tsx
import BendingStripCarousel from "@/components/ui/bending-strip-carousel"

<BendingStripCarousel
  brand="Northwall"
  projects={[
    { title: "Glass Canyon", client: "Halden Towers", year: "2026", role: "Identity, film", summary: "A launch film…", href: "/work/glass-canyon", image: "/glass-canyon.webp" },
    { title: "Mint Hours", client: "Oro Studio", year: "2025", image: "/mint-hours.webp" },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `projects` | required | `{ title, image, alt?, client?, year?, role?, summary?, href? }[]`. Tall portrait crops (about 2:3) suit both the strip and the open view. |
| `brand` | `"Northwall"` | Wordmark, top left. |
| `note` | `"Selected work, 2019 — 2026"` | Small line, bottom left. |
| `bend` | `1` | How far the strip bends at full scroll speed. `0` keeps it flat. |
| `scrollPerProject` | `0.22` | Page scroll per project, as a fraction of `height`. |
| `background` / `ink` / `accent` | `#121110` / `#ece6dc` / `#d4643f` | Stage, text and accent colours. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |
| `onOpen` | none | `(project, index)` when a project view opens. |

The section is `height` tall plus the scroll it needs, and its stage sticks while you scroll through it. Titles use Instrument Serif Italic (OFL), subset to Latin and embedded (about 20 KB). The frame loop runs only while the strip is moving and on-screen, and it reads no layout: sizes come from a `ResizeObserver`, and the scroll and its speed from ScrollTrigger.

With `prefers-reduced-motion`, the strip follows the scroll without bending or easing, panels don't drop in, and the project view fades instead of growing.

Needs `gsap` (with ScrollTrigger).
