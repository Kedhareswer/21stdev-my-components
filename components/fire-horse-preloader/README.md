# Fire Horse Preloader

A Lunar New Year 2026 loading gate: **Bính Ngọ, the Year of the Fire Horse**.

1. **Ink.** On black, the load paints a flame-maned horse in seal red, from the
   hooves up, while the wordmark draws itself and the year counts up on either
   side of the horse (`00 → 20`, `00 → 26`).
2. **Seal.** At 100% a red disc floods out of the horse. The horse turns cream
   with gold linework and gold flames, the wordmark turns black and parts
   around it, the two halves of the year meet above it as `2026`, and
   *YEAR of the FIRE HORSE* sets underneath, over a field of cloud scrolls.
3. **Verse.** The card turns over to a four-season verse between the
   stem–branch glyphs 丙 and 午, a ghost of the wordmark across its foot.
4. **Lift.** The card rises off whatever it was guarding.

Tap, click, Enter or Space moves to the next step (during the load it rushes
it to 100%). Moving the pointer gives the scene a little parallax, and
hovering the horse fans its flames.

```tsx
import FireHorsePreloader from "@/components/ui/fire-horse-preloader"

// Looping showcase, nothing else on screen
<FireHorsePreloader loop />

// Page gate, driven by real progress
<FireHorsePreloader progress={loaded} onComplete={() => {}}>
  <YourPage />
</FireHorsePreloader>

// Your own card
<FireHorsePreloader
  word="Mã đáo"
  tagline="Year of the Fire Horse"
  verse={["Mã đáo [thành công]", "Vạn sự như ý"]}
  palette={{ red: "#c8102e", gold: "#e0b55a" }}
  fontFamily='"Playfair Display", serif'
/>
```

**No dependencies beyond React.** The horse, its flames and the cloud pattern
are hand-drawn inline SVG; everything moves with scoped CSS plus one
`requestAnimationFrame` loop during the load.

## Props

| Prop | Default | Description |
|---|---|---|
| `children` | — | Content revealed once the gate lifts. Ignored while `loop` is set. |
| `loop` | `false` | Cycle ink → seal → verse forever. `onComplete` never fires. |
| `progress` | — | Real progress, `0`–`100`. Leave it out to run a simulated load. The ink phase waits for `100`. |
| `durationMs` | `3600` | Length of the simulated load (it surges and stalls like a real one). |
| `word` | `"Mã hóa"` | Wordmark. Split at its first space so the halves can part; one word splits at its middle. |
| `year` | `"2026"` | Split in half either side of the horse and counted up by the load. |
| `tagline` | `"Year of the Fire Horse"` | Set under the seal. `of`, `the`, `a`, `an` go lower-case italic, the rest caps. |
| `verseTitle` | `"Bính Ngọ"` | Heading on the back of the card, and in the loading HUD. |
| `verse` | four seasons | Lines on the back. `[word]` is gilded in gold brackets. |
| `glyphs` | `["丙", "午"]` | The two glyphs flanking the verse. |
| `showVerse` | `true` | `false` skips the turn and lifts straight from the seal. |
| `palette` | see below | Partial overrides: `{ ink, red, deep, cream, gold }`. |
| `fontFamily` | Bodoni/Didot stack | Display face for the wordmark, year and tagline. Nothing is fetched. |
| `height` | `"100svh"` | Root height: a definite length, never a percentage. |
| `onComplete` | — | Fired once, after the gate has lifted. |
| `className` | `""` | Extra root class names. |

| Palette key | Default | Used for |
|---|---|---|
| `ink` | `#0b0a0a` | the loading stage, the wordmark on the seal |
| `red` | `#d9161c` | the horse while loading, then the card |
| `deep` | `#a80d13` | cloud scrolls, glyphs, the ghost wordmark |
| `cream` | `#f8f1e4` | the horse on the seal, the verse |
| `gold` | `#d2a24c` | flames, linework, verse brackets |

## Fonts

The reference lettering is a swash display italic. The component never loads a
font (no `@import`, no network): its default stack reaches for Bodoni Moda,
Playfair Display, Didot and Bodoni 72 before falling back to Georgia/Times. If
your app already loads a display face, pass it through `fontFamily`.

## Install safety

- Explicit `height`, never `h-full`.
- Every rule in the scoped `<style>` block is `.fhp-` prefixed; SVG `max-width`
  is reset against Tailwind Preflight.
- Mask and pattern ids come from `React.useId()`, so two instances on one page
  don't share a mask.
- `prefers-reduced-motion: reduce` drops the flicker, embers, bob and the 3D
  turn (the verse cross-fades instead) and lifts the gate with a fade.
- The gate is a focusable `role="progressbar"` with `aria-valuenow`.
