# Frosted Glass Menu

A quiet, membership-club navigation. A frosted glass bar unfolds in place into
a full index: muted column heads, monospace caps links, a pill call-to-action,
a ruled footer, and a small hand-drawn traveller who pulls a suitcase along the
footer rule. He strolls while the menu is open and breaks into a run, with
dust puffs, when the call-to-action is hovered.

```
http://localhost:5173/#frosted-glass-menu          # over a product hero, open on load
http://localhost:5173/#frosted-glass-menu/strict   # smoked glass at night, two columns, no footer
http://localhost:5173/?dark#frosted-glass-menu     # the dark check
```

## Interaction

- **Toggle**: `MENU` with two lines becomes `CLOSE` with an ×, and the word rolls
  between the two. The head rule draws in from the left as the panel opens.
- **Unfold**: the body opens with the `grid-template-rows: 0fr → 1fr` trick, so
  nothing is measured in JS. Column heads, links, the CTA, the traveller and the
  footer arrive one after another, staggered.
- **Links**: the label rolls up a line, a dot slides in and an underline sweeps
  across. The rest of the index fades back while one link is hovered (`:has`).
- **CTA**: ink floods the pill from the left as a growing circle, and the arrow
  leaves on the right as a fresh one arrives from the left.
- **Logo**: the mark turns a quarter on hover.
- **Closing**: the toggle, `Escape` (focus goes back to the toggle), a press
  outside the glass, or choosing a link (`closeOnNavigate`).
- **Accessibility**: `aria-expanded` and `aria-controls` are set on the toggle,
  and the folded panel is `inert`, so Tab never lands on hidden links.
  `prefers-reduced-motion` turns off the stagger, the walk cycle and the transitions.

## Sizing

The root sits in normal flow and takes up only the bar's height, 64px plus a
16px inset. The panel unfolds *over* whatever comes next instead of pushing it
down. `fixed` pins the bar to the top of the viewport.

The layout responds to the panel's own width (container queries), not the
viewport's, so it behaves the same inside a sidebar or a narrow preview:

| Panel width | Layout |
|---|---|
| > 820px | columns, with the CTA on the right |
| 641–820px | the CTA moves to its own row above the columns |
| 331–640px | two columns, CTA full-width |
| ≤ 330px | one column |

The open panel is capped at `100svh - 96px` and scrolls inside the glass, so a
long index stays reachable on a phone.

## Props

| Prop | Default | Notes |
|---|---|---|
| `columns` | 3 sample columns | `{ title, links: { label, href?, external? }[] }[]` |
| `cta` | Become a Founding Member | `{ label, href }`. `null` drops it. |
| `footer` | copyright line | Any node. `null` drops the footer and its rule. |
| `mascot` | the traveller | Any node replaces him; `null` removes him. |
| `logo` / `logoHref` / `logoLabel` | built-in mark | The logo is sized by the component. |
| `open` / `defaultOpen` / `onOpenChange` | uncontrolled, closed | Works controlled or uncontrolled. |
| `ink` | `#141210` | Text, rules, the mark and the traveller |
| `glass` | `rgba(238, 235, 231, 0.74)` | Keep it translucent, or the frost has nothing to blur. |
| `muted` / `rule` | ink at 50% / 14% | Column heads and footer / hairlines. The CTA's outline is `rule` at 32% alpha. |
| `blur` | `28` | Backdrop blur, in px |
| `maxWidth` | `880` | Number (px) or any CSS length |
| `fixed` | `false` | Pin to the top of the viewport |
| `closeOnNavigate` | `true` | Close after a link is chosen |

## Install notes

Self-contained: React is the only import, and there are no remote assets. The
mark, the arrow and the traveller are inline SVG, and the film grain is an
inline `feTurbulence` data URI. All CSS is scoped under `.fgm-`.

`IBM Plex Mono` / `Geist Mono` are named with a system monospace fallback, not
imported. If the host does not load either font, the layout stays the same.

Older browsers: `backdrop-filter` falls back to the plain translucent tint, and
`:has()` / `color-mix()` drop out cleanly. You lose the dimming of the other
links and the toggle's hover wash, and nothing else changes.

The demo's hand, card and studio backdrop are drawn in the demo file. They are
not part of the component.
