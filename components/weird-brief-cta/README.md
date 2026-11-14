# Weird Brief CTA

The closing call to action from the Bunkum Studio template, on its own. A huge "Got a weird brief?" headline on a speckled cobalt ground, a line of copy, a magnetic "Start a commission" pill, a ghost pill that copies your email address, and a fan of three illustrated cards with a sticker that spreads out on hover.

## Interactions

- **Magnetic pills.** With a mouse, each pill leans toward the pointer by 22% of the distance horizontally and 32% vertically. The label inside the pill moves a further 12% / 16% on top, so it floats inside the pill. While you're over a pill it tracks linearly in 100 ms. When you leave, it springs back over 550 ms (`cubic-bezier(.2,1.6,.4,1)`).
- **Copy the address.** The ghost pill writes `email` to the clipboard and a butter-coloured toast slides up from the bottom of the screen ("Copied. We reply within two sleeps."). If the clipboard isn't available, the toast shows the address instead.
- **The fan.** Hover or focus it and the three cards spread to the sides and lift, while the aubergine sticker slides up from behind (700 ms, `cubic-bezier(.2,1.5,.4,1)`). Click it to open a lightbox of the three drawings. Use ← and → to step through them, and Esc or a click outside to close it. The fan is hidden below 900 px wide.
- **Context label.** With a mouse, a small pill next to the cursor names what each control does ("Let's go", "Copy", "Fan out"). The system cursor stays as it is.

The label and the magnets only exist where `(hover: hover) and (pointer: fine)` matches. Touch input never drives them.

**Reduced motion.** With `prefers-reduced-motion: reduce`, the magnets are off, and every transition and animation (fan, toast, lightbox) is instant.

## Usage

```tsx
import WeirdBriefCta from "@/components/ui/weird-brief-cta"

<WeirdBriefCta
  headline={"Got a weird\nbrief?"}
  email="hello@bunkum.studio"
  commissionAction={{ label: "Start a commission", href: "/contact" }}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `headline` | `"Got a weird\nbrief?"` | The huge headline. `\n` breaks the line. |
| `body` | "Send it over. The odder the better: we reply within two sleeps, with a doodle." | The line under the headline. |
| `email` | `"hello@bunkum.studio"` | Shown on the ghost pill and copied when it's clicked. |
| `commissionAction` | `{ label: "Start a commission" }` | `{ label?, href?, onClick? }`. With `href` it renders a link, otherwise a button. As in the template, the default has no destination, so pass one. |
| `copiedMessage` | "Copied. We reply within two sleeps." | Toast text after a successful copy. |
| `height` | `"480px"` | **Minimum** height of the section, applied as `min-height`. It must be a definite length. Long copy grows the section past it. |
| `minHeight` | (same as `height`) | Alias for `height`. Wins when both are set. |
| `className`, `style` | | Applied to the root `<section>`. |

The colours are the template's Cobalt palette, set as custom properties on the root: `--blue` (ground), `--butter` (type and pills), `--deep` (pill text and card shadows), `--ink` and `--paper`. Override them through `style` to recolour it.

## Pictures and fonts

Three square illustrations (`a3`, `b7`, `b5`) and the aubergine sticker (`s2`) from the template are embedded as WebP data URIs, about 115 KB in total, so nothing is fetched. Text uses subsets of **Inter Tight** 400 and 700 and **JetBrains Mono** (capitals), embedded as woff2 and renamed `BkmSans` and `BkmMono` as their SIL OFL 1.1 licence asks.

It needs nothing beyond React and Tailwind's base styles.
