# Orbit Social Bento

A four-card bento for a community or social SaaS, in warm apricot, sage and sky with a fine paper grain and serif headlines.

- **Members.** The count rolls up over three rings of people orbiting a pulsing centre. Each ring turns its own way, and the faces stay upright as they travel.
- **Inbox.** A deck of notifications deals a new one to the front every few seconds. Older cards step back, shrink and fade their contents, and the oldest lifts away.
- **Reactions.** A pill of emoji. One after another pops up with a spring and a floating +1. Hover or tap any of them.
- **Message.** Typing dots, then the message lands with a soft blur-in, on a loop.

The cards rise in one after another when the bento scrolls into view.

```tsx
import OrbitSocialBento from "@/components/ui/orbit-social-bento"

<OrbitSocialBento
  members={48210}
  memberLabel="builders in 92 countries"
  people={["AK", "JM", "SR", "LT", "NO", "PV", "EH", "DY", "RB", "CW", "MI"]}
  notices={[{ app: "Releases", title: "Build 2.18 shipped", body: "Changelog in #announcements", time: "2m", tint: "#3f9b6e" }]}
  message={{ from: "Rafa Oduya", text: "Coffee next week?" }}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `members` / `memberLabel` | `48210` / `"builders in 92 countries"` | Headline count and its label. |
| `people` | 11 sample initials | Up to 11 fill the rings (3, 4, 4). Each keeps a colour hashed from its text. |
| `notices` | 5 samples | `{ app, title, body, time, tint? }[]`. Three show at once. |
| `reactions` | `😂 🏆 👏 🔥 🎉 💛` | Emoji in the bar. |
| `message` | sample | `{ from, text }`. |
| `interval` | `2800` | Ms between inbox deals. |

## Notes

- React only. The orbit is pure CSS rotation, and each avatar counter-rotates with its own keyframe so it stays upright. The deck is CSS transforms keyed by rank, and the timers are intervals. The count-up runs 1.6 s of `requestAnimationFrame` that only sets state. Nothing reads layout.
- Fonts fall back from Fraunces and Inter Tight to Georgia/Palatino and the system sans. Avatars are initials, so the demo is self-contained.
- The front notice is the only one exposed to assistive tech. The count is announced once, in full.
- Layout: three columns, then two below 900 px, then one below 600 px. `prefers-reduced-motion` stops every loop and shows final values.
