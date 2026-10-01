# Cyanotype Collage Hero

A summer scrapbook hero printed in one ink. On graph paper, a slanted
two-line serif headline sits beside a collage of cut-outs: a sky photograph
full of halftone cumulus, a snapshot of a cloud tower, a sunflower, an ice
pop, a sandal and a pair of chopsticks, all circling a dark, mottled planet
with a needle starburst and the file number in its corner. A thin orbit,
outline sparkles, a barcode and riso grain finish the page.

```tsx
import CyanotypeCollageHero from "@/components/ui/cyanotype-collage-hero"

<CyanotypeCollageHero />                                   // three Japanese files, cobalt
<CyanotypeCollageHero palette="vermilion" lang="en" chapters={[{ number: "01", title: "Made in\n*red* summers", body: "…" }]} />
<CyanotypeCollageHero accent="#0a7a5c" paper="#f1f0ea" />   // any ink on any paper
<CyanotypeCollageHero height="44rem" draggable={false} />  // inside a page section
```

**No dependencies beyond React.** Every scrap (clouds, photographs,
sunflower, ice pop, sandal, planet, starburst, barcode, grain) is SVG drawn in
the file from seeded shapes, halftone dot patterns and turbulence filters. No
fonts, images or stylesheets load, so it renders inside the 21st capture
sandbox.

## Play with it

| Do this | And |
|---|---|
| Move the pointer | The collage leans in parallax, each scrap at its own depth; the headline's ink slips off-register |
| Drag any scrap | Pick it up (it lifts and casts a shadow), drop it anywhere. **Tidy up** puts everything back |
| Focus a scrap, arrow keys | Moves it 10 px (Shift: 40 px) |
| Tap the sky photograph | Shutter flash, new clouds |
| Tap the snapshot | Flips to its handwritten back (the chapter's `caption`) |
| Tap the sunflower | It spins |
| Tap the ice pop | Bite, bite, bite… down to a **あたり** winning stick. Tap again for a fresh one |
| Tap the sandal | Tossed to forecast tomorrow — 晴れ, くもり or 雨 — by how it lands (*ashita tenki ni naare*) |
| Tap the chopsticks / starburst | Clack / flare |
| Tap the bare paper | Stamps a sparkle where you clicked |
| Tap the file number, its dots or ‹ › | Pages to another file: headline, copy, kicker, sky, clouds and planet all change. ← → / Home / End work while focused |

On load the scraps drop onto the page one by one, the orbit draws itself and
the headline wipes in; paging re-inks the copy and flips the numeral.
Sparkles twinkle, the planet turns, a dot travels the orbit and the ice pop
drips.

## Props

| Prop | Default | Description |
|---|---|---|
| `chapters` | 3 files | `{ number?, kicker?, title?, body?, caption?, sky?, seed? }[]`. `\n` breaks lines; wrap words in `*asterisks*` to print them in the accent (title and kicker). `sky` is `"day"`, `"dusk"` (a pale sun) or `"night"` (stars and a crescent). `seed` reshapes the clouds, planet and forecasts. |
| `initialChapter` | `0` | Which file opens first. |
| `autoplay` | `0` | Ms between files (min 2500). Pauses while hovered or dragging. Off under reduced motion. |
| `onChapterChange` | — | `(index) => void`. |
| `action` | — | `{ label, href }`. A pill link under the copy. |
| `barcode` | `"SCN 4 901 2026"` | Text the barcode is generated from (plus the file number, so each file prints differently). |
| `hint` | `"Drag the scraps · tap to play · ← → files"` | Small print beside the barcode. `""` hides it. |
| `lang` | `"ja"` | `lang` of the headline and copy, so the right glyphs are picked. |
| `palette` | `"cobalt"` | `"cobalt"`, `"ultramarine"`, `"teal"` or `"vermilion"`. |
| `accent` / `paper` | from palette | Override either colour. |
| `theme` | `"auto"` | `"auto"` follows a `.dark` class on an ancestor; `"light"` / `"dark"` force it. |
| `draggable` | `true` | Scraps can be moved. They still play when tapped either way. |
| `stamps` | `true` | Tapping the paper stamps sparkles (up to 14). |
| `intro` | `true` | The drop-in on load. |
| `height` | `"100svh"` | A definite length. Always set one; the collage scales from it. |
| `className` | `""` | Extra classes on the root. |

## Notes

- **One ink.** Everything is mixed from `accent` with white and a near-black
  using `color-mix()`. Dark mode reprints the paper in deep ink with pale
  type; the scraps keep their white stock.
- **It scales as one plate.** The root is a size container: the collage is
  laid out on an 840 × 675 board sized from the hero's height (or width,
  whichever runs out first) and pinned to the right, so the planet always
  bleeds off the edge. In portrait the copy stacks on top and the collage
  sits along the bottom.
- **Fonts.** The headline asks for Hiragino Mincho / Yu Mincho / Noto Serif JP
  and falls back to the system serif; the copy uses the system Japanese
  sans. Nothing is downloaded. Set `lang` to match your copy.
- **Touch.** Scraps use `touch-action: none` so they can be dragged; a swipe
  that starts on a scrap won't scroll the page. Pass `draggable={false}` if
  the hero sits mid-page on mobile.
- **Accessibility.** The headline is a real `<h1>`. Every scrap is a labelled
  button (Enter/Space plays, arrows move), file controls are buttons with
  `aria-current`, and each action is announced in a polite live region.
- **`prefers-reduced-motion`.** No intro, parallax, autoplay, twinkle,
  drifting, turning or orbiting. Every toy still works, without animation.
