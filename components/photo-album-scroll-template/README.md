# Photo Album Scroll Template

A landing page for a calm, ad-free photo album app. The demo brand is
**Keepsake** (invented). The whole page is one sheet of warm paper that
slides sideways as you scroll down. The header stays put.

The sheet carries, left to right:

1. **Hero.** "Collect and share your memories in a calm and beautiful
   place", a *Create album* button and two photo prints. A handwritten
   *Read more* with a drawn arrow sits under them.
2. **Intro.** A handwritten kicker ("A new kind of digital album") over a
   paragraph about the album.
3. **Cluster.** Three overlapping prints, each labelled by hand: *Your
   travels*, *Your baby growing up*, *Your wedding*.
4. **Manifesto.** No ads and no addiction, with a handwritten *100% member
   supported* aside.
5. **Closing.** A pale sky photo fades in from the paper behind the final
   call to action.

Prints drift a little against the paper as they cross the screen, so the
sheet reads as layered photos. Hovering a print straightens and lifts it.

Type: Newsreader for the copy, with the opening words of each block in ink
and the rest in a soft grey. Gochi Hand for the notes.

Built from a Pinterest concept ("Memory Lane — Landingpage desktop v1").
The layout and motion follow it; the brand, copy and photos are our own.

## Requires

Nothing beyond React. There is no animation library: it uses a CSS sticky
stage and one scroll listener. Tailwind is not needed, because every style is
in one scoped `<style>` block (`.pa-*`).

## Props

| Prop | Default | Notes |
|---|---|---|
| `heroPhotos` | none | `[landscape, portrait]`, each `{ src, alt }`. A print without `src` shows an empty tinted frame. |
| `cluster` | none | Three portraits, each `{ src, alt, label }`. Use `\n` in `label` for a line break. |
| `sky` | none | A wide, soft sky photo for the closing panel. Without it the closing sits on plain paper. |
| `brand`, `signUp` | `"Keepsake"`, `{ label: "Sign up", href: "#signup" }` | The header. |
| `hero`, `intro`, `manifesto`, `closing` | demo copy | All copy. `lead`/`bold` is the inked part and `rest`/`muted` the grey part. |
| `height` | `"100svh"` | Height of the sticky stage. Keep it a definite length. |
| `fontHref` | Google Fonts URL | `null` loads nothing (Georgia and a system hand font take over). |

## Behaviour

- The page is as tall as the stage plus the sheet's overflow, so it scrolls
  1:1 with the sheet. Sizes are measured on mount, on resize, and after
  fonts and photos load. The scroll handler reads only `window.scrollY` and
  those cached numbers, and writes only `transform` and one CSS variable per
  print.
- Everything is sized in `--u` (1/100 of the stage height, capped by the
  width), so the composition holds from phone to ultrawide. On phones `--u`
  is 0.62 % of the height, so the copy stays readable.
- `prefers-reduced-motion: reduce`: no scroll-jacking. The page is one
  viewport tall and the sheet is a normal horizontal scroller.
- Dark mode follows the host's `--color-background` / `--color-foreground`;
  the sky is dimmed under `.dark`.

## Demo photos

Free Unsplash photos, cropped, graded to a soft film look, and inlined in
`demo.tsx` as AVIF (about 70 KB total). The IDs are listed at the top of
`demo.tsx`.
