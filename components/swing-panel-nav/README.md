# Swing Panel Nav

A pill navbar whose dropdowns are one oversized sheet. Clicking a menu swings
the sheet down from a hinge far off the right edge. It springs past its resting
tilt by about a degree, then settles at −4°. Switching menus throws the sheet
back up and swings the next one in. The links are huge condensed capitals; on
hover one slides right and fades.

Self-contained: one file, React only, no npm dependencies. The two fonts
(display caps and the rounded nav face, both OFL) are subset and embedded,
about 20 kB together.

## Usage

```tsx
import SwingPanelNav from "@/components/ui/swing-panel-nav"

<SwingPanelNav />                                   // full viewport stage
<SwingPanelNav height="44rem" accent="#ff5a1f" />
<SwingPanelNav menus={[
  { label: "Work", links: [{ label: "Project 01", href: "/work/01" }] },
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
| `menus` | Work / About / Journal | items with `links` open the sheet; items with only `href` are plain links |
| `cta` | `Email me` → mailto | the solid button; pass `null`-ish to hide |
| `accent` | `#3355ff` | links, chevrons, button |
| `height` | `"100svh"` | any definite length |
| `children` | — | stage content behind the sheet |

## Motion

Measured from the reference at 30 fps, with the sheet outline fitted frame by
frame:

- **Open:** spring, stiffness 220, damping 23, mass 1, from +58° to −4° about a
  pivot 33% of the stage width past the right edge. It overshoots to about −5°
  at 0.3 s and is still by 0.6 s.
- **Close:** cubic ease-in back to +58° over 150 ms.
- **Swap:** close, then open the new sheet.
- **Link hover:** `translateX(.37em)` and opacity .66 over 220 ms with
  `cubic-bezier(.22,1,.36,1)`.

## Behaviour

- Triggers are disclosure buttons (`aria-expanded`, `aria-controls`).
  Opening from the keyboard moves focus to the first link. Escape closes the
  sheet and returns focus to its trigger.
- A press outside closes it. On a mouse, leaving both the pill and the sheet
  also closes it. Touch never closes on leave.
- While closed, the sheet is `inert`.
- `prefers-reduced-motion`: no swing. The sheet fades in at its resting tilt
  and links only fade.
- Hover slide and button brightening apply only under
  `(hover: hover) and (pointer: fine)`.
- Under a 720 px container the sheet starts near the left edge, the type
  scales with the container and the brand fades out while the sheet is open.
  Under 520 px the button and wordmark hide.

## Theming

The stage uses `--color-foreground` and the sheet uses `--color-background`.
In light mode that gives a dark stage with a white sheet. In dark mode they
invert, and the link colour lightens under `.dark`.
