# Minted Coin Scroll

A scroll-driven poster in four chapters.

1. **Wrapped.** A pale serif headline sits behind a bronze coin wrapped in torn paper with ticker text.
2. **Unwrapped.** The paper tears away, and the coin turns a full 360° in real 3D, showing its edge and back.
3. **Minted.** The whole page shrinks into a banner. The painted strip in the bottom-left corner turns out to be a window onto the scene behind, and it opens out as the page shrinks.
4. **Hung.** The banner hangs between Ionic columns under a broken beam and sways.

Every surface is painted in code at runtime, with no images and no network requests. The coin faces, Ionic capitals, columns, broken beam and fallen blocks start as height maps and are lit pixel by pixel into `<canvas>`. Bronze gets dirt in its recesses and polish on its high points, and marble gets veining and weathering. The torn paper gets creases, fibre grain, frayed edges and typewriter ink. The sky's clouds are generated from noise.

The work is split into small chunks that run a few rows at a time between frames, so scrolling stays smooth while it paints. Once painted, a surface is kept in memory, so remounting the component doesn't paint it again.

## Fonts

The headline uses a subset of **Gilda Display**, and the typed words use a subset of **Courier Prime**. Both are SIL Open Font License 1.1 fonts, embedded as base64 woff2 inside the component. As the licence asks of modified copies, both subsets are renamed (`McsDisplay` and `McsMono`). Together they add about 32 KB.

It needs nothing beyond React.

```tsx
import MintedCoinScroll from "@/components/ui/minted-coin-scroll"

<MintedCoinScroll
  brand="Obol"
  headline={["Value,", "Minted", "Anew."]}
  tagline="Hold, send and keep value in an economy that never closes."
  primaryAction={{ label: "Open a wallet", href: "/wallet" }}
/>
```

## Interactions

- **Scroll** plays the story. It eases toward your scroll position instead of following it exactly. The chapter rail on the right jumps straight to a chapter.
- **The coin** first says *Unwrap*, and clicking it scrolls you there. After that it says *Toss*: it flips in 3D and lands heads or tails.
- **Easter egg:** the seventh toss always lands on its edge, which happens to a real coin roughly once in 6,000 tosses.
- **Magnetic buttons:** "Join the mint" and the two glass buttons lean toward the cursor and spring back.
- **Context cursor:** a cursor label says what each part does before you click.
- **Pointer response:** the coin tilts toward the pointer, and once the banner is hung, moving the mouse sideways makes it sway like wind.

The custom cursor, the tilt and the magnetic pull only run on devices that can hover with a fine pointer (`(hover: hover) and (pointer: fine)`). On touch screens, taps work normally.

With `prefers-reduced-motion: reduce`, the component drops the scroll animation and shows the finished banner. Tosses change the face instantly.

## Props

| Prop | Default | |
|---|---|---|
| `height` | `"100svh"` | Height of the pinned stage. |
| `scrollLength` | `4` | How much scrolling the story plays across, in stage heights. |
| `brand` | `"Obol"` | Name shown in the wordmark and on the banner. |
| `headline` | `["Value,", "Minted", "Anew."]` | Three lines of headline. |
| `tagline` | … | The line under the coin on the banner. |
| `tickers` | `OBOL, DIGITAL MINT, …` | Words printed on the torn wrapper. |
| `joinAction`, `primaryAction`, `secondaryAction` | — | `{ label, href?, onClick? }` for each button. |

## Notes

- The track is `(scrollLength + 1) × height` tall, and the stage pins with `position: sticky`. Don't put it inside an element with `overflow: hidden`, because that stops sticky from working.
- It uses container query units (`cqw`, `cqh`), so the banner and columns size themselves to the stage, in landscape or portrait.
- It reads the page layout once per scroll frame, once when the pointer enters the stage, and once when the pointer enters a magnetic button. It never reads layout while drawing a frame.
