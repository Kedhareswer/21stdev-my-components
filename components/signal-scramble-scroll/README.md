# Signal Scramble Scroll

A scroll-driven decode section. The stage pins while the page scrolls past it. A statement starts as fragments of static scattered across a dark, scan-lined screen. As you scroll, each word flies home to its place in the sentence (a FLIP from its scattered spot to where it really sits), turning and growing as it lands. Its letters churn through noise glyphs, then lock in left to right. The headline decodes first. A HUD shows the channel, the decoded percentage and a progress rule, and a phosphor glow swells behind the text. Stop mid-scroll and the unlocked letters keep flickering. Scrolling back scatters it again.

Requires `gsap` (with ScrollTrigger). Space Mono (regular and bold, Latin subset) is embedded; a monospace face keeps every word the same width while it churns, so nothing reflows.

```tsx
import SignalScrambleScroll from "@/components/ui/signal-scramble-scroll"

<SignalScrambleScroll
  title="Incoming transmission"
  text="Every *signal* starts as noise. We listen long enough to hear the *pattern*."
  accent="#ffb547"
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `text` | sample statement | `*word*` lights a word in the accent. Punctuation right after an accent stays with it. |
| `title` | `"Incoming transmission"` | Small headline that decodes first. |
| `channel` / `coords` / `hint` / `ghost` | sample HUD | Top-left, bottom-left and bottom-right labels, and the large outlined figure behind. |
| `accent` / `ground` / `ink` | `#ffb547` / `#070707` / `#ece7dc` | Phosphor, background and text colours. |
| `length` | `2.6` | Scroll the decode takes, in stage heights. |
| `height` | `"100svh"` | Stage height. Keep it a definite length. |

Each word's home and scatter offset are measured on ScrollTrigger refresh (mount, resize, fonts loaded); the scroll handler only writes transforms, opacity and text. Screen readers get the plain sentence. With `prefers-reduced-motion` the sentence shows decoded, in place.
