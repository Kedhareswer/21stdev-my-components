# Dither Sweep Navbar

An editorial, blueprint-styled header. Hairline-ruled cells, monospace caps, a
wordmark that retracts behind its mark once the page scrolls, and a nav hover
that fills each cell with a chunky left-to-right pixel dissolve.

```
http://localhost:5173/#dither-sweep-navbar          # just the bar, centred, nothing else
http://localhost:5173/#dither-sweep-navbar/strict   # recoloured and rescaled, no CTA
http://localhost:5173/#dither-sweep-navbar/sticky   # pinned: ducks away on scroll down
http://localhost:5173/?dark#dither-sweep-navbar     # the dark check
```

## How the dissolve works

Each cell carries a 24&times;6 grid of `<i>` elements. Every element gets a
`transition-delay` taken from `pixelOrder()` — mostly left-to-right, roughened
by a hash so the leading edge breaks into pixels instead of marching as a clean
wipe. A cell's own fade (`PX_CELL_MS`, 180ms) is long enough that several ranks
are mid-fade at once, which is what makes the front read as grain.

That is the whole animation: no canvas, no rAF loop, no animation library, and
no sprite to download. The ordering is derived from a hash rather than
`Math.random`, so the server and the client agree and hydration stays quiet.

The overlay is sized to a 24:6 aspect ratio and clipped by the cell, so the
pixels stay square whatever shape the cell is. On a standard bar they land at
about 11.6px.

## Sizing

The bar is laid out in a fluid unit (`--dsn-u`) that is re-based at each
breakpoint, so the whole header scales with the viewport instead of reflowing.
It lands on 10px at 1728 / 834 / 393 wide. `scale` multiplies it.

That unit **must** stay in the stylesheet. Setting it inline would outrank the
breakpoint rules and silently shrink the whole bar on phones — the test guards
this.

The bar's own height is intrinsic, taken from the logo block's padding, so
there is no percentage-height chain to collapse in an installed page.

Unpinned (`sticky={false}`) the bar is `position: relative` and insets itself
with a margin, so it occupies its own space and whatever follows starts below
it rather than underneath. Pinned, the same 0.8u inset becomes a fixed offset.

## Props

| Prop | Default | Notes |
|---|---|---|
| `brand` | `"Northmark"` | Wordmark text. Retracts on scroll, returns on logo hover. |
| `logo` | built-in mark | Any node. It is sized by the component. |
| `logoHref` | `"#"` | |
| `items` | 4 sample items | `{ label, href?, children? }`. `children` makes it a submenu cell. |
| `cta` | Contact us | `null` drops it and widens the nav. |
| `ink` / `paper` / `rule` / `accent` | paper palette | `ink` is also the dissolve colour; `accent` is the CTA's. |
| `scale` | `1` | Multiplies the fluid unit. |
| `durationMs` | `500` | Whole dissolve, sweep plus one cell's fade. |
| `sticky` | `true` | Fixes the bar and ducks it away on scroll down. `false` leaves it in normal flow, so it can be placed anywhere on the page — including centred. |

## Behaviour

- **Desktop (≥992px)** — submenus open on hover or focus-within; the corner tick
  swaps from the bottom-right to the top-right as the panel expands.
- **Mobile (<992px)** — a `MENU` button clips the panel open, submenus become
  accordions, and the CTA drops to the end of the list. One CTA element,
  repositioned by CSS.
- **Scroll** — listens with `capture`, so it also works when the page scrolls
  inside a container rather than the window.
- `prefers-reduced-motion` drops the stagger and the transitions.

## Install notes

Self-contained: React is the only import, and there are no remote assets. The
paper grain is an inline `feTurbulence` data URI.

Two font families are named with full fallback stacks rather than imported —
`Geist Mono` for the nav labels and `Inter Tight` for the wordmark. If the host
project does not load them, the fallbacks are a system mono and a system
grotesk, and the layout is unchanged.

`--dsn-dim` uses `color-mix`. On a browser without it the declaration is
dropped and the labels inherit full-strength ink, which is a fine fallback.
