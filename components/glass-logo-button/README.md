# glass-logo-button

A liquid-glass icon button with a `( ^ ^ )` face. On mount it forms itself: a small bubble
grows, squares off into the button with a jelly wobble, four droplets bead near the corners,
run together into bars and curl into brackets. While it moves, the glass rim and the logo
split into red, green and blue fringes, then settle into a calm dark-glass bevel. Hovering
lifts it and brings a faint fringe back; pressing squashes it and the release sends a
chromatic burst through the rim.

## Props

| Prop | Default | Notes |
|---|---|---|
| `width` | `280` | Button width in px. |
| `height` | `250` | Button height in px. Lower it (e.g. `136`) for a pill. |
| `logoHeight` | `96` | Logo height in px; shrinks to fit the button. |
| `radius` | `64` | Corner radius in px, capped at half the height. |
| `replayEvery` | `0` | Replay the formation every N ms. `0` plays it once on mount. The demo uses `3600`. |
| `label` | `"Glass logo button"` | Accessible name. |
| `onClick` | – | Click handler. |
| `className`, `style`, `children` | – | `children` are rendered as screen-reader-only text. |

## Notes

- No dependencies beyond React. One inline SVG: the logo is a metaball (gooey) filter over
  circles and strokes, so the droplets really merge; the RGB split is done inside that filter
  and with three screen-blended copies of the rim.
- The button carries its own dark glass look, so it reads on light and dark pages; the focus
  ring uses `--color-background` and `--color-primary`.
- The animation loop stops once the button has formed and nothing is happening, and pauses
  off screen.
- `prefers-reduced-motion`: the button renders fully formed, with no fringes, lift or squash.
