# Magic Hour

A scroll-scrubbed video. Scroll owns the timeline — nothing autoplays. Scroll
progress maps to a target frame, a critically-damped chase with a speed cap
follows it, and the integer frame is written to `video.currentTime` with seeks
serialized so fast flicks skim instead of queueing a backlog of decodes.

Self-contained: Tailwind utilities only, no CSS file, no local imports, no npm
dependencies beyond React.

## Usage

```tsx
import MagicHour from "@/components/ui/magic-hour"

<MagicHour />                  // full viewport
<MagicHour height="36rem" />   // inside a page section
```

It sizes itself — no wrapper height needed. Do not pass `height="100%"` unless
every ancestor up to `<html>` has a definite height; the layout is
percentage-based below the root and will collapse to 0px without one.

## Props

| Prop | Default | Notes |
|---|---|---|
| `desktopSrc` | hosted sample | **Must be all-keyframe (GOP 1) H.264.** A normal MP4 seeks in lurches. |
| `mobileSrc` | `desktopSrc` | Lighter cut served under 640px. |
| `poster` | hosted sample | Shown until the first frame decodes, and in place of the video under reduced motion. |
| `fps` | `48` | Must match the encode — a wrong value seeks to the wrong times. |
| `pages` | `5` | Screens of scroll travel. More = slower, finer scrub. |
| `height` | `"100svh"` | **Must be a definite length.** Everything inside is percentage-based, so `"100%"` collapses the frame to 0px unless every ancestor has a real height too. |
| `aspectRatio` | `"9 / 16"` | CSS `aspect-ratio` of the frame. |
| `clockStart` / `clockEnd` | `"18:30"` / `"06:12"` | Clock readout endpoints; crossing midnight is fine. |
| `readouts` | `true` | The monospace clock / kelvin / frame chips. |
| `hint` | `"Scroll to turn the sky"` | Shown until scrolling starts. `""` drops it. |
| `alt`, `className` | — | |

## Bringing your own footage

The scrub only feels right on an **all-intra** encode — every frame a keyframe,
so any seek is exact and cheap:

```bash
ffmpeg -i source.mp4 -c:v libx264 -g 1 -crf 20 -an scrub.mp4
```

Then pass `fps` matching the encode. Serve it from an origin that supports HTTP
range requests (any CDN does) — seeking without ranges downloads the whole file.

The defaults point at a hosted sample so the component works on install. Swap
them for your own before shipping; do not rely on that origin staying up.

## Notes

- `prefers-reduced-motion` falls back to the poster and a line of copy. Not optional.
- The scroller is internal, and focusable, so keyboard scrolling scrubs too.
- Assumes the semantic Tailwind tokens `background`, `foreground`, `border`.
