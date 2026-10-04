# Shutter Glyph Footer

A signal-orange closing section set in monospace caps, with the brand drawn
across the full width in a geometric display alphabet. One letter is swapped
for a **shutter**: three black blades that meet at a pivot, and the pivot turns
to follow the pointer.

The top row has a newsletter signup (an underlined field with an arrow
submit), social links, the copyright and the legal links. Under them the
wordmark runs edge to edge.

**No dependencies.** React is the only import. No images or fonts are loaded.
The wordmark is SVG, and every letter is drawn in the component from
rectangles, slanted strokes and elliptical bands. It looks the same on every
page, whatever fonts the page has. The small text uses whatever monospace the
page already has.

## Interaction

- **Shutter**: the blades' pivot eases toward the pointer anywhere over the
  footer and settles back when the pointer leaves. **Click** it and the whole
  shutter turns a quarter, so there are four arrangements.
- **Letters**: on hover a letter slices along its waist and the two halves
  slide apart. **Click** one and it flips.
- **Links**: the label scrambles through mono glyphs and settles in about
  0.4s, the arrow walks right, and an underline wipes in. Keyboard focus gets
  the same.
- **Signup**: the underline thickens on focus. An invalid address shakes the
  field and says why. While it sends, the arrow turns into a `|/-\` spinner.
  Once it's sent, the field shows "You're on the list" with an **Undo**. If it
  fails, it says so and you can try again.
- **Reveal**: the first time the footer is on screen, the columns fade up in
  sequence and the letters rise out of the bottom edge one by one.

## Usage

```tsx
import ShutterGlyphFooter from "@/components/ui/shutter-glyph-footer"

<ShutterGlyphFooter />
```

Give it a parent with a width and nothing else (see `demo.tsx`). Its height
comes from its content.

Re-brand, re-word and re-ink it through props (see `demo-night.tsx`):

```tsx
<ShutterGlyphFooter
  brand="Verso"
  company="Verso Type & Print"
  since={2017}
  background="#111110"
  ink="#efe9dc"
  socials={[{ label: "Are.na", href: "https://are.na/you" }]}
  legal={[{ label: "Imprint", href: "/imprint" }]}
  onSubscribe={async (email) => (await api.subscribe(email)).ok}
  onLinkClick={(label, href) => track(label)}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `brand` | `"Vanda"` | Used in the wordmark and the default company line. |
| `wordmark` | `brand` | What the wordmark spells. Letters A–Z are drawn. Anything else, spaces included, is a gap. Shown in caps. |
| `shutterAt` | `2` | Index of the letter the shutter replaces. `-1` for none. A space never becomes the shutter. |
| `company` | `"The <brand> Creative Co."` | Second line of the copyright. |
| `since` / `year` | `2020` / current year | `© since—year`, or just the year when they match. |
| `signupLabel` / `placeholder` | reference copy | The text over the field and in it. |
| `onSubscribe` | none | `(email) => void \| boolean \| Promise<…>`. It's only called with a valid address. Return or resolve `false`, or throw, to show the error state. Without it, the form waits a second and then shows success. |
| `socials` / `legal` | Instagram, Linked In, Spotify / Terms, Privacy, Cookies | `{ label, href? }[]`. Either list can be empty. |
| `onLinkClick` | none | `(label, href)` for every link. |
| `background` / `ink` | `#f9531f` / `#0c0c0c` | Hex. The top of the section is `background` mixed 13% toward white. |
| `fontMono` | system mono stack | Nothing is loaded. Pass a family your page already loads. |
| `animate` | `true` | `false` holds the shutter at rest and skips the reveal, scramble and flip. |
| `className` | `""` | Appended to the root `<footer>`. |

## Notes

- **Intrinsic height.** There is no `height` prop and no percentage height.
  The wordmark is an SVG whose `aspect-ratio` comes from its own viewBox, so it
  is exactly as tall as the width makes it.
- The CSS is one scoped `<style>` block, with every rule under `.sgf`. Element
  resets go through `:where(.sgf)`, so they never out-rank the component's own
  classes or yours.
- Text sizes and spacing are in container units (`cqw`) off the component's
  own width. Under 760px of width the signup takes the full row and the link
  lists sit side by side beneath it. Under 420px everything stacks.
- The footer paints its own palette and ignores the page's light/dark theme.
- The shutter's tracking writes straight to the blade polygons, so moving the
  pointer never re-renders React. Off screen, it stops.
- `href: "#"` and missing hrefs never touch the page's URL hash. External
  `http(s)` links open in a new tab.
- Accessibility: the wordmark is read once as text, and the drawn letters are
  hidden from screen readers. A scrambling link keeps a stable `aria-label`,
  so the noise is never read. The field has a real `<label>`. Errors go
  through a polite live region, and an invalid address sets `aria-invalid`.
- `prefers-reduced-motion`: no reveal, shake, scramble, flip, spinner or
  slide transitions, and the shutter stays at rest. Everything shows at once.

## Credit

Layout and palette after a reference shot of an orange agency footer with a
cut-letter wordmark. The alphabet, the shutter, the interactions and the code
are original.
