# Pushpin Tear Footer

A site footer made as a torn poster. An electric-blue sheet holds the footer's
chrome: back to top, socials, the **KS** monogram, copy-email, a newsletter
field, an availability line, a live local clock and two link columns. The
bottom of the sheet has been ripped away from a glossy pushpin. The brand is
printed on the paper underneath, along with the privacy and terms links, the
copyright and the handle.

The tear is drawn, not an image. It has a jagged ridge with a white fibre rim,
six curled flaps of the sheet's paper back, a drop shadow where the sheet sits
over the paper, and grain on both layers. In the monogram, the K's upper arm
ends in a pushpin head.

**No dependencies.** React is the only import. Nothing is fetched: the tear,
flaps, grain, pin, monogram and icons are SVG and canvas built from numbers.

## The opening (once, when it scrolls into view)

1. **0 ms**: the chrome assembles. Items fade up out of a blur, 45 ms apart.
   The monogram's strokes draw on and its pin head pops in.
2. **640 ms**: the pushpin drops in from above the page and lands with a small
   squash. Its shadow sharpens as it falls.
3. **1140 ms**: the pin hits, the sheet jolts, and the tear rips from under the
   pin out to both edges. It goes a little too far, then settles. The flaps
   unfold as the edge passes them.
4. **~1600 ms**: the paper's print rises in. The wordmark slides up through a
   mask and its underline draws.

With `prefers-reduced-motion`, it opens on the finished frame.

## Footer parts

- **Top bar**: back to top, socials, the monogram (links home), and the email
  address. Clicking the address copies it, with a toast.
- **Newsletter**: a white pill whose submit is the blue knob. It validates the
  address, shows "you're on the list" and calls `onSubscribe(email)`.
- **Flanks**: a small mark on the left, and on the right a live clock in your
  time zone with a blinking colon.
- **Availability**: a pinging dot and one line. It links to `status.href`, or
  to your email.
- **Columns**: two `<nav>`s, each with a title, links and a big underlined
  call to action. The second one defaults to `talk.`, which opens your email.
- **Paper**: your name, the wordmark, a "say hi" bubble, privacy and terms,
  the copyright, a credit line and your handle.
- **Pin**: click it (or press Enter or Space) and it pulls out, the tear
  re-rips along a new edge, and it stabs back in. `onRepin(seed)` fires. It
  leans toward the pointer, and the flaps lift when the pointer is near.

## Usage

```tsx
import PushpinTearFooter from "@/components/ui/pushpin-tear-footer"

<PushpinTearFooter email="you@yourdomain.com" />
```

Give it a parent with a width (see `demo.tsx`). It sets its own height
(`100svh` by default, never below 620px).

Re-brand it through props (see `demo-ember.tsx`):

```tsx
<PushpinTearFooter
  brand="ink."
  name="riso co."
  logo={<span style={{ fontSize: "1.5em", fontWeight: 600 }}>ink.</span>}
  sheet="#ff4a1c"
  paper="#f1ede4"
  paperInk="#1b1712"
  email="orders@example.com"
  timeZone="Europe/Berlin"
  timeLabel="BER"
  columns={[
    { title: "shop", links: [{ label: "Zines", href: "/zines" }], cta: { label: "shop.", href: "/shop" } },
    { title: "studio", links: [{ label: "Stockists", href: "/stockists" }] },
  ]}
  onSubscribe={(email) => fetch("/api/subscribe", { method: "POST", body: email })}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `brand` | `"kedhar."` | The wordmark on the paper. It links to `logoHref`. |
| `name` | `"kedhareswer"` | Gradient name over the wordmark. |
| `logo` / `logoHref` | KS monogram / 21st profile | Top-centre mark. Pass any node. |
| `socials` | GitHub, 21st.dev | `{ icon, label, href? }[]`. |
| `email` | `"hello@example.com"` | **Set this.** Used by copy-email, `talk.`, the status line and the bubble. |
| `newsletter` | `{ label: "new components, once a month" }` | `{ label, placeholder? }`, or `null` to hide it. |
| `status` | `{ label: "open for collaborations" }` | `{ label, href? }`, or `null`. |
| `mark` | `"KS / 2026"` | Left flank. Hidden on phones. |
| `timeZone` / `timeLabel` | `"Asia/Kolkata"` / `"IST"` | Live clock on the right flank. An empty `timeZone` hides it. |
| `columns` | index, elsewhere | `{ title, links: { label, href? }[], cta? }[]`. The first two are used. On phones each column shows two links. |
| `chat` | `{ label: "say hi" }` | The speech bubble. Defaults to your email; `null` hides it. |
| `sideLinks` | privacy, terms | Two `IconLink`s either side of the wordmark. |
| `copyright` / `credit` / `handle` | `© 2026 Kedhareswer` / `designed & built by hand` / `@kedhareswer` | The bottom line. |
| `sheet` / `paper` | `#1a7ff0` / `#f3f3f1` | Hex. The pin is shaded from `sheet`. |
| `sheetInk` / `paperInk` | `#fff` / `sheet` | Text on each layer. |
| `seed` | `7` | Picks the tear. Changing it re-rips in place. |
| `height` | `"100svh"` | Any CSS length or a number of px. |
| `fontSans` | Helvetica Neue stack | Nothing is loaded. |
| `onSubscribe` / `onRepin` | none | |
| `className` | `""` | Appended to the root `<footer>`. |

Icons: `github`, `21st`, `x`, `ig`, `linkedin`, `dribbble`, `chat`, `globe`,
`mail`, `link`, `shield`, `doc`.

## Notes

- **Definite height.** The root sets its own `height` and lays out off its own
  box (`container-type: size`, `cqmin` units). It never uses `h-full`.
- **The tear never covers the copy.** The ridge has a floor at every x, so
  nothing on the sheet ends up white on white, whatever the seed.
  `tests/pushpin-tear-footer.test.mjs` checks 400 seeds.
- Under 620px of width it becomes a phone column: tighter gutters, no flanks,
  shorter columns, and the side links move down by the bottom line.
- External links open in a new tab with `rel="noopener noreferrer"`.
  `href: "#"` and missing hrefs never touch the page's URL hash.
- The CSS is one scoped `<style>` block, with every rule under `.tpf`.
- The component paints its own palette and ignores the page's light/dark theme.
- The rip, re-rip and flap lift run one `requestAnimationFrame` loop that
  stops as soon as everything settles.

## Credit

Layout, palette and the torn-poster idea after a reference poster by
@keolatra. The tear, the pin, the monogram, the interactions and the code are
original.
