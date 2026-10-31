# Cutout Sentence

A landing-page section where a photograph drops pieces of itself into the words that describe it.

It opens on one **full-bleed photo**. As you scroll:

1. **Settle.** The photo's lower edge rises, so it moves with the scroll instead of against it. The photo settles into the top half and a quiet grey page opens below.
2. **Write.** The sentence writes itself underneath, word by word out of a blur. Every image slot is an empty pair of braces waiting: `A {      }kaleidoscope of {      }painted {      }wings…`
3. **Score.** Thin white cut lines are traced around small rectangles in the photo.
4. **Lift and drop.** One by one, in reading order, each rectangle lifts toward you (a white cut edge, a shadow, a small rise) and leaves a clean **hole the colour of the page**. Then it drops into its braces. Mid-air it tilts and swells, and its window **re-crops**: it opens onto a little more of the photo, then closes on its slot.
5. **Land.** It settles with a small overshoot, beside the word it shows, and the braces clamp around it.

Scroll back and it all runs backwards: every piece rises home and fills its own hole exactly.

The default sentence follows the reference this was built from:

> A { ▢ }kaleidoscope of { ▢ }painted { ▢ }wings dances { ▢ }across the { ▢ }vast and { ▢ }tranquil cerulean { ▢ }sky.

**Requires `gsap`** (ScrollTrigger). The default photo, a generated flock of painted pigeons, is served from this repo's `media/cutout-sentence/flock.jpg` through jsDelivr (`@main`). Pass your own `src` to use any image.

## Interaction

- **Scroll** (`mode="scroll"`, the default): the section is `1 + scrollLength` stage-heights tall and the stage is `sticky`. Progress is scrubbed with a little smoothing, so wheel steps don't stutter.
- **First impression:** before you scroll, the cut lines trace themselves once over the full photo, then fade. It's a hint of what's about to come apart.
- **Autoplay** (`mode="auto"`): the stage is one `height` tall. It plays once when it scrolls into view, and a **Replay** button rewinds it (the pieces rise home) and plays it again.
- **Once settled**, hover a piece in the sentence and it lifts while its hole in the photo pulses with its word as a tag. Hovering a hole does the same in reverse.
- **Reduced motion:** the finished sentence with every piece in place, from the start. No scroll track, no flight. Hovering still works.

## Usage

```tsx
import CutoutSentence from "@/components/ui/cutout-sentence"

<CutoutSentence />
```

Give it a parent with a width (see `demo.tsx`). For your own photo, write a sentence with `{id}` placeholders and describe each piece:

```tsx
<CutoutSentence
  src="/harbour.jpg"
  imageAspect={3 / 2}
  sentence="Painted {boats}boats doze by the old {pier}pier, as a lone {buoy}buoy bobs on {water}turquoise water."
  pieces={[
    { id: "boats", word: "boats", region: [0.17, 0.55, 0.11, 0.14] },
    { id: "pier",  word: "pier",  region: [0.02, 0.45, 0.12, 0.12] },
    { id: "buoy",  word: "buoy",  region: [0.66, 0.56, 0.08, 0.09] },
    { id: "water", word: "turquoise", region: [0.72, 0.41, 0.12, 0.12], aspect: 1.6 },
  ]}
/>
```

- `region` is `[x, y, width, height]` as fractions of the image (0–1), so it doesn't depend on the image's pixel size. The cut is exact: the piece is that region, and the hole it leaves is that region.
- **Write `{id}word`** (no space) and the braces hug that word on the same line, as in `{ ▢ }sky`. `word{id}` hugs the word before; `word {id} word` stands on its own.
- The slot takes the region's own shape, capped at 5em wide. Give `aspect` for another shape, and the piece re-crops to it as it lands.
- Keep regions from overlapping. Keep them inside a horizontal band of about 45% of the image height, so a desktop stage can keep the photo full-bleed. If they don't fit, the photo shrinks rather than cropping a cut off.

`FLOCK_SRC`, `FLOCK_SENTENCE` and `FLOCK_PIECES` are exported. `demo-autoplay.tsx` reuses the default cuts with a different sentence.

## Props

| Prop | Default | Notes |
|---|---|---|
| `src` | `FLOCK_SRC` | Any image URL. |
| `alt` | flock description | Alt text for the photo. |
| `imageAspect` | `1.5` | Width ÷ height, used only until `src` has loaded. |
| `sentence` | the flock sentence | Words with `{id}` placeholders. Unknown ids are ignored. |
| `pieces` | 7 flock pieces | `{ id, word, region, aspect? }[]`. `word` is the accessible name and the hover tag. |
| `mode` | `"scroll"` | `"scroll"` scrubs with the page; `"auto"` plays once on view, with a Replay button. |
| `height` | `"100svh"` | Stage height. **Must be a definite length.** |
| `scrollLength` | `2.6` | Scroll mode: extra stage-heights the story takes. |
| `split` | `0.48` | Share of the stage kept for the sentence once the photo settles. It grows if the sentence needs more. |
| `pieceHeight` | `2.9` | Slot height in em, about three times the text height, as in the reference. |
| `fontScale` | `1` | Multiplies the fluid sentence size (17–32px from the stage width). |
| `eyebrow` | `""` | Optional small caps line over the sentence. |
| `hint` | `"Scroll to read the picture"` | On the photo before it starts (scroll mode). `""` hides it. |
| `background` | 7.5% ink over the page | Light grey on a light theme, near-black on a dark one. **Holes are painted `background`**, so they always match the page. |
| `ink` / `muted` | theme tokens | Text and eyebrow. |
| `fontFamily` | system sans | No font is loaded. |
| `className` | `""` | Appended to the root. |
| `onComplete` | none | Called when every piece has landed. Fires again after scrolling back past halfway and down again. |

## Notes

- Follows the theme through `--color-background` / `--color-foreground` / `--color-muted-foreground`. See `demo-autoplay.tsx` for a fixed night palette and a serif.
- The root uses `overflow: clip`, never `hidden`: `hidden` would turn it into a scroll container and the stage would stop sticking.
- Progress is measured off the element by ScrollTrigger, never `window.scrollY`, so the section works anywhere on a page.
- One progress value drives everything. Each frame writes transforms straight to the DOM, and React only re-renders when props change. Words, braces and outlines are skipped when their value hasn't moved.
- Every position is pure maths over measured rects: the hole, the slot, a bowed Bézier between them, and a crop that covers the window. A resize re-measures and redraws at the current progress. Those functions sit in `// #region cutout` and are run by `tests/cutout-sentence.test.mjs`.
- On narrow screens the sentence wraps naturally, with the pieces inline and each brace pair kept with its word. The photo stays flush at the top. If it has to shrink to keep every cut in view, the sentence takes the extra room.
- The default photo loads from jsDelivr, so it needs `media/cutout-sentence/flock.jpg` on `main`. Until then, pass your own `src`.
