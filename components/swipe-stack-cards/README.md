# Swipe Stack Cards

A deck of story cards, the ones behind peeking over the top of the front card. Drag the front card down and let go: past the line, or with a flick, it drops off the bottom and slides back in at the rear of the deck while the next card settles forward on a soft elastic. Drag it up, or press Back, to pull the last card round to the front. A blurred glow of the front photo sits behind the deck, and the deck deals itself in from below on first view.

Each card has a photo with a section chip, a serif headline, the curator (drawn as an initials avatar), the read length and a Read link. The heading, intro and Back / Next buttons sit beside the deck on wide stages and above it on phones. Arrow keys step through the deck when it has focus.

```tsx
import SwipeStackCards from "@/components/ui/swipe-stack-cards"

<SwipeStackCards
  heading={<>Worth your<br /><em>slow</em> Sunday</>}
  stories={[
    { kicker: "Travel", title: "Rowing out before the lake wakes up", curator: "Ines Varga", length: "9 min read", href: "/s/lake", image: "/lake.webp" },
    { kicker: "Food", title: "The brasserie that only serves one fish a night", curator: "Tom Okafor", image: "/brasserie.webp" },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `stories` | required | `{ title, image, alt?, kicker?, curator?, length?, href? }[]`. Landscape-ish photos (about 4:3). |
| `heading` | "Worth your *slow* Sunday" | Heading beside the deck. |
| `intro` | a short line | Paragraph under the heading (hidden on phones). |
| `readLabel` | `"Read"` | Link label on each card. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |
| `onChange` | none | `(story, index)` when a new card reaches the front. |

Colours come from the host's `--color-background`, `--color-foreground`, `--color-muted-foreground`, `--color-border` and `--color-primary`, with warm paper fallbacks, so it follows light and dark themes. Only the front card takes the pointer, and only it has `touch-action: none`, so the page still scrolls everywhere else. Sizes come from a `ResizeObserver`; nothing reads layout while you drag.

With `prefers-reduced-motion`, cards move with short plain fades instead of the elastic and the deal-in.

Needs `gsap`.
