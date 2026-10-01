# Frosted Folder Window

A travel memory kept in a pane of frosted glass. A window with folder tabs —
**Places**, **Journal**, **Archive** — floats over a sunlit garden. The frame
is heavily frosted and the pane inside only lightly, so the garden still reads
through the words. Each place is lit at its own hour, and switching places
re-lights the whole scene: noon, morning haze, golden hour, or dusk with the
lamps coming on.

```tsx
import FrostedFolderWindow from "@/components/ui/frosted-folder-window"

<FrostedFolderWindow
  places={[
    {
      title: "Quiet Escapes",
      location: "Delhi, India",
      date: "May 12, 2024",
      tagline: "Moments offline.\nMemories online forever.",
      sizeMB: 4.2,
      light: "noon",
      journal: ["Lodhi Garden at noon…"],
    },
  ]}
  onNote={(index, note) => save(index, note)}
/>
```

**No dependencies beyond React.** One file, one scoped `<style>`, no network.

## What you can do with it

| Where | What happens |
|---|---|
| **Places** | Flip places with the side arrows, the dots in the divider, a swipe, or ← → on the focused pane. The title rises in letter by letter and the scene's light changes. |
| **View** (footer) | Toggles the cover and a file list of every place. A row opens that place. |
| **3 items** (footer) | Opens the archive. |
| **Journal** | Notes for the current place. Type a line and press Enter or **Pin** to add it. `onNote` gets it. **Write** focuses the input. |
| **Archive** | One folder per place, with a painted thumbnail at that place's hour. **Sort** toggles newest and oldest first. A folder opens that place. |
| 🔴 | Closes the window into a small dock. The dock reopens it. |
| 🟡 | Rolls the window up into its tab bar, and back down. |
| 🟢 | Zooms to a wider window, and back. |
| The glass edge, or the traffic-light tab | Drag to move the window. Double-click to put it back. |
| The pointer | The garden drifts a little, the window tilts toward it, and a soft highlight follows it over the glass. |

## Props

| Prop | Default | Notes |
|---|---|---|
| `places` | Delhi, Udaipur, Jaipur | `EscapePlace[]`, below. |
| `tabLabels` | `Places / Journal / Archive` | Rename any of the three. |
| `defaultTab` | `"places"` | `"places"`, `"journal"` or `"archive"`. |
| `defaultIndex` | `0` | Which place opens first. |
| `image` | — | A photo URL to sit behind the glass instead of the painted garden. |
| `seed` | `7` | Every number paints a different garden. |
| `tint` | `"#e4e0b0"` | Glass colour, `#rrggbb`. A bad value falls back. |
| `ink` | `"#f4edcc"` | Text and hairline colour, `#rrggbb`. |
| `draggable` | `true` | Let the window be dragged. |
| `notePlaceholder` | `"Add a line to this entry…"` | |
| `onPlaceChange` | — | `(index, place) => void` |
| `onNote` | — | `(index, note) => void` |
| `height` | `"100svh"` | **Must be a definite length.** |
| `className` | `""` | Appended to the root. |

### `EscapePlace`

| Field | Notes |
|---|---|
| `title` | Two words break onto two lines, as in the reference. Use `"\n"` to choose the break. Long titles shrink to fit. |
| `location`, `date` | Shown top left and right. Dates `Date.parse` understands sort properly in the archive; others go last. |
| `tagline` | Small caps under the title. `"\n"` breaks the line. |
| `sizeMB` | Shown per place and summed in the footer. |
| `light` | `"noon"` (default), `"morning"`, `"golden"` or `"dusk"`. |
| `journal` | Paragraphs for the Journal tab. |

## The garden

Painted once on a canvas from `seed`: a sky, a block of flats with a flag, a
pavilion in the haze, far trees, a lawn with dappled shade and a few thousand
blades of grass, a neem with branches and a canopy of leaf clusters lit from
the upper left, and a hedge in front, leaf by leaf, larger as it comes toward
you. It repaints only when its size actually changes, at no more than 1.5×
device pixels. The light of each hour is a CSS layer over it that fades in,
not a repaint.

## Things it took

| Before | After | Why |
|---|---|---|
| The window was a size container, for `cqw` type | Sized in `--u`, resolved against the stage's container | `container-type` on an ancestor of the glass makes it a backdrop root in Chrome: the frost blurred nothing |
| The pointer glare blended with `soft-light` | A plain translucent gradient | A blended child isolates the window's stacking context, which cuts the glass off from the garden just the same |
| Fade on entrance, close and roll-up | Transforms only | Opacity and clip-path on an ancestor are backdrop roots too; the glass would flash sharp for the length of the animation |
| One frosted box with the pane inside it | The frame is a masked ring; the pane is its sibling | Nested frost stacks: the pane would show the frame's heavy blur, not the garden |
| `ctx.filter` blur on the far scenery | No blur; the glass softens it | Per-draw-call filters made the first paint take seconds |
| The trunk under the title | The trunk on the right, leaning in | It read as a crack through the headline |

## Install safety

- The root takes an explicit `height`, never a percentage. Percentage heights appear only on absolutely positioned layers.
- All styles live in one scoped `<style>`; every selector starts with `.ffw-`.
- The demos make no network requests, so 21st can capture them. With `image`, the capture sandbox will block an off-site photo.
- No web fonts: the display face is a serif stack that ends in Georgia.
- Honours `prefers-reduced-motion`: no parallax, no tilt, no letter or card entrances, and the hour changes without a fade.
