# Kiln Wordmark Footer

A brick-red closing panel for a manufacturer with a sense of its own history.
A two-line uppercase motto sits top left, a dark back-to-top key top right,
then three columns (address, navigation, follow), a giant lowercase wordmark,
and a legal bar in an outlined pill.

Behind it all is a **tile**: a dark red field, a big orange-red disc and a
slab, like glaze on a fired ceramic.

The wordmark is **not a font**. It's drawn from a small procedural geometric
alphabet (a–z, `-`, `.`, space): superellipse bowls, flat stems and cut
terminals, all built from numbers. Because the stroke weight is a number, the
letters can swell like a variable font.

**No dependencies.** React is the only import. No images or fonts are loaded.
Every shape is inline SVG, and the text uses whatever sans the page already
has.

## Interaction

- **Wordmark lens**: move the pointer along the wordmark and the letters
  under it swell to a heavier weight, then ease back when it leaves. Each
  letter's advance stays fixed, so the word never shifts sideways.
- **Stamp**: click a letter and it presses flat, springs back, and briefly
  goes extra heavy.
- **Tile lean**: the disc drifts toward the pointer anywhere over the panel.
- **Turn the tile**: click any empty part of the panel and the tile eases to
  its next composition. There are four: disc left with slab right (the
  default), the mirror of that, a rising half-sun, and a quarter disc in the
  corner. Fires `onTileChange(index)`.
- **Links**: an ink block wipes in behind the label and the text knocks out
  to the surface colour. Keyboard focus gets the same.
- **Back to top**: the key rounds into a pill and lifts on hover, and its
  arrow shoots out the top and comes back in from below. A click
  smooth-scrolls the page to the top, or calls `onBackToTop` if you pass one.
- **Reveal**: the first time the footer is on screen, the columns fade up in
  sequence and the letters rise out of the baseline one by one.

## Usage

```tsx
import KilnWordmarkFooter from "@/components/ui/kiln-wordmark-footer"

<KilnWordmarkFooter />
```

Give it a parent with a width and nothing else (see `demo.tsx`). Its height
comes from its content.

Re-brand, re-word and re-ink it through props (see `demo-cobalt.tsx`):

```tsx
<KilnWordmarkFooter
  brand="Tessuto"
  motto={["Woven slow", "since 1931"]}
  address={["Via dei Telai, 4", "↳ 22100 Como", "Lombardy — Italy"]}
  navigation={[[{ label: "Fabrics", href: "/fabrics" }, { label: "Archive", href: "/archive" }]]}
  socials={[[{ label: "Instagram", href: "https://instagram.com/you" }]]}
  surface="#2a49d6" deep="#1a2f9e" ink="#efe9dc" paper="#1a2f9e"
  weight={0.85}
  defaultTile={3}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `brand` | `"Corvena"` | Address heading, copyright, and the wordmark. |
| `wordmark` | `brand` | What the giant mark spells. It's lowercased. If any character is outside a–z, `-`, `.` or space, the mark falls back to stretched text in `fontSans`. |
| `motto` | `["Ahead", "by tradition"]` | One entry per line. Set in uppercase. |
| `address` | three lines | Lines under the brand. Whitespace is kept. |
| `navigationTitle` / `navigation` | `"Navigation"` / 4 columns | `{ label, href? }[][]`, one array per column. |
| `followTitle` / `socials` | `"Follow"` / 2 columns | Same shape. |
| `year` / `registry` / `legal` | `2026` / small print / Legal, Privacy, Cookies | The bar. |
| `surface` / `deep` | `#c42b1c` / `#a5080d` | Disc and slab / the field behind them. |
| `ink` / `paper` | `#1f1c1b` / `#f3eee7` | Text, wordmark and key / the arrow on the key. |
| `fontSans` | grotesk system stack | Nothing is loaded. Pass a family your page already loads. |
| `weight` | `1` | Resting weight of the wordmark, `0.5`–`1.4`. |
| `lens` | `true` | `false` keeps the wordmark at its resting weight under the pointer. |
| `defaultTile` / `onTileChange` | `0` / none | Starting composition (`0`–`3`), and a callback on every turn. |
| `onLinkClick` | none | `(label, href)` for every link. |
| `onBackToTop` | smooth scroll to top | Replaces the default. |
| `className` | `""` | Appended to the root `<footer>`. |

## Notes

- **Intrinsic height.** There's no `height` prop and no percentage height on
  the root. The wordmark's height comes from its viewBox, and the gap above
  the columns is in `cqw`.
- Sizes are in container units (`cqw`) of the component's own width, so it
  scales with its column, not the viewport. Under 720px of width, the address
  and follow columns sit side by side, navigation goes under them, and the
  legal bar wraps.
- The CSS is one scoped `<style>` block, and every rule sits under `.kwf`.
  Element resets go through `:where(.kwf)` so they never out-rank your
  classes.
- It paints its own palette and ignores the page's light/dark theme. For a
  light panel, pass a light `surface`/`deep` and a dark `ink`.
- The pointer lens and tile lean write straight to the SVG from one
  `requestAnimationFrame` loop. Moving the pointer never re-renders React,
  and the loop sleeps once everything settles.
- Links with `href: "#"` or no href never touch the page's URL hash.
- With `prefers-reduced-motion`, nothing reveals, eases or stamps: the tile
  and the letter weights jump straight to their targets, and the key's arrow
  stays put.

## Credit

Layout and palette are after a reference shot of an Italian ceramics
manufacturer's site footer. The brand, copy, alphabet, tile compositions,
interactions and code are original.
