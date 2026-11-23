# Italic Sweep Scroll Text

A pinned statement that writes itself as you scroll.

- Words rise into place one after another. Each waits just below its line, then snaps up.
- The emphasised phrase leans into italic one letter at a time.
- Small ink marks open inside the lines and nudge the words apart. Nearby words follow first, distant ones a beat later.
- Keep scrolling and the marks close, then the words lift away in reading order.

Everything is a function of one eased scroll value, so scrolling back up plays it in reverse.

## Usage

```tsx
import ItalicSweepScrollText from "@/components/ui/italic-sweep-scroll-text"

<ItalicSweepScrollText text="A page [] only *comes alive* when someone takes the time to [] scroll it." />
```

Text syntax:

| Write | Get |
|---|---|
| `*a phrase*` | the italic sweep, letter by letter |
| `[]` | an inline mark that opens between two words |
| `\n` | a forced line break |

To play it without scrolling (a banner, a preview), give it a pass length in seconds:

```tsx
<ItalicSweepScrollText autoPlay={9} />
```

Otherwise put it straight in the page flow. It needs content above and below to scroll through, and no ancestor with `overflow: hidden` (that disables `position: sticky`).

## Props

| Prop | Default | What it does |
|---|---|---|
| `text` | a placeholder sentence | The statement, in the syntax above |
| `height` | `"100svh"` | Height of the pinned stage |
| `scrollLength` | `"340svh"` | Height of the whole scroll track. Longer means a slower animation |
| `range` | `[0.03, 0.44, 0.6, 0.95]` | Track progress where the entrance starts and ends, then the exit starts and ends |
| `lead` | `0.25` | How early progress starts counting before the stage pins (and how late it stops after), in stage heights |
| `rise` | `0.59` | How far below its line a word starts, in em |
| `lift` | `0.27` | How far a word lifts as it leaves, in em |
| `overlap` | `3.5` | How long one word takes, in word-to-word steps |
| `smoothing` | `0.14` | Seconds the eased scroll value takes to catch up. `0` follows the scrollbar exactly |
| `exit` | `true` | Lift the words away at the end of the track |
| `sweep` | `true` | Sweep the emphasis into italic. `false` keeps it italic throughout |
| `glyphLoop` | `true` | Keep the marks shifting shape while open |
| `autoPlay` | `false` | Seconds per pass to play on its own, looping, instead of following the scroll. The block is then only as tall as the stage. For previews and banners |
| `align` | `"center"` | `"center"` or `"left"` |
| `fontFamily` | Newsreader, then system serifs | Any family with a real italic |
| `fontHref` | Google Fonts, Newsreader | Stylesheet to load, or `null` to bring your own font |
| `className` | | Extra classes on the root |

## Notes

- No dependencies beyond React.
- The background is transparent. The ink is the theme's `--color-foreground` softened towards `--color-background`, so it follows light and dark themes.
- Lines are broken once for the settled sentence and then locked, so no word hops to another line while letters and marks change width. They are re-broken on resize and when the font loads.
- Screen readers get the plain sentence (emphasis kept as `<em>`); the animated copy is `aria-hidden`.
- With `prefers-reduced-motion: reduce` the scroll track collapses to the stage height and the sentence is shown settled, with no motion.
- If `scrollLength` equals `height` there is nothing to pin, and the animation runs while the block crosses the viewport instead.
