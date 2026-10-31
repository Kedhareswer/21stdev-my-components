# Cutout Sentence

A landing-page section where a picture turns into the words that describe it.

It opens on one **full-bleed image**. As you scroll:

1. **Settle.** The picture glides down into the lower part of the stage, making room above.
2. **Score.** Thin white cut lines are traced around small rectangles in the picture, one after another.
3. **Lift.** Each rectangle comes up out of the picture with a white cut edge and a growing shadow. It leaves a clean **hole the colour of the page** behind.
4. **Fly.** The pieces arc up into a sentence three or four at a time, in reading order. Each one tilts toward the side it bows to and swells mid-air. Its window **re-crops**: it opens onto a little more of the surrounding picture, then closes on its slot.
5. **Land.** Each piece settles between typographic braces `{ }` beside the word it shows, with a small overshoot. The braces clamp shut around it, and the words around each slot rise out of a blur just ahead of it.

Scroll back and it all runs backwards: every piece flies home and fills its own hole exactly.

The default sentence describes the default picture:

> Painted boats { ▢ } doze by the old pier { ▢ }, oars { ▢ } shipped, ropes { ▢ } slack, as a lone buoy { ▢ } bobs on turquoise { ▢ } water above pale shallows { ▢ }.

**Requires `gsap`** (ScrollTrigger). With no `src`, it paints its own picture: an aerial harbour drawn on a canvas in the browser. No image, font or script is loaded from anywhere.

## Interaction

- **Scroll** (`mode="scroll"`, the default): the section is `1 + scrollLength` stage-heights tall and the stage is `sticky`. Progress is scrubbed with a little smoothing, so wheel steps don't stutter.
- **First impression:** before you scroll, the cut lines trace themselves once over the full picture, then fade. It's a hint of what's about to come apart.
- **Autoplay** (`mode="auto"`): the stage is one `height` tall. It plays once when it scrolls into view, and a **Replay** button rewinds it (the pieces fly home) and plays it again.
- **Once settled**, hover a piece in the sentence and it lifts while its hole in the picture pulses. Hover a hole and its word appears as a tag, and the matching piece lifts.
- **Reduced motion:** the finished sentence with every piece in place, from the start. No scroll track, no flight. Hovering still works.

## Usage

```tsx
import CutoutSentence from "@/components/ui/cutout-sentence"

<CutoutSentence />
```

Give it a parent with a width (see `demo.tsx`). For your own picture, write a sentence with `{id}` placeholders and describe each piece:

```tsx
<CutoutSentence
  src="/birds.jpg"
  imageAspect={3 / 2}
  sentence="A kaleidoscope {flock} of painted wings {wings} dances across the vast and tranquil cerulean sky {sky}."
  pieces={[
    { id: "flock", word: "kaleidoscope", region: [0.30, 0.10, 0.10, 0.08] },
    { id: "wings", word: "wings",        region: [0.52, 0.12, 0.06, 0.08] },
    { id: "sky",   word: "sky",          region: [0.80, 0.30, 0.06, 0.08], aspect: 1.4 },
  ]}
/>
```

- `region` is `[x, y, width, height]` as fractions of the image (0–1), so it doesn't depend on the image's pixel size. The cut is exact: the piece is that region, and the hole it leaves is that region.
- The slot in the sentence takes the region's own shape. Give `aspect` to choose another shape, and the piece re-crops to it as it lands.
- Put a piece **right after the word it shows** (`pier {pier}`). It's kept on the same line as that word. Punctuation written straight after a placeholder (`{pier},`) stays with it too.
- Keep regions from overlapping. Keep them inside a horizontal band of about 40% of the image height, so a desktop stage can keep the picture full-bleed. If they don't fit, the picture shrinks until every cut is in view rather than cropping one off.

`paintHarbour(width?)` is exported too. It resolves to an object URL of the default picture, and the `HARBOUR_PIECES` / `HARBOUR_SENTENCE` constants describe it.

## Props

| Prop | Default | Notes |
|---|---|---|
| `src` | painted harbour | Any image URL. |
| `alt` | harbour description | Alt text for the picture. |
| `imageAspect` | `1.5` | Width ÷ height, used only until `src` has loaded. |
| `sentence` | harbour sentence | Words with `{id}` placeholders. Unknown ids are ignored. |
| `pieces` | 7 harbour pieces | `{ id, word, region, aspect? }[]`. `word` is the accessible name and the hover tag. |
| `mode` | `"scroll"` | `"scroll"` scrubs with the page; `"auto"` plays once on view. |
| `height` | `"100svh"` | Stage height. **Must be a definite length.** |
| `scrollLength` | `2.4` | Scroll mode: extra stage-heights the story takes. |
| `split` | `0.46` | Share of the stage kept for the sentence once the picture settles. It grows if the sentence needs more. |
| `pieceHeight` | `2.1` | Slot height in em. Slot width is capped at 4.6em. |
| `fontScale` | `1` | Multiplies the fluid sentence size (17–32px from the stage width). |
| `eyebrow` | `"Harbour study — 10:40, low tide"` | Small caps line over the sentence. `""` hides it. |
| `hint` | `"Scroll to read the picture"` | On the picture before it starts (scroll mode). `""` hides it. |
| `background` / `ink` / `muted` | theme tokens | Page, text, eyebrow. **Holes are painted `background`**, so they always match the page. |
| `fontFamily` | system sans | No font is loaded. |
| `className` | `""` | Appended to the root. |
| `onComplete` | none | Called when every piece has landed. Fires again after scrolling back past halfway and down again. |

## Notes

- Follows the theme through `--color-background` / `--color-foreground` / `--color-muted-foreground`, so dark mode gives dark holes. See `demo-autoplay.tsx` for fixed colours and a serif.
- The root uses `overflow: clip`, never `hidden`: `hidden` would turn it into a scroll container and the stage would stop sticking.
- Progress is measured off the element by ScrollTrigger, never `window.scrollY`, so the section works anywhere on a page.
- One progress value drives everything. Each frame writes transforms straight to the DOM, and React only re-renders when props change. Words, braces and outlines are skipped when their value hasn't moved.
- Every position is pure maths over measured rects: the hole, the slot, a bowed Bézier between them, and a crop that covers the window. A resize re-measures and redraws at the current progress. Those functions sit in `// #region cutout` and are run by `tests/cutout-sentence.test.mjs`.
- On narrow screens the sentence wraps naturally, with the pieces inline. If the picture has to shrink to keep every cut in view, the sentence and picture are centred together as one group.
- The painted harbour is about 2400 × 1600 (1600 wide under 700px of viewport). It's drawn in chunks so the page stays responsive. Software-rendered browsers (headless CI) take a second or two; a GPU-backed browser is much faster. A neutral tone fills the frame until it's ready.
