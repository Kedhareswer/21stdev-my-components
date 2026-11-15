# Swing Panel Nav

A pill navbar whose dropdown is an oversized sheet. Clicking a menu swings the
sheet down around a pivot far outside the stage. It springs about a degree past
its resting tilt, then settles. Clicking another menu changes the links at
once, kicks the same sheet up about 27° and lets it fall back. The links are
huge condensed capitals with round O's; on hover one slides right and fades.

Self-contained: one file, React only, no npm dependencies. Three small font
subsets are embedded (about 26 kB together): a display face built from Archivo
with round letters from Jost, and Nunito at two weights for the bar. All three
sources are OFL.

## Usage

```tsx
import SwingPanelNav from "@/components/ui/swing-panel-nav"

<SwingPanelNav />                                   // full viewport stage
<SwingPanelNav height="44rem" accent="#ff5a1f" />
<SwingPanelNav menus={[
  { label: "Work", tilt: -4, links: [{ label: "Project 01", href: "/work/01" }] },
  { label: "Journal", href: "/journal" },           // plain link, no sheet
]} cta={{ label: "Email me", href: "mailto:you@example.com" }}>
  {/* optional stage content, drawn behind the sheet */}
</SwingPanelNav>
```

The root sizes itself (`width: 100%`, `height` defaults to `100svh`). Don't pass
`height="100%"` unless every ancestor up to `<html>` has a definite height.

## Props

| Prop | Default | |
|---|---|---|
| `brand` | `"Kedhareswer"` | wordmark, top left |
| `menus` | Work / About / Journal | items with `links` open the sheet; items with only `href` are plain links; `tilt` sets a sheet's resting angle |
| `cta` | `Email me` → mailto | the solid button |
| `accent` | `#3355ff` | links, chevrons, button |
| `height` | `"100svh"` | any definite length |
| `children` | — | stage content behind the sheet |

## Motion

Every value below was measured from the reference clip by fitting the sheet's
outline in each 30 fps frame. `tests/swing-panel-nav.test.mjs` runs the motion
code against those measurements.

- **Pivot:** 140.2% across and 59% down the stage, well outside it. The sheet
  does not turn about its own corner.
- **Open:** spring, stiffness 185.6, damping 21.04, mass 1, from 47.6° away to
  rest. It overshoots by about 1.1° at 0.34 s and is still by 0.6 s.
- **Close:** travel = 0.0284 × ms^1.5, gone in about 145 ms.
- **Swap:** the links change at the click. The sheet follows the close curve
  until it meets the opening spring (started at the same click), about 27° up
  and 98 ms in, then rides the spring back down.
- **Resting tilt:** −4° for the first menu and −4.4° for the second, as in the
  reference.
- **Sheet size:** 529 px tall for four links and 503 px for three on a 700 px
  stage; line pitch 59.5 px and 64.5 px; the link block sits 61 px above the
  sheet's bottom edge.
- **Link hover:** `translateX(.36em)` and opacity .66 over 400 ms with
  `cubic-bezier(.22,1,.36,1)`.
- **Trigger:** the open label dims to 80% in 80 ms and its chevron turns 180°
  in 250 ms.

## Behaviour

- Triggers are disclosure buttons (`aria-expanded`, `aria-controls`).
  Opening from the keyboard moves focus to the first link. Escape closes the
  sheet and returns focus to its trigger.
- A press outside closes it. On a mouse, leaving both the pill and the sheet
  also closes it. Touch never closes on leave.
- While closed, a sheet is `inert` and hidden.
- `prefers-reduced-motion`: no swing. The sheet fades in at its resting tilt
  and links only fade.
- Hover slide and button brightening apply only under
  `(hover: hover) and (pointer: fine)`.
- Under a 720 px container the sheet starts near the left edge, the type
  scales with the container and the brand fades out while a sheet is open.
  Under 520 px the button and wordmark hide.

## Theming

The stage uses `--color-foreground` and the sheet uses `--color-background`.
In light mode that gives a dark stage with a white sheet. In dark mode they
invert, and the link colour lightens under `.dark`. The pill is the background
colour with a slight accent tint.
