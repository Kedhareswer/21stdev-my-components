# Code Curtain

A sheet of source code hanging from a rod, behaving like cloth. Every character
is a point in a verlet mesh and turns with the thread it hangs from, so the text
bends, folds and drapes as the curtain moves.

- **Hover** — the code parts around the pointer and blushes toward `accentColor`.
- **Drag** a character to pull the cloth; flick and let go, it swings.
- **Double-click** to hammer in a pin where you are, or pull one out (rod hooks
  included — unhook a corner and watch it drop).
- **R** rehangs it, **← / →** send a gust, the **Rehang** button does the same as R.
- With `tearable`, threads pulled too far snap.

**No dependencies.** React is the only import: one canvas, glyphs pre-rendered
once per character at device resolution (DPR capped at 2).

Based on the hanging-code curtain idea from
[codepen.io/shubniggurath/pen/ZYpjorm](https://codepen.io/shubniggurath/pen/ZYpjorm),
rewritten as a self-contained React component: sized from its own box (not the
window), listeners on its own canvas (not the document), fixed 60 Hz steps,
theme-aware ink, keyboard access and reduced-motion support.

## Usage

```tsx
import CodeCurtain from "@/components/ui/code-curtain"

// defaults: its own verlet solver, hung from a rod
<CodeCurtain />

// your words, scalloped hooks, rips when you yank it
<CodeCurtain
  text="SHIP IT ROUGH · FIX IT LIVE · EVERY BUG IS A THREAD · "
  hang="loops"
  tearable
  accentColor="#2f6bff"
  fontFamily="ui-sans-serif, system-ui, sans-serif"
  fontWeight={800}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `text` | a verlet solver | What the curtain is woven from. Repeats to fill the grid; whitespace runs collapse to one space. |
| `columns`, `rows` | `40`, `40` | Characters across and down. |
| `curtainWidth`, `curtainHeight` | `420`, `420` | Largest size in px; shrinks to fit the box. |
| `hang` | `"rod"` | `"rod"` (every top point), `"loops"` (a hook every fourth — scallops), `"corners"` (drapes). |
| `gravity` | `0.2` | px per step. |
| `damping` | `0.99` | Velocity kept per step. |
| `stretch` | `1.1` | How far a thread may stretch (× rest length). |
| `iterations` | `5` | Constraint passes per step. |
| `tearable` | `false` | Threads snap when overstretched. |
| `tearAt` | `4.5` | Stretch (× rest) at which a thread snaps. |
| `wind` | `0.35` | Idle draught. `0` for still air. Off under reduced motion. |
| `pointerRadius` | `70` | px. |
| `pointerStrength` | `4` | How hard hovering shoves. |
| `contain` | `false` | Keep every point inside the box. |
| `inkColor` | foreground token | Glyph colour. Unset, it follows the theme (light/dark switch re-inks live). |
| `accentColor` | `"#ff5b2e"` | Strained / touched threads. `""` turns tinting off. |
| `fontFamily` | system monospace | Any installed stack — no web font is loaded. |
| `fontWeight` | `700` | |
| `showRod` | `true` | The rod, finials and hook rings. |
| `hint` | `"drag the code · …"` | Fades after the first touch. `""` hides it. |
| `resetButton` | `true` | The Rehang button. Uses the theme tokens. |
| `height` | `"100svh"` | **Must be a definite length.** |
| `className` | `""` | Appended to the root. Set a background here. |

Physics knobs (`gravity`, `damping`, `iterations`, `wind`, `tearable`, `tearAt`,
pointer, `contain`) apply live; layout props (`text`, grid, size, `hang`,
`stretch`, colours, font) rehang the sheet.

Reduced motion settles the curtain before first paint and stills the wind;
dragging, pinning and gusts still work, since the user starts them. The sheet
also stops simulating while scrolled out of view.
