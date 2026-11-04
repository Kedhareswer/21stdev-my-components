# Titanium Dock

A machined icon dock. The bar is brushed metal, fine horizontal grain over a soft top-lit falloff, with a sheen that follows the pointer along it. The active item sits in a raised, polished cup ringed with an anodised heat-tint rim (gold through violet to cyan). Pick another item and the cup springs across, stretching toward where it's going and settling round while its rim hue turns. Icons swell and lift under the pointer with a smooth falloff to their neighbours, a tooltip pops above, and a small machined dot marks the active item.

Two finishes: brushed `silver` and dark `graphite`. Items deal in one after another on mount. Under `prefers-reduced-motion` nothing travels or swells.

```tsx
import TitaniumDock from "@/components/ui/titanium-dock"

<TitaniumDock value={tab} onChange={setTab} />
<TitaniumDock
  finish="graphite"
  items={[
    { id: "inbox", label: "Inbox", icon: <InboxIcon /> },
    { id: "search", label: "Search", icon: <SearchIcon /> },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `items` | Orders, Help, Profile, Share, Done | `{ id, label, icon? }[]`. Without `icon`, the five built-in ids (`orders`, `help`, `profile`, `send`, `done`) get built-in icons. 24×24 stroked SVGs with `currentColor` match best. |
| `value` | none | Controlled active id. |
| `defaultValue` | first item | Initial active id when uncontrolled. |
| `onChange` | none | `(id) => void`. |
| `finish` | `"silver"` | `"silver"` or `"graphite"`. |
| `magnify` | `0.3` | How much the hovered icon grows. `0` turns magnification off. |
| `aria-label` | `"Dock"` | Toolbar name. |

It's a `toolbar` with a roving tab stop: arrows, Home and End move and select, and the active item carries `aria-current`. The bar's left edge is measured once as the pointer enters; moves only read that cache and write CSS variables. No dependencies beyond React.
