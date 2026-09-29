# Isometric Vault Hero

A dark landing hero for a data-security product. Top nav, a two-line headline,
two calls to action, and on the right a line-drawn isometric machine: raw
records ride a conveyor into a bolted vault, get scanned in the glass chamber
on its lid, and leave through the front slot either **sealed** (an accent chip
on the lid) or **pushed off onto a quarantine lane**.

```tsx
import IsometricVaultHero from "@/components/ui/isometric-vault-hero"

<IsometricVaultHero brand="sealwise" accent="#ff6a2b" />
```

**No dependencies beyond React, and no network requests.** The machine is SVG
built from numbers: no images, no fonts to load.

## Dark only

There is no light mode. The component paints its own background, sets
`color-scheme: dark`, and never reads the host's theme tokens or
`prefers-color-scheme`, so it looks the same on a light page, a dark page, and
in both 21st previews. To rebrand it, change the palette props, which are all
dark palettes by design.

## It is a toy, not a picture

| Where | What it does |
|---|---|
| **FLOW** slider on the control plate | Belt speed from x0.25 to x2.5. The gauge needle follows it. |
| **GUARD** slider | How much gets quarantined, from 0 up to about 30% of records. |
| The vault | Hover (or focus) and the lid lifts. Click (or Enter) for a scan pulse: rings on the plate and a short burst of speed. |
| "See How It Works" | A three-step walkthrough (Ingest, Validate, Secure). The stage being explained stays lit and the rest dims. It advances on its own; the numbered markers on the scene and the progress bars jump to a step. |
| Nav | Items with `items` open a dropdown. Escape or a click outside closes it. |
| Readout, bottom right | SECURED and QUARANTINED really count: they tick up as records cross the vault. |

Both sliders are real `role="slider"` controls. You can drag them, and they
also take the arrow keys (Shift for bigger steps) and Home/End. Records keep
the verdict they got when they crossed the vault, so dragging GUARD never makes
a record that's already out on the belt jump between lanes.

## Props

| Prop | Default | Description |
|---|---|---|
| `brand` | `"sealwise"` | Wordmark in the middle of the nav |
| `navLinks` | Industries, Pricing, Resources | Left nav links. `items: [{ label, href, description }]` makes a dropdown |
| `utilityLinks` | Explore, Sign in | Plain links on the right |
| `navCta` | `{ label: "Get Started" }` | The chip at the far right |
| `eyebrow` | `"Pipeline guard · live"` | Line above the headline. Empty hides it |
| `headline` | `"AI That Keeps\nData Secured."` | `\n` breaks the line. A trailing `.` or `!` is painted in the accent |
| `subtitle` | Real-time cleaning, validation, and monitoring in one hub. | |
| `primaryCta` | `{ label: "Start now" }` | Link button. Also fires `onPrimaryClick` |
| `secondaryCta` | `"See How It Works"` | Label of the walkthrough toggle |
| `steps` | Ingest / Validate / Secure | Exactly three `{ title, body }` |
| `accent` | `#ff6a2b` | Chips, gauge, scan beam, active states |
| `ink` | `#efe4d2` | Line work and text |
| `background` | `#0f0d0b` | Page background |
| `surface` | `#231d17` | Top faces of the machinery. The side faces are shaded from it |
| `speed` | `1` | Initial belt speed, 0.25 – 2.5 |
| `strictness` | `0.4` | Initial GUARD, 0 – 1 |
| `securedStart` | `128400` | Where the SECURED counter starts |
| `fontFamily` | system sans | Stack for the copy. The readouts use the system monospace |
| `height` | `"100svh"` | A definite length, never a percentage |
| `className` | `""` | Extra root class names |
| `onPrimaryClick` | – | Click handler for the primary button |

`demo-verdant.tsx` shows the same machine fully rebranded: different wordmark,
copy, steps, a green palette, and a stricter guard.

## How it's drawn

A true 30° isometric projection, `iso(x, y, z) → [(x − y)·cos30, (x + y)·sin30 − z]`.
Boxes are three polygons (top, +x face, +y face), and anything flat on a
surface, like the lid chips, the gauge, slider tracks, the slot and the LED
row, is drawn in 2D inside an SVG `matrix()` that lays it onto that plane.
The test checks those matrices against `iso()` itself.

Painter's order does the hidden-surface work. Records entering from upstream
are drawn before the vault, so its body hides them. Records leaving are drawn
after it, **truncated to the part that has cleared the front face**, so they
really do come out of the slot instead of popping in front of it.

Record *k* sits at `x = pos − k·SPACING`, so there is no wrapping and no pool:
the visible set is just a range of *k*. The counters use the same maths,
`crossings(prev, next)`, and the test checks that counting frame by frame gives
the same result as one big jump.

## Install safety

- The root takes its height from the `height` prop and is a CSS size container.
  The layout, which moves the machine under the copy on narrow widths, uses
  container queries, not viewport media queries.
- Every selector in the inline `<style>` is scoped under `.ivh`. There is no
  `@import` and no global reset. The stage SVG sets `max-width: none` against
  Preflight.
- SVG ids come from `React.useId()`, so two heroes on one page don't share
  gradients or clip paths.
- The frame loop pauses while the hero is off-screen (IntersectionObserver).
  Every listener, observer and timer is cleaned up on unmount.
- `prefers-reduced-motion`: there is no frame loop, and the entrance and ping
  animations are off. The machine renders as a still frame that still
  responds: the sliders, the lid, the pulse and the walkthrough all work, and
  the walkthrough doesn't advance on its own.
