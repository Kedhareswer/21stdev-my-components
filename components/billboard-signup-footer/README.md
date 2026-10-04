# Billboard Signup Footer

A loud, single-colour closing section. The brand is set as a giant condensed
wordmark that grows out of the footer's body, cropped by the top edge. Under it
sit an email pill, a row of socials, four link columns and a slogan ticker,
with a chat bubble parked on the ticker.

The wordmark is **not a font**. It is drawn from a built-in stroke alphabet
(A–Z, 0–9, space, `- . ! '`) as inline SVG, so it looks the same on every
installer's machine and nothing is downloaded.

**No dependencies.** React is the only import. No images, fonts or requests.

## Interaction

- **Piano-key letters**: the letters under the pointer sink into the body,
  falling off smoothly with distance. **Click** a letter and it gets struck: it
  dips and springs back. On touch, drag across the word.
- **Reveal**: the first time the footer is on screen, the letters rise out of
  the body one after another with a small overshoot, the column hairlines draw
  in and the links fade up.
- **Signup**: the pill checks the address. A bad address shakes the pill and
  shows a hint, and typing clears it. While `onSubscribe` runs, the button
  shows bouncing dots. On success the pill shows a check and the address, the
  button bursts into confetti, a **glissando** runs across the wordmark, and a
  "Use another email" link resets the form. Failures shake and show the message.
- **Ticker**: it slows to a crawl under the pointer. **Drag** it to scrub and
  let go to fling it, then it eases back to cruising speed.
- **Socials**: each one flips to a white disc with a tilted label.
- **Links**: an underline draws in and the label nudges right.
- **Chat bubble**: opens a small card with a status line, a message and a call
  to action. Click outside or press Escape to close it. Focus goes back to the
  bubble.

## Usage

```tsx
import BillboardSignupFooter from "@/components/ui/billboard-signup-footer"

<BillboardSignupFooter
  brand="Voltra"
  onSubscribe={async (email) => {
    const res = await fetch("/api/subscribe", { method: "POST", body: JSON.stringify({ email }) })
    if (!res.ok) throw new Error("Couldn't sign you up. Try again?")
  }}
/>
```

Give it a parent with a width and nothing else (see `demo.tsx`). Its height
comes from its content: the wordmark's height comes from its own `viewBox`, so
nothing is measured.

Re-brand and re-ink it through props (see `demo-cobalt.tsx`):

```tsx
<BillboardSignupFooter
  brand="Pulse 24"
  accent="#2342ff" paper="#eef0f7" tickerInk="#0d1033"
  ticker={{ lead: "Pulse", items: ["check, every Friday", "of the city"], speed: 90 }}
  chat={{ title: "Pulse 24 desk", status: "On air until 6pm", href: "mailto:desk@pulse24.fm" }}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `brand` | `"Voltra"` | Used for the wordmark, the ticker's lead word, the chat card's title and its avatar. |
| `wordmark` | `brand` | What the wordmark spells. Lower case is drawn as capitals. Characters the alphabet doesn't have are dropped. A short word is padded sideways, so it is never taller than 1/2.4 of the width. |
| `onSubscribe` | fake 900ms success | `(email) => void \| boolean \| string \| Promise<…>`. Called only with a valid address. Return nothing or `true` for success, a string to use as the success message, or `false` for the generic error. Throw an `Error` to show its message. |
| `placeholder` / `buttonLabel` / `tagline` | as in the reference | The tagline is the line under the pill. Status messages replace it. |
| `successMessage` / `invalidMessage` / `errorMessage` | friendly defaults | |
| `socials` | Facebook, LinkedIn, X, Instagram | `{ label, href?, icon }[]`. `icon` is `"facebook" \| "linkedin" \| "x" \| "instagram" \| "youtube" \| "github"`, or your own 24×24 SVG children. |
| `columns` | Support, Product, Company, Legal | `{ title, links: { label, href? }[] }[]`. Any number fit side by side. Under 640px they pair up. `tel:` and `mailto:` hrefs work as usual. |
| `ticker` | brand + four slogans | `{ lead, items, speed? }`. `speed` is px/s, default 60. `0` holds it still, but it can still be dragged. `false` removes the ticker. |
| `chat` | a card for the brand | `{ title?, status?, message?, actionLabel?, href? }`, merged over the defaults. `false` removes the bubble. |
| `onLinkClick` | none | `(label, href)` for every social, column and chat link. |
| `crop` | `6` | Glyph units (of a 100-unit cap) cut off the top of the wordmark. `0` shows the full letters. |
| `tracking` | `3` | Glyph units between letters. |
| `press` | `0.3` | How deep a key goes under the pointer, as a fraction of cap height. `0` turns hover pressing off. Clicks still strike. |
| `accent` | `#ff4419` | Hex. The body, the letters, the ticker's lead word, the chat bubble. |
| `paper` | `#f6f5f2` | Hex. Behind the wordmark and the ticker. |
| `ink` | `#ffffff` | Hex. Text on the accent and the button's fill. |
| `tickerInk` | `#141414` | Hex. Ticker text. |
| `fontSans` | grotesque stack, ending in the system sans | Nothing is loaded. Pass a family your page already loads. The wordmark doesn't use it. |
| `className` | `""` | Appended to the root `<footer>`. |

## Notes

- **Intrinsic height.** No `height` prop and no percentage heights. The
  wordmark is an `<svg>` at `width: 100%` with an `aspect-ratio` from its
  `viewBox`.
- **The alphabet** is centre-line paths with a 20-unit stroke on a 100-unit
  cap. Each glyph is a nested `<svg>` that clips to its own box. That trims
  miters and squares off strokes that run past the edge, which is how the `Z`,
  `T` and `V` get their flat ends.
- **No seam.** An accent strip starts half a unit above the baseline, so the
  letters and the body never show a paper-coloured hairline between them at
  fractional sizes.
- The keys and the ticker write SVG transforms and CSS straight to the DOM from
  `requestAnimationFrame`, so React never re-renders. The key loop sleeps once
  every spring settles. The ticker only runs while it is on screen.
- The chat bubble is positioned inside the footer, never `position: fixed`, so
  it can't cover the host page.
- The CSS is one scoped `<style>` block, with every rule under `.bsf`. Element
  resets go through `:where(.bsf)`, so they never out-rank the component's own
  classes or yours. It sizes off its own width with container queries.
- The footer paints its own palette and ignores the page's light/dark theme.
- `href: "#"` and missing hrefs never touch the page's URL hash. External
  `http(s)` links open in a new tab.
- `prefers-reduced-motion`: the letters are in place at once and never press
  or bounce, the ticker holds still (dragging still works), and there are no
  shakes, confetti, pulses or transitions.

## Credit

Layout and palette after a reference shot of a hiring product's footer. The
stroke alphabet, the piano-key letters, the signup states, the ticker
physics, the chat card and the code are original. The default brand
("Voltra") and copy are placeholders.
