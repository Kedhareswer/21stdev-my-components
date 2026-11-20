# dot-matrix-feature-accordion

A feature section that walks through product features one at a time. On the left, a headline sits above an accordion of feature rows. A grey panel slides to the active row, the row's copy blurs in, and a small colour-matched pill across the panel's top edge shows time to the next step. On the right, a square card cross-fades to the feature's colour. White dot-matrix clusters along its edges scatter and re-form into a new pattern, and a minimal UI snippet in the middle blurs out and back in.

- Auto-advances every `interval` ms (1850 by default). Pauses while off-screen or in a background tab.
- Hovering a row selects it at once and holds the cycle. Moving the pointer off the list resumes it from the start of the current row.
- Click or tap selects a row. Keyboard focus selects too, and holds the cycle while focus stays in the list. Arrow Up/Down, Home and End move through the rows.

## The card is interactive too

- **Cursor-reactive dots.** Dots near the pointer swell, brighten and drift away from it. Resting dots shimmer softly.
- **Tilt and depth.** The card tilts up to 6° toward the cursor, and the snippet drifts against the tilt for a little parallax. Hovering the card holds the cycle.
- **Click or tap for the next feature.** The click sends a ring of lit grid dots out from the point you pressed.
- **Swipe.** Swipe left for the next feature and right for the previous one. Vertical drags still scroll the page (`touch-action: pan-y`).
- **Keys.** The card is a focusable button. Enter or Space goes to the next feature, and Arrow Left/Right step through them.
- **Snippet entry.** Amounts count up from a figure with the same digit count, so the width doesn't jump. Meters fill from empty, and chips pop in just after their card.
- **First view.** The dots assemble once when the card first scrolls into view.

`prefers-reduced-motion`: colour, panel, copy and snippet swap instantly. The dots don't move or react, the card doesn't tilt, figures show their final value, and chips don't pop. Clicking, swiping and the keys still change features.

The dot loop runs only while the card is on screen and the tab is visible. The canvas is drawn at its laid-out size × device pixel ratio, so the dots stay sharp.

No dependencies beyond React and Tailwind. Uses only the semantic tokens `--color-foreground`, `--color-muted-foreground`, `--color-background` and `--color-border`.

## Props

| Prop | Type | Default | |
|---|---|---|---|
| `heading` | `ReactNode` | "Your money moves while you're busy living." | Section headline |
| `features` | `DotMatrixFeature[]` | six finance features | `{ id, title, description, color, snippet }` |
| `interval` | `number` | `1850` | Dwell per feature, in ms |
| `autoPlay` | `boolean` | `true` | Cycle without interaction |
| `className` | `string` | | Added to the `<section>` |

`snippet` is any `ReactNode` and is centred on the card. The snippet keeps a white surface with dark text in both themes, because it sits on a vivid card.

## Timings

The timings were measured frame by frame on a 60 fps capture of the original:

- card colour: 350 ms;
- snippet: 140 ms out, then 240 ms in;
- dots: 460 ms;
- panel: an exponential follow with a 70 ms time constant;
- progress pill: reaches 28% of the panel width at the switch.

These extras are not in the reference:

- the dots' cursor response, with a 90 ms pointer smoothing and a radius of 6 cells;
- the ripple, which travels at 34 cells/s and fades over 950 ms;
- count-ups, at 720 ms;
- meter fill, at 900 ms;
- the chip pop, at 420 ms after a 180 ms delay;
- tilt and parallax, which ease over 520 ms;
- the entry assembly, at 900 ms.

`CountUp` is exported, so custom snippets can use it, for example `<CountUp value={1240} decimals={0} />`.
