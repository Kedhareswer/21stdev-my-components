# Receipt Work Ledger

A project index printed as an itemised statement on continuous-feed paper.

Tractor holes run down both margins, perforations cross the sheet, and every
third line sits on a faint bar, like old line-printer stock. A pixel
headline and a statement number sit over a heavy rule. Each project is one
line: **number, title with a dot leader, department, year**.

- **Filter** by department with the bracketed tabs (`[BRAND 4]`); the rows reprint left to right.
- **Sort** by number or by year.
- **Hover** a line and a small dithered print of the project follows the cursor, leaning into the motion.
- **Click** a line and it feeds open: a larger print, the summary, client / dept / year on leaders, and a `VIEW CASE ↗` link.
- A tally (items, departments, period) and a `Balance due` line close the statement.

Part of the receipt family with [`receipt-portfolio`](../receipt-portfolio),
[`receipt-order-form`](../receipt-order-form) and
[`receipt-spike-testimonials`](../receipt-spike-testimonials).

**No dependencies.** React is the only import. Each project's print is
**generated from its title** (same title, same picture) and filled with Bayer
dither; pass `image` to use your own picture through a halftone screen.

## Usage

```tsx
import ReceiptWorkLedger from "@/components/ui/receipt-work-ledger"

<ReceiptWorkLedger
  title="Index"
  account="Mira Voss"
  entries={[
    { title: "Oat & Ember identity", dept: "Brand", year: 2026, client: "Oat & Ember", summary: "…", href: "/work/oat" },
    { title: "Norte Coffee cans", dept: "Pack", year: 2025, image: "/norte.jpg" },
  ]}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `title` | `"Index"` | Pixel headline. |
| `statementNo` / `account` | `14` / `"Mira Voss"` | Header. |
| `entries` | eleven projects | `{ title, dept, year, client?, summary?, href?, image? }[]`. Tabs come from `dept`, in first-seen order. |
| `balance` | `"Your project"` | `Balance due` line. `""` hides it. |
| `width` | `760` | Sheet width in px; shrinks to fit. Under 560px of sheet the DEPT column folds away and type grows. |
| `height` | `"100svh"` | Minimum wall height. **Must be a definite length.** |
| `wall` / `paper` / `ink` | warm greys, near-black | Palette. Holes are punched in the `wall` colour. |
| `band` | 4.5% ink | The line-printer bar. `""` turns it off. |
| `fontMono` | Courier stack | No font is loaded. |
| `preview` | `true` | The print that follows the cursor (mouse only; hidden on touch). |
| `onSelect` | none | `(index)` of the opened entry, `-1` on close. |
| `className` | `""` | Appended to the root. |

## Notes

- The cursor print runs on its own rAF loop and writes its transform directly, so moving the mouse never re-renders the list.
- `prefers-reduced-motion`: the print tracks the cursor 1:1, rows don't reprint, lines open without stepping.
