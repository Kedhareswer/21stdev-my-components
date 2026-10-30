# Signature Pen Footer

A closing footer that signs off for you. A white stylus writes one word in a
flowing script, stroke by stroke, then lifts and rests beside it. A thank-you
line, a short note, two actions and a quiet legal bar settle in underneath.
It fits the end of a signing flow, a checkout, a case study or a portfolio.

**No dependencies.** React is the only import, and nothing is fetched. The
handwriting is built-in single-stroke script glyph data, smoothed into curves
when the word is laid out. The pen, its shading and its cast shadow are SVG.

## Storyboard

1. **Waiting.** A faint dotted signature line with an × sits on the page.
2. **Landing.** When the footer comes into view, the pen glides in from the
   top-right corner and comes down. Its shadow slides in under it until it
   meets the nib.
3. **Writing.** The word is written in a real writing order. Letters that
   flow into each other are one movement. Between separate strokes the pen
   lifts in a small arc, and its shadow lets go of the nib. The i-dots and
   t-bars are saved for the end, the way people write. The pen leans a
   little into the direction it's moving. The ink runs from light to deep
   along the word, with a soft wet bleed under the line.
4. **Settling.** At about three quarters of the way through, the title fades
   up word by word, then the note, the buttons and the bar.
5. **Signed.** The pen lifts off and hovers beside the word, breathing
   slightly. The signature line gives way to a stamp in the bar:
   `Signed 30 Oct 2026, 14:02 · ID A7B2-CEC3`. The time is when the pen
   lifted, and the ID is a hash of the word.

With `trigger="scroll"`, steps 2 to 5 are scrubbed by scroll instead. The pen
writes as the footer comes up and un-writes if you scroll back.

## Interaction

- **Pen.** After signing, the pen hovers after a mouse or stylus over the
  signature. Press and drag to write with it. That ink dries and fades after
  a couple of seconds, so the signature stays clean. Touch doesn't write, so
  the page still scrolls. Turn this off with `interactive={false}`.
- **Sign again.** Hover the signature (it's always shown on touch screens).
  The pen lifts away, the ink fades, and the whole thing is signed afresh.
- **Buttons** lift on hover and press in on click. **Links** draw an
  underline in from the left.

## Usage

```tsx
import SignaturePenFooter from "@/components/ui/signature-pen-footer"

<SignaturePenFooter />
```

Re-word and re-brand it through props (see `demo.tsx` and `demo-scroll.tsx`):

```tsx
<SignaturePenFooter
  trigger="scroll"
  word="Thank you"
  title="Thanks for reading all the way down"
  actions={[
    { label: "Read the next one", href: "/next", variant: "secondary" },
    { label: "Start a project", href: "/contact", variant: "primary" },
  ]}
  brand="Mira Okafor"
  inkFrom="#a3a0f5"
  inkTo="#4338ca"
  accent="#4338ca"
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `word` | `"Finished"` | What the pen writes. One or two words read best. |
| `title` / `description` | completion copy | `""` hides either one. |
| `actions` | Create account, Log in | `{ label, href?, variant?, onClick? }[]`. If `variant` is left out, the last one is primary. |
| `brand` | `"Inkwell"` | Shown in the bar with a small mark in the ink colour. `""` hides it. |
| `links` | five legal links | `{ label, href? }[]`. |
| `legal` | `"© <year> <brand>"` | `""` hides it. |
| `stamp` | live timestamp + ID | Any string to replace it, `""` to hide it. |
| `trigger` | `"view"` | `"view"` writes once on entering the viewport. `"scroll"` scrubs with scroll. |
| `duration` | `2.6` | Seconds the nib spends on paper. Lifts and the fly-in come on top. |
| `interactive` | `true` | Lets visitors write with the pen afterwards. |
| `theme` | `"auto"` | `"auto"` follows a `.dark` ancestor. Also `"light"` / `"dark"`. |
| `inkFrom` / `inkTo` | `#8db2ee` / `#1f56cc` | Ink gradient, left to right. Dark mode brightens it. |
| `accent` | `#2b63d9` (dark `#4f86ff`) | Primary button. |
| `background` / `foreground` | theme | Override the surface and text colours. |
| `height` | `"100svh"` | Minimum height. The section grows if its content needs more room. |
| `fontSans` | Lato → Inter → system | Nothing is loaded. If your page loads Lato, the copy uses it. |
| `onSigned` | — | Fires when the pen lifts off, and again after each "Sign again". |
| `className` | `""` | Appended to the root. |

## Notes

- **The script** covers printable ASCII. Accents are stripped (`élan` →
  `elan`), and any other character becomes a space.
- The signature is sized from the component's own width (`cqw`), so it
  works in a narrow column too. Under 640px the bar stacks and the ink gets
  a little heavier.
- All CSS is in one scoped `<style>` block under `.spf`. Element resets go
  through `:where(.spf)`, so they never outrank your own classes.
- The pen's barrel runs off the edge of the section on purpose. The root uses
  `overflow: clip` so it can't cause sideways scrolling.
- The pen is driven by one `requestAnimationFrame` loop that writes SVG
  attributes directly. React doesn't re-render while it moves.
- With `prefers-reduced-motion`, the word is simply there, already signed,
  with the pen resting beside it. There's no fly-in, no writing, no
  following and no fades.

## Credit

The layout and mood are based on a reference e-signature "Finished" screen.
The glyphs are derived from **EMS Allure** by Sheldon B. Michaels (SVG
conversion by Windell H. Oskay, Evil Mad Scientist), itself a derivative of
**Allura** by Rob Leuschke, TypeSETit. All are under the SIL Open Font License
1.1, via the `hersheytext` package. They're re-encoded as compact integer
polylines. The same hand is used in `longhand-notes-landing`. The pen,
shadow, timeline and code are original, and the brand and copy are
placeholders.
