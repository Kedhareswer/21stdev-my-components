# Presence Avatar Stack

An overlapping avatar group with live presence. Faces pop in one after another, each with a status dot (online pulses softly; away, busy and offline are still). Hovering the group fans the faces apart on a spring; hovering or tabbing to one lifts it and shows a tooltip with name, status and role. A turning gradient ring marks whoever is speaking. Past `max`, the rest fold into a "+N" chip that opens a list of everyone else, rows sliding in with a stagger.

The ring around each face matches your page background by default, so the stack sits cleanly on light, dark or tinted surfaces (pass `ring` for a custom surface).

```tsx
import PresenceAvatarStack from "@/components/ui/presence-avatar-stack"

<PresenceAvatarStack
  label="Editing now"
  max={4}
  size={42}
  align="end"
  people={[
    { name: "Maya Lindqvist", role: "Design lead", photo: "/maya.webp", status: "online", speaking: true },
    { name: "Leo Tanaka", role: "Engineering", photo: "/leo.webp", status: "away" },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `people` | required | `{ name, photo, role?, status?, speaking? }[]`. `status` is `online` (default), `away`, `busy` or `offline`. |
| `max` | `4` | Faces before the "+N" chip. |
| `size` | `44` | Diameter in px; dots, rings and type scale with it. |
| `label` | `"People here"` | Accessible name of the group. |
| `ring` | page background | Colour of the ring around each face. |
| `align` | `"start"` | Which edge the "+N" list lines up with; use `"end"` near the right edge. |
| `className` | `""` | On the root. |

## Notes

- An inline piece: it sizes to its content, so it drops into headers, cards and rows.
- The fan-out is a transform per face from a CSS index, only on devices that can hover; nothing is measured.
- The "+N" list closes on outside click and Escape.
- Reduced motion: no pop-ins, pulse, turning ring or springs.
- The demo inlines eight free Unsplash portraits as tiny WebP so it makes no off-origin requests.
