# Scroll Milestone Timeline

A horizontal company timeline you travel by scrolling. One axis; milestones
above it as coloured pills, engineering notes below it as plain mono type,
each hung off a dashed stem at its own height.

Scroll inks the axis left to right. As the pen passes an event, its stem grows
out of the axis, the dot pops, the pill wipes open and the text types itself
in with a block caret. Scroll back and it all un-writes. When the track is
wider than the screen (phones) it pans with the pen.

**No dependencies.** React is the only import — no fonts, images or animation
library. Everything is DOM positioned from numbers.

## Interaction

- **Scroll** is the timeline. Same scroll position, same frame, both ways.
- **Hover / focus** an event: the rest dim, its stem goes solid, its pill
  lifts, and its `detail` (if any) opens in a card.
- **Click** an event, or a tick on the bottom mini-map, to scroll to it.
- **Tab** through the events and the page travels with you.
- The latest written event pulses; the counter top right announces it.

## Usage

```tsx
import ScrollMilestoneTimeline, { type TimelineEvent } from "@/components/ui/scroll-milestone-timeline"

<ScrollMilestoneTimeline />                        // the reference timeline

const events: TimelineEvent[] = [
  { at: 2019, date: "2019", title: "Studio founded", color: "#ff6b4a", level: 2 },
  { at: 2019.5, date: "Autumn 2019", title: "Lighting engine,\nv0", level: 3 },
  { at: 2020, date: "2020", title: "Kickstarter", color: "#ffc857", level: 4, detail: "412% funded." },
]
<ScrollMilestoneTimeline events={events} title="Five years" background="#101113" ink="#f1ede4" />
```

Give it a parent with a width and nothing else — see `demo.tsx`.

## Event

| Field | Notes |
|---|---|
| `at` | Position on the axis, any unit. Equal steps are equal gaps; the closest pair sets the spacing, so years, quarters or season indices all lay out the same. |
| `date` | Bold line beside the dot. |
| `title` | Body. `"\n"` breaks a line. |
| `color` | Pill background. Omit for a plain note with an ink dot. |
| `side` | `"above"` / `"below"`. Default: above when coloured, else below. |
| `level` | Stem length in rows, 1–8. Stagger neighbours so labels do not collide. Default alternates 2/4 above, 1/3 below. |
| `detail` | Longer text for the hover card. |

## Props

| Prop | Default | Notes |
|---|---|---|
| `events` | the reference, 10 events | Any order — sorted by `at`. |
| `kicker` / `title` | company copy | Top-left HUD. `""` hides either. |
| `height` | `"100svh"` | The sticky stage. **Must be a definite length.** |
| `scrollPerEvent` | `0.45` | Stage-heights of scroll per event. |
| `minSlot` / `maxSlot` | `104` / `136` | Px between the closest pair. Below `minSlot` of room, the track pans. |
| `background` | paper tint of `--color-background` | Any CSS colour. |
| `ink` | `--color-foreground` | Lines, dots and type. |
| `pillInk` | `#1b1b1b` | Text on pills (pills keep their colours in both themes). |
| `fontSans` / `fontMono` | system stacks | Dates and headings / bodies. No fonts are loaded. |
| `typewriter` | `true` | `false` fades bodies in instead of typing them. |
| `hud` | `true` | Heading, counter, mini-map, scroll hint. |
| `onActiveChange` | — | `(index)` in your `events` order, `-1` before the first. |
| `className` | `""` | Appended to the root. |

The layout maths (`layoutTimeline`, `playheadAt`, `revealAt`, `phasesOf`,
`panFor`, …) is exported, so the same scroll position can drive something of
your own alongside it.

## Notes

- **The root's height is the scroll budget**: `(1 + events × scrollPerEvent)`
  stages. The stage is a `sticky` child at `height`.
- Progress is measured from **the element**, never `window.scrollY`.
- Scroll schedules one rAF; it writes CSS variables and text straight to the
  DOM. React re-renders only when the active event or hover changes.
- Typed text keeps its layout: the untyped rest is present but `hidden`, and
  the caret is zero-width.
- Assumes only `--color-background`, `--color-foreground` and
  `--color-border`, each with a fallback. Works in light and dark.
- `prefers-reduced-motion`: no caret blink, no pulse, no transitions; jumps
  scroll without smoothing. The scroll-linked write-in stays — it only moves
  when you do.
- Every event is a labelled `<button>`; the timeline also exists as an
  `sr-only` list.

## Credit

Layout and palette after a reference image of a lab-robotics startup's
2017–2019 timeline. The implementation is original.
