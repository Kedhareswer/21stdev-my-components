# Plucked String Footer

A site footer with a thin pen trace running along the foot of a huge
wordmark. The trace is a string: sweep the pointer across it and it rings, the
wave runs out to both ends and dies away. The far end lifts off the page like a
pen leaving the paper. Above it sit a heading, a line of text, an email link
and link columns. A legal row with optional social links closes it.

**No dependencies.** React is the only import. Nothing loads at runtime: the
trace is SVG, and the wordmark is set in whatever sans the page has
(Helvetica Neue → Arial fallback stack).

## Interaction

- **Strum**: move the pointer across the line and it plucks where you cross,
  harder the faster you move.
- **Tap / click** anywhere on the wordmark to pluck it.
- **Keyboard**: the wordmark is a focusable button ("Pluck the string").
  Enter or Space plucks it somewhere new each time.
- It plucks itself once, gently, the first time it scrolls into view.
- The animation sleeps when the string is still or off screen. With
  `prefers-reduced-motion: reduce` the line is drawn still and the wordmark is
  not interactive.

## Usage

```tsx
import PluckedStringFooter from "@/components/ui/plucked-string-footer"

export default function Page() {
  return (
    <PluckedStringFooter
      brand="Orbitly"
      heading="Ship your next release on Friday, calmly."
      text="Previews, checks and rollouts in one place."
      email="sales@orbitly.app"
      theme="auto"
      accent="#7ce0b8"
    />
  )
}
```

The footer is full width and as tall as its content. Put it in a block-level
parent; inside a flex container give that parent a width (`w-full`).

## Props

| Prop | Type | Default | |
|---|---|---|---|
| `brand` | `string` | `"Fieldnote"` | Brand name, used for the wordmark |
| `wordmark` | `string` | `brand` | The big word the string runs under. Fitted to the width; short words are capped at about 30% of the width tall |
| `heading` | `string` | "Have something worth building?" | |
| `text` | `string` | a line about taking on projects | Empty string hides it |
| `email` | `string` | `"hello@fieldnote.studio"` | Rendered as a `mailto:` link. Empty string hides it |
| `columns` | `{ title, links: { label, href }[] }[]` | Studio / Resources / Legal | Up to 4 columns side by side, 2 on phones |
| `legal` | `string` | `"© 2026 Fieldnote Studio Ltd. · …"` | Left side of the bottom row |
| `socials` | `{ label, href }[]` | GitHub / LinkedIn / Instagram | Right side of the bottom row. `[]` hides it |
| `label` | `string` | `"Get in touch"` | Small label on the top rule. Empty string hides it |
| `theme` | `"auto" \| "light" \| "dark"` | `"auto"` | `auto` follows a `.dark` class on `<html>` |
| `accent` | `string` | red (`#c0281a` light, `#ff6d58` dark) | Trace, underline, hover and focus colour. One value for both themes |
| `className` | `string` | | Added to the `<footer>` |

Links with `href="#"` don't change the page's hash.

## Notes

- Layout responds to the footer's own width (container queries), not the
  viewport: two columns of text above 960px, stacked below it, phone spacing
  below 600px.
- Words with descenders (y, g, p) hang through the trace; the footer makes
  room for them so they never touch the legal row.
- All CSS is scoped under `.psf` in an inline `<style>`; no global resets.
