# Glass Fan Testimonials

A featured-reviews section. Each quote is a white card set in a square pane of frosted glass.
The panes overlap in a fan, and each one leans a little more than the one in front of it. The
front pane is on the right, flat and on top, and you can see the panes behind it, softened,
through its glass.

**The shuffle:** next lifts the front pane off to the right and tucks it behind the fan, while
the others step forward and straighten. Prev pulls the back pane out and lays it on top.
Clicking a pane further back shuffles it to the front, one card at a time.

- Hovering a pane opens the fan around it and lifts it. The pane tilts towards the pointer,
  and a glare follows the cursor across the glass.
- Prev / next, a `02 / 06` counter, and an avatar strip that jumps to a person the short way
  round. `←` / `→` / `Home` / `End` work on the focused fan, and you can swipe on touch.
- Autoplay draws a progress ring on the next button. It pauses on hover, on keyboard focus,
  when the fan is off screen, in a hidden tab, and with the pause button. Under
  `prefers-reduced-motion` it is off and steps swap without travel.
- Every quote uses one type size: the largest that fits the fullest card. No quote is clipped,
  and the cards read as a set.
- The fan follows its own width. On a phone it closes up into a deck, and the front card goes
  opaque so the cards behind can't muddy it.
- `theme="auto"` uses the host's `.dark` class and its `--color-foreground` /
  `--color-muted-foreground` on a transparent background. `"light"` and `"dark"` paint their own.
- If an avatar has no photo, or the photo fails, it shows initials.

No dependencies. Styles are scoped to `.gft` in one inline `<style>`.

## Props

| Prop | Default | |
|---|---|---|
| `testimonials` | 6 clients of a design studio | `{ quote, name, role?, photo?, alt?, rating? }[]`. Quotes up to about 200 characters at the default size. Longer ones still fit, but every card's type steps down with them. |
| `eyebrow` | "Featured reviews" | Small caps line. `null` drops it. |
| `heading` | "Client highlights" | Any node. `null` drops it (then `ariaLabel` names the section). |
| `summary` | none | `{ rating, label? }`: five partly filled stars plus "4.9 from 120+ client reviews". |
| `visible` | `3` | Panes in the fan (2 to 6). The rest wait behind it. |
| `tilt` | `10` | Degrees the back pane leans. The panes in between lean less (the reference's 0 / -6 / -10). |
| `cardSize` | `340` | Edge of the glass pane in px. Shrinks to fit narrow containers. |
| `theme` | `"auto"` | `auto`, `light`, `dark`. |
| `palette` | none | Override any of `paper ink muted line accent surface`. `accent` colours the stars and the autoplay ring. |
| `backdrop` | `"dots"` | `dots`, `grid` or `none`: the pattern behind the fan that the glass softens. |
| `autoplay` | `6500` | ms per step. `0` turns it off. |
| `defaultIndex` | `0` | Testimonial at the front first. |
| `height` | pane size × 1.12 + 112px | Height of the stage. Always a definite length. |
| `showAvatars` | `true` | The avatar strip under the fan. |
| `fontFamily` | inherits | e.g. `"var(--font-geist-sans)"`. |
| `onChange` | none | Called with the new front index. |
| `className`, `style`, `ariaLabel` | | |

## Demos

- `demo.tsx`: a design studio's clients, light glass on dots, three panes, with a rating summary.
- `demo-midnight.tsx`: a developer platform's customers, dark theme, grid backdrop, four panes
  leaning 14°, a lime accent, and one reviewer without a photo (initials).

## Usage

```tsx
import GlassFanTestimonials from "@/components/ui/glass-fan-testimonials"

<GlassFanTestimonials
  heading="Loved by teams who ship"
  summary={{ rating: 4.9, label: "from 120+ reviews" }}
  visible={4}
  palette={{ accent: "#f97316" }}
  testimonials={[
    { quote: "…", name: "Ana Ruiz", role: "CTO, Fieldwork", photo: "/people/ana.jpg", rating: 5 },
    // …
  ]}
/>
```

## Photos

The default avatars are Unsplash portraits (Unsplash License), loaded from
`images.unsplash.com` at avatar size: `photo-1438761681033-6461ffad8d80`,
`photo-1472099645785-5658abf4ff4e`, `photo-1494790108377-be9c29b29330`,
`photo-1507003211169-0a1dd7228f2d`, `photo-1544005313-94ddf0286df2`,
`photo-1500648767791-00dcc994a43e`. The midnight demo adds `photo-1534528741775-53994a69daeb`,
`photo-1506794778202-cad84cf45f1d`, `photo-1517841905240-472988babdf9`,
`photo-1539571696357-5a69c17a67c6` and `photo-1580489944761-15a19d654956`. The names, companies
and quotes are fictional placeholders, so replace them with your own customers.
