# String Tie Footer

A "thank you" footer built like a string-and-button envelope. A white paper
flap with deep rounded corners sits over a dark body. Two blue paper buttons
with metal grommets sit on the seam, and a cord is wound round them in a
figure eight. Above the seam: the headline, two taped labels and three small
meta labels. Below it: email, phone and links on the left, and "Warm Regards"
with a signature on the right.

**No dependencies.** React is the only import, and nothing is fetched. The
buttons (paper fibre lighting, grommets), the cord and the paper grain are
inline SVG. The signature is a drawn path.

## What happens

1. **Arrival.** The first time the footer is seen, the meta labels drop in.
   The headline rises letter by letter out of a mask, and the two labels are
   taped down left to right, one after the other. The contacts and regards
   fade up.
2. **The wind.** The cord starts loose and winds shut as the footer scrolls
   into view, the top button turning as the cord goes round it. The wind
   follows the scroll, so scrolling back up loosens it. It is eased and
   rate-limited, so a footer that's already fully on screen still visibly
   ties itself.
3. **The signature.** Once the cord is fully wound, the signature writes
   itself in, one stroke after another, at pen speed.
4. **Opening.** Click either button (or press Enter or Space on it). The cord
   unwinds, the flap folds back from its edge (the top button goes with it),
   and a note slides out of the envelope with a mail button. "Tie it back up",
   or clicking the bottom button, folds the flap down and winds the cord back
   on.
5. **The loose cord.** The cord is a small verlet rope that lies flat on the
   table: no gravity, only friction. Grab any part of it and drag. It stays
   where you leave it. Moving the mouse past it nudges it along.

Smaller touches: hovering a headline letter lifts it, the tapes peel up a
little on hover, the buttons lift, clicking the email copies it (with a
"Copied" chip, and a screen reader hears it too), and link underlines wipe
away with an arrow on hover.

## Usage

```tsx
import StringTieFooter from "@/components/ui/string-tie-footer"

<StringTieFooter />
```

Give it a parent with a width. To see the scroll-wind, put it at the end of a
page (see `demo-scroll.tsx`).

```tsx
<StringTieFooter
  meta={["Portfolio", "2021–2026", "Selected work"]}
  title="Thank"
  titleAccent="You"
  tapes={["Looking Forward to", "Connect with You!"]}
  email="you@studio.com"
  phone="+44 20 0000 0000"
  links={[{ label: "github.com/you", href: "https://github.com/you" }]}
  signatureText="Your Name"
  note={{ kicker: "P.S.", text: "Two spots open this spring.", cta: "Start a project" }}
  accent="#1f78d1"
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `meta` | `Creative`, `2023–2026`, `Design` | Up to three, shown in brackets. The middle one hides under 640px, and also goes on the note's postmark. |
| `title` / `titleAccent` | `"Thank"` / `"You"` | The accent word is italic. `""` hides it. The headline doesn't wrap, so keep it short. |
| `tapes` | `Looking Forward to`, `Connect with You!` | Up to two: the first on the accent colour, the second on ink. |
| `email` / `phone` | placeholder | `""` hides either one. The email copies on click. The note's button is a `mailto:` link. |
| `links` | three placeholders | `{ label, href }[]`. `http(s)` links open in a new tab. `"#"` does nothing. |
| `regards` | `"Warm Regards,"` | `""` hides it. |
| `signature` | "Mara E." | Single-stroke SVG paths in a 320 × 140 box, drawn in order. Trace your own in any vector app. `[]` hides it. |
| `signatureText` | — | Used instead of `signature`: your name in `fontScript`, revealed with a wipe. |
| `signatureLabel` | `"Signed, Mara Ellison"` | What a screen reader hears for the signature. |
| `note` | kicker, text, `"Write to me"` | `{ kicker?, text?, cta? }`. What's on the note that slides out. |
| `copiedLabel` | `"Copied"` | |
| `height` | `"100svh"` | Minimum height. The footer grows if its content needs more. |
| `paper` / `ink` / `bodyInk` | `#fff` / `#0d1115` / `#eef0f3` | Flap, body (and flap text), and body text. |
| `accent` / `cord` | `#1f78d1` / `#2c55d6` | Buttons and first tape, and the cord. |
| `fontDisplay` / `fontSans` / `fontScript` | Instrument Serif → Didot → Times / Poppins → system / Snell Roundhand → cursive | Nothing is loaded. If your page loads one of these faces, the footer uses it. |
| `grain` | `0.5` | Paper grain strength. `0` turns it off. |
| `defaultOpen` | `false` | Start opened, with the note out. |
| `onToggle` | — | `(open) => void` |
| `className` | `""` | Appended to the root. |

## Notes

- Sizes are in container units, based on the footer's own width. The button
  radius is `clamp(44px, 7cqw, 92px)`, and the flap fold, the note and the
  cord all scale from it. Under 640px the contacts and regards stack, and the
  loose cord curls straight down the middle instead of drifting right.
- The cord is drawn in an SVG over the whole footer, in that SVG's own pixels.
  The two button centres are measured from the DOM whenever the footer
  resizes (and once fonts finish loading), so the figure eight always lands
  on the grommets. The tied and loose shapes are the same length, so the rope
  never stretches between them.
- The animation loop only runs while the footer is on screen.
- SVG filter, gradient and mask ids come from `React.useId`, so two footers on
  one page don't share them.
- The closed note is `inert`: it can't be tabbed into or read until it's out.
  Both buttons carry `aria-expanded` and `aria-controls`.
- With `prefers-reduced-motion`, nothing animates. The cord is drawn tied or
  loose in place, the flap and note jump to their state, and the headline,
  tapes and signature are simply there.
- All CSS is in one scoped `<style>` block under `.stt`. Element resets go
  through `:where(.stt)`, so they never outrank your own classes. The
  component keeps its own palette and ignores the page's light or dark theme.

## Credit

The layout and mood come from a reference "Thank You" closing page in a
designer's portfolio deck. The envelope mechanics, rope, buttons, note,
signature and code are original, and the names and contacts are placeholders.
