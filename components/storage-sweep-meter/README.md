# Storage Sweep Meter

A disk-usage card whose bar is an LED dot matrix. The used space is one continuous rounded bar, sliced into categories by hairline dividers. Each slice has its own glowing outline and a fine grid of dim dots, and its lit cells sit on a checker lattice in a texture of its own: a dense lattice, rain falling from the top, a rising floor, a diamond, or a loose scatter. The top and bottom rows are lit like a frame, and the whole bar is bloomed so it reads like LEDs. The free space runs on as a faint dotted track.

On load the card scans: a white-hot front sweeps the bar from left to right, the segments light up behind it, sparks lift off the front, and the used total and every legend size count up while the status line flicks through paths. When the scan finishes, the footer offers the first thing worth clearing. Hover **Clear caches** and that segment is picked out. Press it and the segment is eaten from its right edge. A white-hot edge moves left, cells catch peach-white just ahead of it, and a plume of pixels lifts off and drifts up and to the right out of the bar. Everything to its right slides along behind the edge, and the counter ticks down. The status line reads *Freed 45.1 GB* and the footer moves on to the Trash. When nothing is left, it says so.

All the data in the default demo is made up. It needs nothing beyond React.

```tsx
import StorageSweepMeter from "@/components/ui/storage-sweep-meter"

<StorageSweepMeter
  total={256}
  categories={[
    { id: "apps", label: "Apps", size: 38.2, color: "#22c3e6", icon: "apps" },
    { id: "media", label: "Media", size: 61.5, color: "#ec4899", icon: "photo", note: "Mostly video." },
    {
      id: "cache",
      label: "Cache",
      size: 18.9,
      color: "#f59e0b",
      icon: "box",
      clear: { keep: 0.4, message: "Cache is using {size}.", action: "Clear cache", verb: "Clearing cache" },
    },
  ]}
  onClear={(id, gb) => console.log(id, gb)}
/>
```

## Interactions

- **Hover or focus a legend item** to isolate that category: its segment brightens and the others dim. The status line shows its size and a note. Click or tap an item to pin it, and click again to let go.
- **Hover the bar** with a mouse to do the same from the segment itself. Dots near the cursor brighten and grow slightly. This lens only runs on devices that can hover with a fine pointer (`(hover: hover) and (pointer: fine)`). On touch screens, a tap on a segment pins it.
- **Clear** sweeps the suggested category down to its `keep` size and fires `onClear(id, freedGB)`. Categories with a `clear` block are offered one at a time, in order.
- **Rescan** resets every size and replays the scan.

The legend items, Rescan and the clear action are real buttons, the status line is an `aria-live` region, and the canvas carries a text summary of every size.

With `prefers-reduced-motion: reduce`, the scan and the clear finish on their first frame. There are no sparks, no rising pixels and no twinkle, and the spinner holds still.

## Props

| Prop | Default | |
|---|---|---|
| `categories` | 9 made-up categories | `{ id, label, size, color, icon?, texture?, note?, clear? }[]`. `texture` is `lattice` (default), `rain`, `rise`, `diamond` or `scatter`. `size` is in GB, `color` is a hex string. `icon` is one of `apps`, `film`, `gear`, `code`, `doc`, `box`, `photo`, `music`, `trash` or `dot`. `clear` is `{ keep, message, action, verb, paths? }`, where `{size}` in `message` is replaced with the current size. |
| `total` | `512` | Disk capacity in GB. The bar's full width. |
| `barOrder` | apps, documents, developer, photos, movies, system, music, caches, trash | The order of the segments, by `id`. The legend keeps the `categories` order (column by column, three to a column). |
| `scanPaths` | 12 made-up paths | What the status line flicks through while scanning. |
| `onClear` | — | `(id: string, freedGB: number) => void` |
| `height` | `"100svh"` | Height of the stage. |
| `className`, `style` | — | Applied to the stage. |

## Notes

- The card itself is always dark, like a small instrument panel, so the lit cells have something to glow against. The stage around it follows the host's `--color-background`, and the card's border mixes in `--color-foreground` so it still reads on a dark page.
- The bar is a single canvas, sized by a `ResizeObserver`. It overhangs the bar by 150px at the top so the rising pixels can drift into the header, and it ignores pointer events, so nothing underneath stops working.
- The bar is drawn once per frame to an offscreen canvas and composited twice: blurred and added for the bloom, then sharp on top.
- The frame loop pauses when the card scrolls off screen or the tab is hidden.
- Cell patterns are seeded, so the same data draws the same matrix every time.
