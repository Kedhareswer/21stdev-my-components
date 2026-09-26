# Overlook Title Reveal

A screen-printed film poster that starts as nothing but its title. The picture
lives only inside the letters: a red duotone ballroom bar seen through the
glyphs, on a plain sheet of paper. Scroll, and the letters swell. The title is
dilated outwards stroke by stroke, with a thin red rim riding its edge, until
the picture has spread out of the words and fills the sheet. The title never
quite goes away. Its black keyline is bold on the bare title, then thins and
fades as the picture spreads, so over the finished print the word is only
faintly there and the picture leads. Then the billing block prints in underneath, and the page is
a poster.

**No dependencies.** React is the only import. There is no CSS file, font, image
or animation library. The picture is painted once, from numbers, on an offscreen
2D canvas: marble walls with engraved swirl lines, a coffered ceiling,
chandeliers, a crowd of guests (some pale and staring), a bar running to the
vanishing point, a guest and a barman, two blades of light, and a window. It is
painted in grey and then gradient-mapped through `palette`, so the whole thing
prints in two inks. Pass `image` to reveal your own picture instead.

```
scroll   what happens
-------  ------------------------------------------------------------
0        the bare title on paper, black keyline, picture inside the letters
0.05     the letters start to swell; a thin accent rim rides their edge,
         the keyline stays on the original letter shapes, thinning and fading
0.60     the picture outside the letters dims very slightly
0.68     the picture fills the frame; the title is a faint, thin keyline
0.74     the billing block prints in under the frame
1        a finished poster
```

**Interactive.** The picture drifts behind the letters with the pointer, like
looking through a window, and it drifts slowly by itself when the pointer is
still. Press Enter on the focused poster to jump to the end, and again to jump
back to the start.

## Usage

```tsx
import OverlookTitleReveal from "@/components/ui/overlook-title-reveal"

<OverlookTitleReveal />

<OverlookTitleReveal
  title={"ALL WORK\nNO PLAY"}
  palette={["#07121a", "#0d2a36", "#145a63", "#2e8f8a", "#8fcfb8", "#e8f1e4"]}
  paper="#dfe3dc"
  ink="#12303a"
  accent="#145a63"
  billing={[["starring", "Your Name Here"], ["shot on", "a 2D canvas"]]}
/>

<OverlookTitleReveal image="/my-still.jpg" paper="transparent" />
```

Give it a parent with a width and nothing else (see `demo.tsx`). The root is
`height × scrollLength` tall, with a sticky stage inside it, so put your
content after it.

## Props

| Prop | Default | Notes |
|---|---|---|
| `title` | `"THE SHINING"` | `\n` forces breaks. Otherwise it picks the word grouping that sets largest (so it breaks to two lines in portrait). |
| `image` | none | Your own picture, cover-fit. With no `image`, it paints the ballroom. |
| `duotone` | `true` | Gradient-map `image` through `palette`. This needs the host to send CORS headers; without them the picture is shown as it is. |
| `palette` | 7 stops, navy → red → cream | Hex, 2 to 8 stops, shadow to highlight. The first stop is also the dimming colour. |
| `paper` | `"#f2d6a2"` | The sheet, with a little tooth. `"transparent"` lets the page show through, and the text then uses `--color-foreground`. |
| `ink` | `"#4a1d1a"` | Billing text and the scroll hint. |
| `accent` | `"#b3241c"` | The small title, the maze mark, and the rim on the swelling letters. |
| `fontFamily` | Bebas Neue / Oswald / Anton / Impact… | Any heavy face. Nothing is loaded, and it re-fits when webfonts arrive. |
| `condense` | `0.84` | Horizontal squeeze of the big title, from 0.5 to 1. |
| `seed` | `7` | Changes the crowd, the marble and the grain. |
| `scrollLength` | `3.2` | A multiple of `height`. |
| `height` | `"100svh"` | The stage. **Must be a definite length.** |
| `parallax` | `true` | Pointer drift and idle drift. |
| `outline` | `"#0b0a0d"` | The keyline around the letters. It is always drawn. Once the picture spreads, a faint hairline of `paper` sits under it so it still shows over the darkest parts of the picture. |
| `outlineWidth` | scales with the title | Width in px on the bare title. It thins to a third (never under 1px) as the picture spreads. `0` turns the keyline off. |
| `ghost` | `0.4` | How visible the keyline stays over the full picture, from 0 to 1. `1` keeps it solid; `0` fades it out entirely. |
| `veil` | `0.15` | How much the picture outside the letters dims once it fills the frame, from 0 to 1. Raise it to make the word stand out more. |
| `credit` | `"A Kedhareswer picture"` | The top line of the billing. |
| `billing` | a parody block | `[label, value]` pairs. |
| `edition` | `"17 / 60"` | The print-run box. It is hidden below `sm`. |
| `hint` | `"Scroll"` | Empty hides it. |
| `className` | `""` | Appended to the root. |
| `children` | none | Always on top. |

`timeline`, `progressFrom`, `coverFit`, `dilation`, `keylineWidth`, `keylineAlpha`, `bestLines`, `titleSize`,
`posterFrame`, `buildLut`, `makeNoise`, `mulberry32`, `hexToRgb`, `clamp01` and
`smoothstep` are exported.

## Notes

- **The swell is a morphological dilation.** Each frame, the title is filled
  and then stroked with a round-joined line whose width grows with scroll. That
  shape masks the picture (`source-in` on a second canvas). At full spread the
  stroke is wider than the frame's diagonal, so the last frame is a plain
  rectangle and nothing snaps.
- **The title stays, quietly.** The keyline is stroked from the undilated
  title every frame, after the picture; `keylineWidth` and `keylineAlpha` thin
  and fade it with the spread. The dim is a `palette[0]` sheet over the frame
  with the title cut out of it (`destination-out`), so inside the letters the
  picture stays at full strength.
- The title is fitted to 88% of the frame and grows at most 8% while
  scrolling, so its keyline never runs off the edge.
- The picture is painted once, about 100 ms after mount, so the title appears
  immediately in solid accent. It is repainted only when the palette, seed or
  image changes.
- The cover fit keeps `pad` px of picture spare on every side, and the parallax
  never moves further than that, so an edge can never show bare.
- Scroll progress comes from the root's `getBoundingClientRect()`. It listens
  for `scroll` in the capture phase on `window`, so it also works inside a
  scrolling container such as a preview pane. The loop stops while the root is
  off screen or the tab is hidden. Device pixel ratio is capped at 2.
- Reduced motion: scroll maps straight to the timeline with no easing, and
  there is no drift, no parallax and no pulsing hint.
- The canvas is `aria-hidden`. The title and billing are in an `sr-only`
  block, and the stage is focusable with its key in its label.
- It paints its own paper, so it looks the same in light and dark themes
  unless you pass `paper="transparent"`.

## Credit

The art direction is a homage to screen-printed alternative film posters: a
red duotone illustration on cream stock, a keylined title and a
billing block. The scene, its figures, the geometry and all the code are
original and procedural. No film stills, poster art, real names, logos or
rating marks are used.
