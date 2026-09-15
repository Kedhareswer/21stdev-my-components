# Silhouette Wrap

A paragraph that parts around a falling silhouette, follows its **actual
outline** — a keyhole's waist, a bottle's neck — and closes back up underneath.
Scroll and the shape drops through the column; every line is set again.

CSS floats text past a `shape-outside` on one side of one box. Text that opens
around an object mid-column and rejoins below it is a layout no browser will
do. So this does the typesetting itself:

- canvas `measureText` for word widths, cached per font
- `Intl.Segmenter` for break opportunities, so CJK breaks where it should
- your SVG path rasterised **once** into a left/right scanline profile, then
  asked for its width at each line

Nothing measures the DOM, so the fall costs no reflow: each frame is a profile
lookup and one greedy pass over cached widths.

**No dependencies.** React is the only import — Tailwind utilities, no CSS file,
no animation library.

## Usage

```tsx
import SilhouetteWrap from "@/components/ui/silhouette-wrap"

<SilhouetteWrap />                                   // keyhole, falls with scroll
<SilhouetteWrap silhouette="bottle" follow="fixed" />
<SilhouetteWrap silhouette={{ path: "M…Z", box: [100, 140] }} text={copy} />
```

It sizes itself — the height comes from the lines it set, so it drops into a
column with no height prop and no `h-full`. Put a font on an ancestor and it
measures in *that* font: the type is the host's, the layout is this component's.

## Props

| Prop | Default | Notes |
|---|---|---|
| `text` | the fall, from chapter I | The passage to typeset. |
| `silhouette` | `"keyhole"` | `keyhole` \| `bottle` \| `teapot` \| `circle` \| `diamond`, or `{ path, box }`. |
| `size` | `190` | Silhouette width in px, before the column has its say. |
| `follow` | `"scroll"` | `scroll` falls with the page, `drag` follows the pointer, `fixed` holds still. |
| `travel` | `[0.06, 0.82]` | Fractions of the paragraph the fall runs between. |
| `drift` | `46` | Sideways drift over the fall, in px, so no two lines break alike. |
| `origin` | `{ x: 0.52, y: 0.42 }` | Where a `fixed` silhouette sits. |
| `gutter` | `18` | Clear space held between outline and text. |
| `minRun` | `112` | Narrowest strip of text the wrap may leave beside it. |
| `justify` | `true` | Stretch spaces so both edges of every run line up, where it can be done cleanly. |
| `tolerance` | `0.62` | How far a space may stretch before the line is left ragged instead. |
| `dropCap` | `3` | Lines tall for the opening capital. `0` turns it off. |
| `maxLines` | `500` | Safety cap. |
| `children` | — | Painted inside the outline instead of the default fill. |
| `className` | `""` | Appended to the root. |

`children` replaces the fill, so the outline can carry artwork: the bottle demo
paints a DRINK ME label inside it. Left alone the silhouette is solid ink —
which in dark mode becomes light coming through the keyhole.

## Three things it gets right that are easy to get wrong

**Narrow runs are not justified.** Justification beside a silhouette is where
shaped text usually falls apart: a six-word run stretched to both edges opens
rivers you can see from across the room. Any line needing more than `tolerance`
of extra space per gap is set ragged instead. Wide lines still justify, so the
column keeps a clean left and right edge and the text still hugs the outline —
which is the whole point of doing this at all.


**The drop cap is measured, not guessed.** A cap sized by a magic ratio either
collides with the text or floats above its baseline. This asks the font:
`actualBoundingBoxAscent` for how tall that particular glyph draws, the font's
own ascent/descent for where CSS puts a baseline inside a line box. The cap's
top then lands on the first line's cap-height and its baseline on the last line
it spans, which is the rule a compositor would use.

**A line band is cleared at its widest point.** Measuring the shape at the line's
midpoint lets a glyph clip the corner of anything that pinches — exactly what a
keyhole does at its waist. Every scanline the band touches is checked, and the
widest wins.

## What it does on a phone

A 210px silhouette in a 342px column leaves ~30px runs: one word per line,
rivers, and long words spilling out. So the silhouette gives way in two stages —
it shrinks until both runs clear `minRun`, and when no width can manage that,
the wrap is abandoned: the silhouette sits full-size above a plain column and
the drop cap moves down with the text. `fitSilhouette()` is the whole rule, and
it is tested.

## Notes

- `prefers-reduced-motion` parks the fall and sets the paragraph once.
- Scroll reads coalesce to one re-typeset per frame via `requestAnimationFrame`,
  and the listener is passive, so a fast wheel never fights the compositor.
- No `Path2D` (older engines, some capture sandboxes) degrades to the stacked
  layout instead of throwing.
- The positioned fragments are `aria-hidden`; the real paragraph ships as
  `sr-only` text, so selection, search and screen readers get prose rather than
  a pile of spans.
- A webfont that lands after first paint changes every width, so layout re-runs
  on `document.fonts.ready` and on any column resize.
- Colours are the host's semantic tokens, so it works in both themes untouched.

## Credit

The passage is Lewis Carroll, *Alice's Adventures in Wonderland* (1865), public
domain. The measure-don't-reflow approach is the idea behind Cheng Lou's
[pretext](https://github.com/chenglou/pretext) — not a dependency, and none of
its code ships here; the line breaker is written for this component.
