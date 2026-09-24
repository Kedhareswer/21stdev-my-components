# Waving Portfolio Landing

A red-on-paper poster landing page with a cinematic intro. The poster reads as
two rows of tall condensed capitals sharing one giant letter:
**P [O] RT / F [O] LIO**, with an ink-drawn character leaning out of the gap.

The intro, in order:

1. **Letter storm.** Seven rows of solid and hollow capitals stream across the
   screen in opposite directions, then shutter shut one by one.
2. **Slot-reel headline.** Every letter rolls in from a reel of random
   capitals, sweeping left to right. The giant shared letter lands last and
   the whole poster thumps.
3. **Details.** The rules draw themselves and their dots pop, the labels decode
   from random letters, the dice corners slide in, and the signature is written
   stroke by stroke.
4. **The character.** He rises from behind the baseline, raises his arm, waves
   with a grin and a speech bubble, then leans into the final pose.

After that he keeps breathing and blinking, and every few seconds he gives a
small wave.

```tsx
import WavingPortfolioLanding from "@/components/ui/waving-portfolio-landing"

<WavingPortfolioLanding
  name="Maya Iyer"
  year="2027"
  roles={["Motion Designer", "Animator"]}
  lettersLeft={["HEL", "WOR"]}
  giantLetter="L"
  lettersRight={["O", "D"]}
  title="Hello World"
  accent="#2346ff"
/>
```

**No dependencies beyond React.** The letters, character, dice and signature
are all drawn as SVG in the file. No fonts, images or stylesheets load.

## Play with it

| Do this | And |
|---|---|
| Move the pointer | His eyes and head follow it; the letters and the character drift apart in parallax |
| Hover a letter | It spins its reel again |
| Hover, click or focus + Enter the character | He waves back and says hello |
| Click a dice corner | It rolls |
| Click the paper | A burst of letters flies out |
| Click the signature | Replays the whole intro |

## Props

| Prop | Default | Description |
|---|---|---|
| `name` / `year` | `"Arin Varma"` / `"2026"` | Top labels. |
| `roles` | `["Graphic Designer", "Illustrator"]` | Bottom labels. |
| `lettersLeft` | `["P", "F"]` | Top and bottom rows left of the giant letter (right-aligned against it). |
| `giantLetter` | `"O"` | The one tall letter both rows share. |
| `lettersRight` | `["RT", "LIO"]` | Top and bottom rows right of the character (left-aligned). |
| `title` | `"Portfolio"` | What the headline says, for screen readers. |
| `signature` | first name, split | Signature badge; `/` breaks the line. |
| `greeting` | `"Hi there!"` | Speech bubble text. |
| `accent` / `paper` / `ink` | `#e5262c` / `#f6f4f0` / `#141414` | Poster colours. `ink` also colours the character. |
| `intro` | `true` | Play the intro. With `false` the page appears finished, and the signature makes him wave instead. |
| `height` | `"100svh"` | Root height. Always a definite length. |
| `className` | `""` | Extra classes on the root. |

Letters are A–Z; anything else is dropped.

## Notes

- The poster scales with its own box. In tall containers (narrower than
  0.9:1) it tightens the gap and shrinks the character, so it fills a phone's
  width.
- The drawn headline is `aria-hidden`. A visually hidden `<h1>` carries
  `title`, and a paragraph carries the name, roles and year. The dice, the
  signature and the character can all be reached with the keyboard.
- `prefers-reduced-motion`: no intro, parallax, reels or bursts. The page
  shows its finished state.
