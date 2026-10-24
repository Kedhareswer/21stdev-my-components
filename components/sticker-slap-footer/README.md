# Sticker Slap Footer

A loud, friendly studio footer. A cream frame holds a top bar (a starburst
nav link, a small script logo, a chat bubble) and a cobalt panel with three
columns: jobs, office and contact. At the bottom is a giant fat script
wordmark that sinks into the panel edge, with die-cut stickers slapped all
over it.

**No dependencies.** React is the only import, and nothing is fetched. The
wordmark is a built-in single-stroke script alphabet drawn as SVG, so it looks
the same everywhere and can *write itself*. The seven stickers (wow burst,
smiley, heart, daisy, speech bubble, camera, lightning bolt) are drawn in
code too, each with a white die-cut edge and a shine.

## The storyboard

The first time a fifth of it is on screen:

1. The top bar drops in, and the panel grows out of a rounded pill to its
   full size.
2. The column tags pop, and each line rises out of its own mask, one column
   after the other.
3. The wordmark writes itself in one continuous marker stroke. The t-crosses
   and i-dots go on last.
4. Each sticker slaps down (big, tilted and blurred, then squashed flat with
   a shock ring) the moment the pen passes under it.
5. The credits pill pops in.

While the page scrolls, the panel is tied to the scroll: it starts slightly
small with very round corners and settles as the footer fills the screen,
while the wordmark rises into place. See `demo-scroll.tsx`.

## Interaction

- **Stickers**: drag one anywhere. It lifts with a deeper shadow, tilts with
  how fast you throw it and slaps back down when you let go. Click one to
  make it wiggle. Double-click puts it back. From the keyboard, arrows move it
  (Shift moves it further) and Escape or Home puts it back. The last one you
  touched sits on top. On hover a shine sweeps across it. They drift slightly
  with the pointer, each at its own depth.
- **Wordmark**: click it to write it again. The stickers go home and slap
  back on.
- **Email**: copies the address. The line rolls over to "copied, talk
  soon!" and a screen reader hears it too. If the clipboard isn't
  available, it opens a `mailto:` link instead.
- **Google Maps**: the hand-drawn squiggle redraws on hover.
- **Links**: an underline wipes in. The asterisk spins.
- **Socials**: they fill in and tip over on hover.
- **Credits**: opens a little card. Escape or a click outside closes it.
- **Top bar**: the nav starburst spins, the logo rewrites itself on hover,
  and the chat bubble wobbles.

## Usage

```tsx
import StickerSlapFooter from "@/components/ui/sticker-slap-footer"

<StickerSlapFooter />
```

Give it a parent with a width. Everything can be re-branded (see
`demo-scroll.tsx`):

```tsx
<StickerSlapFooter
  wordmark="juicy"
  panel="#1f7a4d"
  accent="#ffd23f"
  email="ola@juicy.pt"
  address={["Rua do Norte 48", "1200-286 Lisboa"]}
  stickers={[{ kind: "burst", text: "yay" }, "heart", { kind: "bubble", text: "oi!" }, "bolt"]}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `wordmark` | `"sunny"` | Letters a–z, `!` and `.`. Accents are stripped, and anything else becomes a space. Short, wide words look best. |
| `homeHref` | `"#"` | Where the small top logo points. |
| `navLabel` / `navHref` | `"work"` / `"#"` | The starburst link. `""` hides it. |
| `chatHref` / `chatLabel` | `"#"` / `"send us a voice note"` | Used by the top-right bubble and the contact line. `""` hides both. |
| `jobsLabel` / `jobs` | `"looking for a job?"` / 2 roles | `{ title, href? }[]`. `[]` hides the column. |
| `officeLabel` / `address` | `"office"` / 2 lines | One entry per line. `[]` hides the column. |
| `mapLabel` / `mapHref` | `"Google Maps"` / `"#"` | `""` hides the link. |
| `contactLabel` / `email` / `copiedLabel` | `"contact"` / placeholder / `"copied, talk soon!"` | `""` hides the email. |
| `note` | a line of small print | Adds the asterisk to the chat line. `""` hides it. |
| `socials` | LinkedIn, Instagram, TikTok | `{ kind, href, label? }[]`. The kinds are `linkedin`, `instagram`, `tiktok`, `x`, `youtube` and `dribbble`. |
| `stickers` | 6 kinds | A kind name, or `{ kind?, text?, node?, label?, x?, y?, size?, rotate? }`. `text` re-words the burst or bubble. `node` is your own art. `x`, `y` and `size` are % of the wordmark box. If you leave them out, each sticker finds a letter. |
| `credits` | 3 lines | `{ role, name }[]`. `[]` hides the pill. |
| `onStickerMove` | — | `(index, x, y)`, in % of the wordmark box, after a drag, a key move or a reset. |
| `height` | `"100svh"` | Minimum height. The footer grows if its content needs more room. |
| `wordmarkMaxHeight` | `"50svh"` | Caps the wordmark's visible height so short words don't get enormous. |
| `paper` / `panel` / `ink` / `cream` / `accent` | `#f1ece4` / `#4a6cf0` / `#141414` / `paper` / `#ff6a2b` | `cream` is the wordmark and the panel text. |
| `fontSans` | DM Sans → Manrope → system | Nothing is loaded. If your page loads DM Sans, it's used. |
| `className` | `""` | Appended to the root. |

## Notes

- The panel's bottom edge cuts the wordmark just above its baseline, like a
  sign sinking into the floor, so descenders never show. Under 760px the
  columns stack, and the wordmark grows past both panel edges and gets
  cropped. Stickers never shrink below 46px.
- Sizes are in container units (`cqw`) based on the component's own width.
  Nothing reads the window size, except the scroll link, which reads the
  viewport height to know how far in the footer is.
- All CSS is in one scoped `<style>` block under `.ssf`. Element resets go
  through `:where(.ssf)`, so they never outrank your own classes.
- The component uses its own palette and ignores the page's light or dark
  theme.
- With `prefers-reduced-motion`, everything is simply there: no grow, no
  write-on, no slaps, no scroll link, no parallax and no wiggles. Dragging
  still works.

## Credit

The layout and mood are based on a reference studio-site footer: a cream
frame, a cobalt panel, a fat script wordmark and stickers. The script
alphabet, stickers, motion and code are original, and the studio names,
addresses and contacts are placeholders.
