# Receipt Portfolio

A one-page portfolio printed on a till roll.

A chrome printer slot is screwed to the wall. When the piece scrolls into
view it **feeds out a thermal receipt** in jerky printer steps: a pixel-font
headline over a heavy rule, the receipt header (number, date, cashier,
terminal), an italic note, and one **line item per section** of your
portfolio, dot leaders running to a three-digit code. The total reads
`1 designer`.

**Click a line item** and the roll feeds a little more paper to print what is
inside: dithered illustrations, specs on dot leaders, bracketed tags and
links. **Pull the strip at the bottom** (or press FEED on the printer) and
the receipt tears off, falls, and the next copy prints with the receipt
number bumped.

Part of the receipt family: [`receipt-work-ledger`](../receipt-work-ledger),
[`receipt-order-form`](../receipt-order-form),
[`receipt-spike-testimonials`](../receipt-spike-testimonials). Same paper,
same ink, same bitmap face, so they sit on one page as a full template.

**No dependencies.** React is the only import. No image or font is loaded:

- the headline face is a **5 × 7 bitmap** (A–Z, 0–9, `. - ! ? & ' / :`) drawn as SVG runs, with a worn-ink filter
- the six illustrations are vector shapes filled with **4 × 4 Bayer dither** patterns, like a thermal print
- the crumpled paper is a lit SVG turbulence tile; the barcodes are seeded from their text

## Interaction

- **Scroll into view**: the receipt prints once, in steps (duration scales with its length).
- **Click / Enter on a line item**: it inverts and its section prints below it. One open at a time.
- **Drag the "pull to tear" strip down**: the paper gives with resistance and tilts with your hand. Past the tear point it rips, falls away, and a fresh copy (`№002`, `№003`, …) prints. Short pulls spring back.
- **FEED** on the printer, or Enter on the strip: the same tear from the keyboard.

## Usage

```tsx
import ReceiptPortfolio from "@/components/ui/receipt-portfolio"

<ReceiptPortfolio />
```

Give it a parent with a width (see `demo.tsx`). Your own sections:

```tsx
<ReceiptPortfolio
  title="Works"
  cashier="Theo Park"
  items={[
    {
      label: "Hello",
      blocks: [
        { type: "art", art: "portrait", caption: "Theo, at the terminal" },
        { type: "text", text: "I build interfaces that load fast." },
        { type: "row", label: "Stack", value: "React / TS" },
      ],
    },
    {
      label: "Say hi",
      code: "S04",
      blocks: [{ type: "row", label: "Email", value: "theo@example.com", href: "mailto:theo@example.com" }],
    },
  ]}
  totalValue="1 engineer"
/>
```

### Blocks

| Block | Prints |
|---|---|
| `{ type: "art", art, caption? }` | a built-in dithered drawing: `portrait`, `marks`, `brand`, `box`, `glyphs`, `stamp` |
| `{ type: "image", src, alt, caption? }` | your picture through a halftone screen (grayscale, high contrast, dot mask) |
| `{ type: "text", text }` | a paragraph of small print |
| `{ type: "row", label, value, href? }` | label, dot leader, value; with `href` the value is a link |
| `{ type: "tags", items }` | `[BRAND] [PRINT]` |
| `{ type: "rule" }` | a dashed rule |

Figures are captioned `FIG. 002.1 / …` from the item's code.

## Props

| Prop | Default | Notes |
|---|---|---|
| `title` | `"Portfolio"` | Pixel headline. |
| `receiptNo` | `1` | First receipt number; each tear adds one. |
| `date` | today | `DD.MM.YYYY`, set after mount (no hydration mismatch). |
| `cashier` / `terminal` | `"Mira Voss"` / `"01"` | Header lines. The cashier's initials become the monogram in the `marks` drawing. |
| `note` | two lines | Italic note; newlines are kept. `""` hides it. |
| `items` | six sections | `{ label, code?, blocks? }[]`. An item without blocks is a plain line. |
| `totalLabel` / `totalValue` | `"Total"` / `"1 designer"` | |
| `footer` | `"Thank you. Come again."` | Under the second barcode. `""` hides both. |
| `defaultOpen` | `-1` | Item open on first print. |
| `print` | `true` | Feed out on scroll-in. `false` shows it printed. |
| `tearable` | `true` | The pull strip and the FEED button. |
| `width` | `440` | Receipt width in px; shrinks on narrow screens. All type scales with it (container units). |
| `height` | `"100svh"` | Minimum wall height. **Must be a definite length.** |
| `wall` / `paper` / `ink` | warm greys, near-black | The whole palette. It ignores the page theme; pass a dark `wall` for a dark page (see `demo-night.tsx`). |
| `fontMono` | Courier stack | No font is loaded. |
| `onOpen` | none | `(index)`, `-1` on close. |
| `onReprint` | none | `(receiptNo)` after a tear. |
| `className` | `""` | Appended to the root. |

## Notes

- The paper is hidden above the slit with `clip-path: inset(0 -400px -400vh -400px)`, so it can emerge, be pulled and fall without anything showing above the printer.
- Closed sections are `visibility: hidden` after they fold, so they leave the tab order.
- `prefers-reduced-motion`: no feed, no fall, no stepped unfold. Tearing just reprints with the next number.
