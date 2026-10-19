# Pushpin Tear Footer

A closing section made as a poster: an electric-blue sheet pinned over plain
paper. The bottom of the sheet has been torn away. Your brand is printed on the
paper underneath, and the footer's controls sit on the blue.

The tear is drawn, not an image. It has a jagged ridge with a white fibre rim,
six curled flaps of the sheet's paper back (four hang into the tear, two curl
back over the blue), a drop shadow where the sheet sits over the paper, and
grain on both layers. The pin is a glossy plastic pushpin drawn in SVG and
shaded from whatever colour the sheet is.

**No dependencies.** React is the only import. Nothing is fetched: the tear,
flaps, grain, pin and icons are SVG and canvas built from numbers.

## The opening (once, when it scrolls into view)

1. **0 ms**: the poster's interface assembles. Items fade up out of a blur,
   45 ms apart, and the loop mark draws itself.
2. **640 ms**: the pushpin drops in from above the page and lands with a small
   squash. Its shadow shrinks and sharpens as it falls.
3. **1140 ms**: the pin hits, the sheet jolts, and the tear rips from under the
   pin out to both edges. It goes a little too far, then settles. The flaps
   unfold as the edge passes them.
4. **~1600 ms**: the paper's print rises in. The wordmark slides up through a
   mask, its underline draws, and the progress stat counts up.

With `prefers-reduced-motion` (or the calm switch on), it opens on the finished
frame.

## Interaction

- **Pin**: click it, or press Enter or Space. It pulls out, the tear re-rips
  along a new edge (the old flaps fold away and new ones open), and the pin
  stabs back in. `onRepin(seed)` fires. On hover it lifts slightly and its
  shadow stretches. It leans toward the pointer.
- **Flaps**: they lift toward a nearby pointer.
- **àcc switch**: calm mode. All motion stops, and any re-rip after that jumps
  straight to the new edge.
- **súb switch**: the contact picker turns into an email field. Submitting
  checks the address, shows "you're in." and calls `onSubscribe(email)`.
- **Contact picker** (`⟨ O'BRIEN ⟩`): steps through `contacts`. The name
  slides in from the side you clicked, and the handle in the bottom corner
  follows it. `onContactChange(index)`.
- **Swatches**: swap the colourway, giving a paper sheet torn over a blue
  ground. The pin turns white and the inks cross-fade.
  `onColorwayChange(inverted)`.
- **Top bar**: back to top, socials, copy the page link (with a toast), and
  full screen (only where the browser supports it).
- **Speech bubble**: its dots type, and on hover it opens to show `chat.label`.
- **Links**: the stats underline-shift, side links draw an underline, and
  icons nudge.

## Usage

```tsx
import PushpinTearFooter from "@/components/ui/pushpin-tear-footer"

<PushpinTearFooter />
```

Give it a parent with a width (see `demo.tsx`). It sets its own height
(`100svh` by default, never below 620px).

Re-brand and re-ink it through props (see `demo-ember.tsx`):

```tsx
<PushpinTearFooter
  brand="ink."
  eyebrow="riso co."
  sheet="#ff4a1c"
  paper="#f1ede4"
  paperInk="#1b1712"
  seed={23}
  progress={{ label: "sold out", value: "86,2%" }}
  utility={{ label: "etc.", links: [{ icon: "globe", label: "Stockists" }], word: { label: "shop.", href: "/shop" } }}
  onSubscribe={(email) => fetch("/api/subscribe", { method: "POST", body: email })}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `brand` | `"adv."` | The wordmark on the paper. Also links to `logoHref`. |
| `eyebrow` | `"studio"` | The small gradient word above it. |
| `logo` / `logoHref` | loop mark / `"#"` | Top-centre mark. Pass any node. |
| `socials` | chat, Telegram | `{ icon, label, href? }[]` next to back-to-top. |
| `switchLabels` | `["àcc", "súb"]` | Labels over the calm and newsletter switches. |
| `edition` | `["V. 2505", "ED. 5251"]` | The two marks flanking the switches. An empty string hides one. Hidden on phones. |
| `contacts` | four fictional contacts | `{ name, role?, handle, href? }[]`. The name is in the picker, the handle in the corner. |
| `progress` | `{ label: "version", value: "50,5%" }` | Counts up in its own format (`50,5%`, `1,200`, `€3.450,75`). A `%` value also fills the bar. |
| `utility` | `ect.`, press kit + privacy, `mod.` | `{ label, links: IconLink[], word: { label, href? } }`. |
| `sideLinks` | `web`, `25,05` | Two `IconLink`s either side of the wordmark. On phones they move beside the swatches. |
| `chat` | `{ label: "say hi", href: "mailto:…" }` | The speech bubble. |
| `apps` | App Store, Google Play | `IconLink[]`, bottom left. |
| `legal` | `© 2026 adv.`, Privacy, Terms | Bottom centre. An item with no `href` is plain text. |
| `sheet` / `paper` | `#1a7ff0` / `#f3f3f1` | The two layers. Hex. |
| `sheetInk` / `paperInk` | `#fff` / `sheet` | Text on each. |
| `defaultInverted` | `false` | Start on the swapped colourway. |
| `seed` | `7` | Picks the tear. Changing it re-rips in place. |
| `height` | `"100svh"` | Any CSS length or a number of px. |
| `fontSans` | Helvetica Neue stack | Nothing is loaded; pass a family your page already has. |
| `onSubscribe` / `onRepin` / `onContactChange` / `onColorwayChange` | none | |
| `className` | `""` | Appended to the root `<footer>`. |

Icons: `chat`, `plane`, `at`, `f`, `x`, `ig`, `dribbble`, `globe`, `mail`, `link`,
`shield`, `apple`, `android`.

## Notes

- **Definite height.** The root sets its own `height` and lays out off its own
  box (`container-type: size`, `cqmin` units), not the viewport. It never uses
  `h-full`.
- **The tear never covers the copy.** The ridge has a floor at every x, so
  nothing on the sheet ends up white on white and nothing on the paper ends up
  on the blue, whatever the seed. `tests/pushpin-tear-footer.test.mjs` checks
  400 seeds.
- Under 620px of width it becomes a phone column: tighter gutters, the side
  links move down beside the swatches, and the edition marks are hidden.
- The CSS is one scoped `<style>` block, with every rule under `.tpf`.
  Element resets go through `:where(.tpf)`.
- The component paints its own palette and ignores the page's light/dark theme.
- `href: "#"` and missing hrefs never touch the page's URL hash.
- The rip, re-rip and flap lift run one `requestAnimationFrame` loop that
  stops as soon as everything settles. While nothing moves, no frames run.

## Credit

Layout, palette and the torn-poster idea after a reference poster by
@keolatra. The tear, the pin, the interactions and the code are original.
