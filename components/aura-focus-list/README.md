# Aura Focus List

An editorial list of services, courses or chapters set large in a serif. Point at a row (or tab to it) and the rest of the list steps back, dims and softens. The row slides forward and turns italic, its number flips into an arrow, its note slides in, and a slow WebGL aura glides in behind it. The aura is a soft ellipse lit in the palette, its edge stirred by warping colour, and it drifts toward the pointer. Leave and it fades out. On load the rows rise in one after another.

Raw WebGL 1, no dependencies. The serif (Instrument Serif, regular and italic, Latin subset) is embedded.

```tsx
import AuraFocusList from "@/components/ui/aura-focus-list"

<AuraFocusList
  label="What we do"
  items={[
    { title: "Brand identity", meta: "38 projects", href: "/work/brand" },
    { title: "Art direction", meta: "24 projects", href: "/work/art" },
    { title: "Motion & film", meta: "29 projects", onClick: openReel },
  ]}
  palette="ember"
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `items` | five services | `{ title, meta?, href?, onClick? }[]`. With `href` a row is a link, otherwise a button. |
| `label` | `"What we do"` | Small heading with the item count. `""` hides it. |
| `palette` | `"ember"` | `"ember"`, `"tide"`, `"moss"`, or `{ ground, text, a, b, c }` (`a`–`c` light the aura). |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |
| `onActive` | none | `(index)`, `-1` when nothing is focused. |

Row positions are measured on mount, on resize and once fonts load; the frame loop only reads them. The loop sleeps once the aura has faded, while off-screen, and in hidden tabs, the pixel ratio is capped at 2, and the GL context is released on unmount. With `prefers-reduced-motion` rows fade instead of sliding or blurring, and the aura snaps in and holds still.
