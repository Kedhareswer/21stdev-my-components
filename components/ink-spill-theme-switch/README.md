# Ink Spill Theme Switch

A light/dark theme switch that doesn't just swap colours: the new theme spreads out from the toggle like spilled ink. The edge is ragged with fractal noise, thin tendrils reach ahead of it, and droplets land just past the edge before it covers them.

```tsx
import InkSpillThemeSwitch, { InkThemeToggle } from "@/components/ui/ink-spill-theme-switch"

<InkSpillThemeSwitch defaultTheme="light">
  {({ theme, toggle }) => (
    <Page theme={theme}>
      <InkThemeToggle theme={theme} toggle={toggle} />
    </Page>
  )}
</InkSpillThemeSwitch>
```

## Props

| Prop | Default | |
|---|---|---|
| `children` | — | `({ theme, toggle, spilling }) => ReactNode`. Renders your page for one theme. |
| `defaultTheme` | `"light"` | `"light"` or `"dark"`. |
| `duration` | `1400` | Length of the spill, in ms. |
| `height` | `"100svh"` | The stage's height. Its content scrolls inside it. |
| `onThemeChange` | — | Called with the new theme once the spill finishes. |

`toggle(element)` makes the ink spill from that element's centre. With no element it starts in the top-right corner. `InkThemeToggle` is a sun/moon button that passes itself to `toggle`.

## Notes

- While the ink spreads, `children` renders twice: once for the old theme underneath and once for the new theme, clipped, on top. The top copy is `inert` and `aria-hidden`, and its scroll position follows the bottom copy's. Keep live state such as form inputs above this component, or the two copies can drift apart.
- The ink is a CSS `clip-path: path()` that is rebuilt every frame. It uses no canvas, no WebGL and no dependencies beyond React.
- With `prefers-reduced-motion: reduce`, the theme changes instantly.
