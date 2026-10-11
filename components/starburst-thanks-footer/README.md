# Starburst Thanks Footer

A "thank you for your time" sign-off for the end of a portfolio, case study or
deck. It has heavy extended caps, a hand-lettered line underneath, a loose pen
loop around both, and a hot-pink starburst. Contact pills sit at the bottom,
with little pointing hands under the links. The background is dark film with
grain and dust.

**No dependencies.** React is the only import, and nothing is fetched. The
hand lettering is a built-in single-stroke marker alphabet drawn as SVG, so it
looks the same on every machine. The grain is an inline SVG noise filter, and
the monogram is generated from the name.

## Interaction

- **Starburst**: click it (or press Enter or Space) and it pops, spins and
  throws sparks, and the headline says thanks in the next language. The
  letters drop in one by one. `onThanks(index, word)` fires.
- **Pointer**: the star leans toward the pointer, and the loop drifts the
  other way. Hover the headline and the loop turns slightly.
- **Draw-in**: the first time the section is seen, the loop draws itself
  round and every hand-lettered line writes in stroke by stroke.
- **Link pills**: on hover they invert, and the hand underneath taps with
  click lines. When idle, the hands bob.
- **Email pill**: copies the address. "Copied!" is written in above it in the
  accent colour, and a screen reader hears it too. If the clipboard isn't
  available, the pill opens a `mailto:` link instead.
- **Phone**: a `tel:` link.
- **Monogram**: the brackets ease apart on hover.

## Usage

```tsx
import StarburstThanksFooter from "@/components/ui/starburst-thanks-footer"

<StarburstThanksFooter />
```

Give it a parent with a width (see `demo.tsx`). You can re-brand and re-word
it through props (see `demo.tsx`):

```tsx
<StarburstThanksFooter
  name="Noor Haddad"
  thanks={["Shukran", "Thank you", "Merci"]}
  tagline="for stopping by"
  links={[{ caption: "More of my code", label: "github.com/noor", href: "https://github.com/noor" }]}
  email="noor@haddad.design"
  phone=""
  accent="#c6ff3d"
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `name` | `"Rio Valente"` | The monogram uses its initials. The first word goes on line one and the rest on line two. |
| `logo` | — | Any node. Replaces the monogram and name. |
| `thanks` | 7 languages | Clicking the star moves to the next one. Keep each word to about 10 characters, because the headline doesn't wrap. |
| `tagline` | `"For your time"` | Hand-lettered under the headline. `""` hides it. |
| `signoff` | `"and see you soon!!"` | Small line under the stage. `""` hides it. |
| `links` | Behance, Instagram | `{ caption?, label, href? }[]`. `caption` is hand-lettered above the pill. `http(s)` links open in a new tab. A missing `href` or `"#"` leaves the URL alone. |
| `email` / `phone` | placeholder | `""` hides either one. |
| `copiedLabel` | `"Copied!"` | |
| `height` | `"100svh"` | Minimum height. The section grows if its content needs more room. |
| `background` / `ink` / `accent` | `#0a0a0a` / `#f4f4f2` / `#ff1f5a` | |
| `fontDisplay` / `fontSans` | Archivo Black → Arial Black / system | Nothing is loaded. If your page loads Archivo Black, the headline uses it. |
| `grain` | `0.16` | Film grain opacity. `0` turns it off. |
| `starPoints` | `10` | |
| `onThanks` | — | `(index, word)` |
| `className` | `""` | Appended to the root. |

## Notes

- **The marker alphabet** covers A–Z, 0–9 and `! ? . , ' : - / &`. Accents
  are stripped (`Teşekkürler` → `TESEKKURLER`). Any other character becomes a
  space.
- Sizes are in container units (`cqw`) based on the component's own width.
  Under 640px the contacts stack in a column and the separators hide.
- All CSS is in one scoped `<style>` block under `.stf`. Element resets go
  through `:where(.stf)`, so they never outrank your own classes.
- The root uses `overflow: clip`, not just `hidden`. A hidden root is still a
  scroll container, and focusing the star once scrolled the grain layer
  sideways.
- The component uses its own palette and ignores the page's light or dark
  theme. For a light version, pass a light `background` and a dark `ink`. The
  grain uses `difference` blending, so it shows on both.
- With `prefers-reduced-motion`, there's no grain flicker, star spin, pop,
  sparks, parallax, letter drop, bobbing hands or draw-in. Everything is
  simply drawn.

## Credit

The layout and mood are based on a reference "Thank you for your time" closing
slide from a designer's Behance deck. The lettering alphabet, star, loop,
hands and code are original, and the names and contacts are placeholders.
