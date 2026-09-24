# Lanyard Badge

An event badge hanging from a patterned lanyard. Two strands come down from
above the frame, meet at a side-release buckle, and a short strap and ring hold
the card. Drag the card and the strap pulls taut; flick it sideways and it spins
on the ring; tap it (or press Enter) to flip it over.

**No dependencies.** React is the only import: no 3D library, no model file, no
textures to host.

## How it works

- **The strap** is a verlet rope (two 14-link strands plus a short drop), drawn
  on a 2D canvas as a textured ribbon. The print (a mandala ornament, a script
  line and a condensed label) is generated from props at load time, so recolouring
  or rewording it costs nothing.
- **The card** is real HTML turned in 3D with CSS, so both faces hold anything:
  text, images, a QR code, a component. A sheen moves across it as it turns,
  and it darkens edge-on.

## Usage

```tsx
import LanyardBadge from "@/components/ui/lanyard-badge"

// built-in card, your words
<LanyardBadge
  title="Config 2026"
  subtitle="San Francisco · June 24-26"
  name="Jordan Lee"
  role="Speaker"
  strapText="config twenty twenty-six"
  strapLabel="CONFIG 2026"
/>

// your own faces
<LanyardBadge
  front={<img src="/badge-front.png" alt="" className="h-full w-full object-cover" />}
  back={<div className="grid h-full place-items-center bg-white">…</div>}
  strapColor="#1d4ed8"
  inkColor="#f8fafc"
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `front` / `back` | built-in | Any React node. Fills the card face. |
| `title`, `subtitle` | `"The Future Is Handmade"`, … | Built-in front. |
| `name`, `role` | `"Alex Morgan"`, `"Documentation"` | Built-in back. |
| `strapText` | `"the future is handmade"` | Script line on the strap. |
| `strapLabel` | `"DESIGN WEEK 2026"` | Condensed label on the strap. `""` hides it. |
| `strapColor` | `"#141312"` | Strap, and the built-in back panel. |
| `inkColor` | `"#b59a6c"` | Strap print and built-in card ornament. |
| `cardColor` | `"#e8dfcc"` | Built-in card stock. |
| `cardWidth` | `240` | px. Card is 3:2 tall; strap width scales with it. |
| `height` | `"100svh"` | **Must be a definite length.** |
| `className` | `""` | Appended to the root. Set a background here. |

Reduced motion settles the badge before first paint and turns off the idle
draught; dragging and flipping still work, since the user starts them.
