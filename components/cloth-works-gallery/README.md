# Cloth Works Gallery

A portfolio "works" section. A row of project posters hangs across the page as cloth. Drag or scroll the row and every poster bends and flaps like a flag, with its free edges trailing behind. Run the cursor over a poster and it ripples where you pass, then settles flat again. The big title follows whichever poster is in the middle. A pill at the bottom switches to an Index view: a grid of the same work, with the title, description and tags following the tile under the cursor. Click a tile to jump back to it in the row.

- Each poster is a subdivided plane in three.js. A small spring-membrane simulation runs per poster on the CPU: pinned firmly in the middle, loose at the edges, damped so it comes to rest in about a second. Folds are re-lit every frame, and a flat poster shows its picture's exact colours.
- The row is endless. Cards wrap round off screen, and the list repeats when it is short.
- Input: drag (mouse or touch), the wheel or trackpad over the row, or the arrow keys once the row has focus. The row follows on a critically damped spring, so a fling never snaps.
- Switching views, the outgoing layer clears before the incoming one arrives: cards leave in 0.15 s and then the tiles stagger in; tiles leave first and then the cards drop back in, left to right.
- Without WebGL the row falls back to plain tilted images.
- `prefers-reduced-motion`: the cloth never folds, the row moves without flapping, and views switch without fades.
- The render loop idles while the section is off screen.

## Props

| Prop | Default | |
|---|---|---|
| `height` | `"100svh"` | Section height. Must be a definite length. |
| `works` | 8 placeholder projects | `{ src, title, description?, tags? }`. Pictures about 9:10 portrait. |
| `links` | Home / Works / Contact / Blog | The pills in the top-left corner. `active` highlights one. |
| `cta` | Resume (mailto) | The dark pill in the top-right corner, or `null` for none. |
| `defaultView` | `"gallery"` | `"index"` starts on the grid. |
| `autoPlay` | `false` | Nudges the row along a card or two at a time for an unattended preview. It pauses while the cursor is over the row and stops for good at the first drag, wheel or key. |
| `fontHref` | Google Fonts (Outfit 800, Inter) | Pass `null` to load the faces yourself. |
| `className` | | Added to the root. |

Colours come from the theme tokens `--color-background`, `--color-foreground` and `--color-muted-foreground`, so it follows light and dark.

## Dependencies

`three` (declared at the repo root). Nothing else beyond React.

## Assets

The eight posters are generated placeholders served from `https://kedhar-components.pages.dev/cloth-works-gallery/`. Replace `works` with your own.
