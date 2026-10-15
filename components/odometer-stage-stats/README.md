# Odometer Stage Stats

A "by the numbers" section that puts one figure on stage at a time: a committed colour
field, one enormous condensed numeral in the middle, the line that explains it underneath,
a short story pinned to alternating corners, and the stat's key word set huge and faint
along the bottom edge.

**The step:** the old figure drops out of its cells and every character of the new one
spins through a few digits like a counter wheel before it lands, each a beat after its
neighbour. Forward steps roll up, backward steps roll down.

Use it on an about page, an agency or studio home page, a product page's proof section,
an annual-report or impact page.

- **`mode="scroll"`** (default): the stage sticks while the section scrolls past and each
  stretch of scroll is one stat. The segment bar along the bottom fills with your scroll,
  and clicking a segment (or the arrows, or ↑/↓/←/→/Home/End while focus is in the section)
  scrolls you to that stat. Works inside any scrolling element, not only the window.
- **`mode="click"`**: a fixed-height band with prev / next (they wrap, like the autoplay),
  the segment bar, and autoplay that pauses on hover, keyboard focus, a hidden tab and the
  pause button.
- The numerals are drawn as SVG by the component (`0–9 . , % + − × / $ € £ ¥ ₹ K M B`): a
  heavy compressed poster figure with slit counters, the same shape on every OS with no
  web font. `x` becomes `×`, `k`/`m`/`b` become `K`/`M`/`B`. Any other character falls
  back to the UI font. A test samples every stroke so no glyph is clipped at its sides.
- The figure is as tall as `numberSize` allows and shrinks to fit the width, so `$2.4B`
  and `1` both fill the stage without clipping. Its baseline is pinned: the label, CTA and
  story grow downward, so nothing jumps between stats.
- The backdrop word is a darker shade of the field, compressed and fitted to the stage
  width, so it reads as one condensed word on any font and never stops mid-letter.
- Frame one is finished: the first stat is fully on stage, never a 0 counting up.
- Under `prefers-reduced-motion` stats swap instantly, autoplay is off and jumps don't
  smooth-scroll.
- Screen readers get every stat as a text list, and each change is announced once
  (`aria-live`); the drawn glyphs are hidden from them.
- Narrow containers (under 760px) set the story in flow under the label and lift the
  backdrop word above the segment bar; very short stages
  (under 620px tall) drop the story and keep the figure, label and controls.

No dependencies. Styles are scoped to `.ost` in one inline `<style>`.

## Props

| Prop | Default | |
|---|---|---|
| `stats` | 4 figures from a branding studio | `{ value, label, alt?, story?, source?, word? }[]`. `value` is the figure as text (`"96"`, `"4.2×"`, `"€2.4B"`, `"61%"`, `"12K"`). `label` is one short line, text or any node (give `alt` with a node: it is what screen readers hear). `story` is two or three sentences. `source` is printed small under the story. `word` is the backdrop word (defaults to the label's first word; `""` turns it off). |
| `title` | "Halden Studio, eleven years in figures" | Top-left heading (an `h2`). |
| `preset` | `"signal"` | `signal` (red), `cobalt`, `forest` (deep green / lime ink), `ink` (black), `saffron` (yellow / black ink). |
| `palette` | none | Override `field`, `ink`, `fieldDark` (the field under a `.dark` ancestor), `ghost` (the backdrop word; defaults to the field mixed with 20% black). |
| `mode` | `"scroll"` | `"scroll"` or `"click"`. |
| `height` | `"100svh"` | Stage height, any CSS length. |
| `step` | `"80svh"` | Scroll distance per stat in scroll mode. The section is `height + (n − 1) × step` tall. |
| `stickyTop` | `0` | px of fixed header above the stage in scroll mode. |
| `autoplay` | `5200` | ms per stat in click mode; `0` turns it off. |
| `cta` | none | `{ label, href?, onClick? }`, shown under the last stat. |
| `numberSize` | `"min(var(--ost-nh, 42cqh), 560px)"` | Height cap of the numeral (`--ost-nh` drops to 34cqh on narrow stages to make room for the story). |
| `uiFont` / `wordFont` / `storyFont` | system stacks | `uiFont`: label, controls, source. `wordFont`: the title and the backdrop word (condensed stack). `storyFont`: the corner stories (a book serif stack, like the printed captions of a poster). Pass your own, e.g. `"var(--font-sans)"`. |
| `showGrain` | `true` | A faint print grain over the field. |
| `onStepChange` | none | `(index) => void`. |

## Notes

- Scroll mode uses `position: sticky`. An ancestor with `overflow: hidden` (or `auto`)
  between the section and the scrolling element disables sticky; use `mode="click"` there.
- The default copy is sample copy for an invented studio. Replace every figure with one you
  can source, and fill `source` so readers can check it.
- Demos: `demo.tsx` (signal red, scroll mode, with a CTA) and `demo-cobalt-click.tsx`
  (cobalt, click mode with autoplay, a payments product's numbers).

Reference for the feel and layout: the stats section of a branding agency site (see
`media/odometer-stage-stats/review.md` in the source repo). No brand, copy or imagery was
taken from it.
