# Graffiti Script Preloader

A cinematic page gate lettered in hand-built brush capitals. Five rows of an
A–Z sticker alphabet roll across the screen in alternating directions, each
letter rocking as it passes, while giant letters fly out through the lens.
The counter runs to 100. The rows then tear away, your word slams in letter by
letter with an orbit ring and sparkles, and an iris closes on it to reveal the
page underneath.

```tsx
import GraffitiScriptPreloader from "@/components/ui/graffiti-script-preloader"

// As a page gate: children mount as the iris starts to close
<GraffitiScriptPreloader word="LEGENDS" onComplete={() => console.log("in")}>
  <YourPage />
</GraffitiScriptPreloader>

// Driven by real loading progress (0–100)
<GraffitiScriptPreloader progress={percent}>…</GraffitiScriptPreloader>

// As a looping showcase
<GraffitiScriptPreloader loop />
```

**No dependencies beyond React.** Nothing loads at runtime: no fonts, no images,
no network requests.

## The lettering is drawn, not typeset

Each capital is stored as a few pen **skeletons** (bezier centre-lines). The
engine sweeps a broad nib held at 30° along each skeleton: travel across the nib
makes a thick stroke, travel along it a hairline, and a pressure curve tapers
both ends to a point. The result is slanted to one italic angle and inked three
times (outer line, paper halo, fill) so it reads as a die-cut sticker, with a
white gloss streak along each stroke.

That engine is exported as well:

```tsx
import { GraffitiLettering } from "@/components/ui/graffiti-script-preloader"

<GraffitiLettering lines={["Nova", "Legends"]} mode="draw" orbit stars={6} interactive />
```

| `GraffitiLettering` prop | Default | |
|---|---|---|
| `lines` | — | One string per line. A–Z are drawn; anything else becomes a space. |
| `mode` | `"static"` | `"draw"` inks every stroke in pen order. `"slam"` drops letters in one by one. |
| `orbit` | `false` | A tapered ring that passes behind the top of the word and in front of the bottom. |
| `stars` | `0` | Number of sparkles (up to 7). |
| `interactive` | `false` | Letters hop under the pointer. |
| `ink` / `paper` | electric blue / warm off-white | |
| `delay` | `0` | ms before the entrance starts. |

It is decorative (`aria-hidden`), so put the real words in the page as text.

## Props

| Prop | Default | Description |
|---|---|---|
| `children` | — | Revealed by the iris. Ignored when `loop` is set. |
| `word` | `"LEGENDS"` | The word that slams in at the end. |
| `durationMs` | `5600` | Total run time, from the reel to the end of the iris. |
| `progress` | — | Real progress, 0–100. The reel keeps rolling until it reaches 100. |
| `loop` | `false` | Replays the whole sequence forever. Children never show. |
| `ink` | `"#2f1ced"` | Ink colour. |
| `paper` | `"#f8f4ea"` | Paper colour. |
| `title` / `caption` / `badge` | `"ENGLISH ALPHABET"` / `"GRAFFITI / CALLIGRAPHY STYLE"` / `"ALPHABET"` | The small print on the HUD. |
| `keepMounted` | `false` | Mount children from the start (for example, to let them fetch) instead of when the iris starts. |
| `height` | `"100svh"` | Root height. Always a definite length. |
| `onComplete` | — | Fires once the iris has closed. |
| `className` | `""` | Extra classes on the root. |

## Notes

- The layout uses container query units, so it sizes to its own box, not to the viewport.
- `prefers-reduced-motion`: the reel holds still, the fly-throughs are dropped,
  letters appear without the slam, and the iris becomes a fade.
- The gate is `role="progressbar"`, with the counter as its `aria-valuenow`.
