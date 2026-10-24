# Fruit Sticker Footer

A cheerful sign-off for the end of a portfolio or site. It has a big bold
**"Thank You,"**, a fat coral script **"bye!"** that writes itself in, and four
fruit stickers slapped around it. Under them are two friendly lines, an email
pill that copies the address, your socials, and a small bar with a back-to-top
key.

**No dependencies.** React is the only import, and nothing is fetched. The
script isn't a font. It's a hand-built monoline cursive alphabet (a–z,
`! ? . , '` and space), stored as centre-lines and stroked fat with round caps.
The fruit (strawberry, banana, chili, orange, cherries, lemon, watermelon,
pear) is flat inline SVG, so it looks the same on every machine.

## Storyboard

The first time the footer scrolls into view:

1. **0 – 0.9s:** "Thank You," rises letter by letter out of a soft blur.
2. **0.45s:** the pen starts on the script. Every stroke draws at the same
   pen speed, so long loops take longer than short ticks. The pen lifts
   briefly between strokes, and the dots on `i` and `!` pop in last. A darker
   offset shadow and a thin gloss line trail it, so the word reads like a
   glossy vinyl sticker.
3. **0.7s:** the stickers slap down one after another. Each one falls in big,
   spun and see-through, then squashes onto the page with a short overshoot.
4. **~1.6s:** the script gives a little squash-and-stretch once it's
   finished writing.
5. **1.05s:** the two lines fade up, then the contact row and the bar.

After that it idles. The stickers bob gently, each on its own phase, and they
drift a few pixels against the pointer at different depths.

## Interaction

- **Script word:** click it (or Enter/Space). The pen erases the word,
  carrying on along the stroke, and writes the next farewell. The slot glides
  to the new width, so the line re-centres smoothly. Hovering it makes the
  letters do a quick wave. Fires `onFarewell(index, word)`.
- **Tap a sticker:** it flips over and comes back as a different fruit, on
  that fruit's own colour of paper. It never repeats a fruit already showing.
  Fires `onStickerSwap(index, fruit)`.
- **Drag a sticker:** it peels up (bigger, deeper shadow, a gloss sweep) and
  swings with your speed. Let go and it slaps down where you dropped it. It
  can't leave the footer. Works with touch.
- **Double-click empty space:** every sticker springs back home.
- **Keyboard:** stickers are buttons. Arrow keys move one (Shift moves it
  further), and Enter or Space swaps it.
- **Email pill:** copies the address, says *copied!* and tells screen
  readers. If there's no clipboard, it opens a `mailto:` link instead. Fires
  `onCopy(email)`.
- **Links:** a hand-drawn squiggle draws in under the label.
- **Back to top:** the arrow hops out and back. A click smooth-scrolls to the
  top, or calls `onBackToTop` if you pass one.

## Usage

```tsx
import FruitStickerFooter from "@/components/ui/fruit-sticker-footer"

<FruitStickerFooter
  email="you@studio.com"
  links={[{ label: "Instagram", href: "https://instagram.com/you" }]}
  name="Your Name"
/>
```

Give it a parent with a width (see `demo.tsx`). Re-word, re-ink and
re-sticker it through props (see `demo-remix.tsx`):

```tsx
<FruitStickerFooter
  headline="Stay fresh,"
  farewells={["see ya!", "cheers!", "toodles!"]}
  accent="#7b3fe4"
  background="#eef3e2"
  ink="#1d2416"
  stickers={[
    { fruit: "watermelon", x: 3, y: 70, size: 0.9, rotate: -10 },
    { fruit: "cherry", x: 56, y: -24, size: 0.7, behind: true },
  ]}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `headline` | `"Thank You,"` | The bold line. Set in `fontSans`, weight 700. |
| `farewells` | `["bye!", "ciao!", "later!", "adios!", "cheers!"]` | Click to cycle. Capitals and accents fold (`Adiós!` → `adios!`). Characters outside the alphabet take a space. |
| `lines` | two lines | One `<span>` per line under the headline. |
| `email` | `"hello@noravale.studio"` | The copy pill. |
| `links` | 4 socials | `{ label, href? }[]`. |
| `name` / `year` | `"Nora Vale"` / `2026` | The © line. |
| `stickers` | strawberry, banana, chili, orange | `{ fruit, x, y, size?, rotate?, color?, shape?, behind? }[]`. `x`/`y` are the centre in % of the headline block. `size` is the height as a fraction of the headline's font size. `shape: "oval"` is 1.3× wider. `behind` tucks it under the text. |
| `accent` | `#ff5a3c` | Script colour. Its shadow is mixed from it. |
| `ink` / `muted` / `background` | the page's `--color-foreground` / `--color-muted-foreground` / `--color-background` | So it follows light and dark themes. The fallbacks are warm paper and ink. |
| `fontSans` | grotesk system stack | Nothing is loaded. Pass a family your page already loads. |
| `height` | `100svh` | Minimum height. The content can make it taller. |
| `onFarewell` / `onStickerSwap` / `onCopy` / `onLinkClick` / `onBackToTop` | none | Callbacks. |
| `className` | `""` | Appended to the root `<footer>`. |

## Notes

- **Height.** `height` is applied as `min-height`, and nothing inside uses
  percentage heights. It renders the same with or without an
  `html, body { height: 100% }` chain.
- Sizes are in container units (`cqw`) of the footer's own width, so the
  composition scales with its column, not the viewport. Under 640px it uses a
  larger type ratio, and the contact row and bar stack.
- The CSS is one scoped `<style>` block. Every rule sits under `.fsf`, and
  element resets go through `:where(.fsf)` so they never out-rank your
  classes.
- The sticker springs, tilt and parallax run from one `requestAnimationFrame`
  loop that writes transforms directly. Moving the pointer never re-renders
  React, and the loop sleeps once everything settles. Drag offsets are stored
  as fractions of the headline's width, so they stay put when the footer
  resizes.
- The script draws with `pathLength="1"` dashes. Dots are circles, not
  zero-length strokes, because a zero-length path never dashes in.
- With `prefers-reduced-motion`, everything is shown at once: no entrance,
  bob, parallax, flip or erase. Farewells and fruit swap instantly, and
  dragging still works without the spring.
- Links with `href: "#"` or no href never touch the page's URL hash.

## Credit

Layout and mood are after a "Thank You, bye!" closing-slide reference. The
script alphabet, fruit illustrations, interactions and code are original.
