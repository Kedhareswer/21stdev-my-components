# Shape Wrap Text

A paragraph that closes back up on **both** sides of a shape, and re-routes live
while you drag it.

CSS can float text past a `shape-outside`, but only on one side of one floated
box. Text that parts around an object in the middle of a column and rejoins
underneath is a layout the browser will not do — so this one does the layout
itself: canvas `measureText` for widths, `Intl.Segmenter` for break
opportunities, and a per-line pass that asks the shape how wide it is at that
line and fills what is left.

Nothing measures the DOM, so a drag costs no reflow: every frame is arithmetic
over a cache of word widths.

**No dependencies.** React is the only import — Tailwind utilities, no CSS file.

## Usage

```tsx
import ShapeWrapText from "@/components/ui/shape-wrap-text"

<ShapeWrapText />                                   // circle, centred, draggable
<ShapeWrapText shape="diamond" draggable={false} /> // fixed art direction
<ShapeWrapText radius={90} origin={{ x: 0.25, y: 0.4 }} text={copy} />
```

It sizes itself: the height comes from the lines it laid out, so it drops into a
column without a height prop and without `h-full`. Give it a font on an
ancestor — it reads the computed style and measures in *that* font, so it
matches whatever the host has set.

## Props

| Prop | Default | Notes |
|---|---|---|
| `text` | a sample paragraph | The copy to flow. |
| `shape` | `"circle"` | `circle` \| `diamond` \| `squircle`. |
| `radius` | `118` | Shape radius in px. Shrinks on narrow columns — see below. |
| `origin` | `{ x: 0.5, y: 0.46 }` | Starting centre: `x` across the column, `y` down the **paragraph**. |
| `gutter` | `16` | Clear space held between shape and text. |
| `minRun` | `116` | Narrowest strip of text the wrap may leave beside the shape. |
| `justify` | `true` | Stretch spaces so both edges of every run line up. |
| `draggable` | `true` | Drag the shape to re-route the text. |
| `maxLines` | `400` | Safety cap. |
| `children` | — | Rendered inside the shape: a number, a word, an inline SVG. |
| `className` | `""` | Appended to the root. |

## What it does on a phone

A 118px shape in a 327px column leaves ~30px of text either side: one word per
line, rivers, and any long word overflowing. So the shape gives way in two
stages — it shrinks until both runs clear `minRun`, and if no radius can manage
that, the wrap is abandoned: the shape sits above a plain justified paragraph
and dragging turns off. `fitShape()` is the whole rule, and it is tested.

## Notes

- `origin.y` is a fraction of the paragraph, which is why the text is laid out
  twice: once with no shape to learn its natural height, then again around the
  shape. The word-width cache makes the second pass nearly free.
- The absolutely-positioned fragments are `aria-hidden`. The real paragraph
  ships as `sr-only` text, so selection, search and screen readers get prose
  rather than a pile of positioned spans.
- A webfont that lands after first paint changes every width, so layout re-runs
  on `document.fonts.ready` and on any column resize.
- Long words are allowed to overflow rather than hyphenate, but only once
  nothing else on the line could hold them — that is what stops an unbreakable
  token from spinning the line loop forever.
- Colours are the host's semantic tokens (`foreground`, `muted`, `border`), so
  it works in both themes without configuration.

## Credit

The technique is after Cheng Lou's [pretext](https://github.com/chenglou/pretext),
which measures and lays out text arithmetically instead of through the DOM. The
line breaking here is written for this component — pretext is not a dependency,
and none of its code ships in this file.
