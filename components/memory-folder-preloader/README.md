# Memory Folder Preloader

A landing-screen preloader that plays like going through an old keepsake
folder. Snapshots from different years drop onto an oxblood table one at a
time, and each one develops as it lands, until the table is a pile of
memories. Then they're swept together and tucked into a cream file folder that
rises over them, with **Welcome** written across its front in pointed-pen
script.

Hover the folder and its front flap tips forward while the photographs slide
back out and fan around it. Hover a photograph and it straightens up, lifts,
and shows its caption. Move away and they all tuck back in.

```tsx
import MemoryFolderPreloader from "@/components/ui/memory-folder-preloader"

// As a standalone welcome screen
<MemoryFolderPreloader />

// As a gate: a "Come in →" link appears on the folder, and clicking it throws
// the photographs off-screen and fades through to your page.
<MemoryFolderPreloader name={"Kedhar\n& family"} onEnter={() => track("entered")}>
  <YourSite />
</MemoryFolderPreloader>

// Your own photographs (they're preloaded, and each drops once it has loaded)
<MemoryFolderPreloader
  memories={[
    { src: "/memories/beach.jpg", caption: "goa, summer '98", date: "'98 5 14", frame: "polaroid" },
    { src: "/memories/grandma.jpg", caption: "grandma turns 70", frame: "square" },
    { src: "/memories/city.jpg", caption: "first night in the city", frame: "print" },
  ]}
/>
```

**No dependencies beyond React.** It ships with no image, font or icon
file:

- The twelve default photographs are illustrated in SVG (a seaside sunset, an
  alpine lake, a birthday cake, a city at night, a fair, a cat at the window, a
  road trip, a yellow street, a snowed-in cabin, hot-air balloons, kite day and
  a sunflower farm). Each one gets film grain, a vignette, a slight sepia fade
  and an orange date stamp.
- The script lettering is **Pinyon Script** (SIL Open Font License 1.1,
  © The PinyonScript Project Authors), converted to SVG outlines for A–Z,
  a–z, 0–9 and `' & ! . , -`. Any `title` or caption using those characters is
  drawn in the real face, whatever fonts the installing project has.
- Every style rule is scoped to `.mfp-*` in one inline `<style>`.

## Props

| Prop | Default | Description |
|---|---|---|
| `memories` | 12 drawn scenes | `{ src?, scene?, caption?, date?, frame?, alt? }[]`. `src` wins over `scene`. `frame` is `"polaroid" \| "print" \| "square"` and cycles through them if you leave it out. |
| `title` | `"Welcome"` | Written in script across the folder, stroke first and then inked. |
| `kicker` | `"A little archive of"` | Small caps, top left. |
| `year` | `"2026"` | Small caps, top right. |
| `tagline` | `"Pull up a chair"` | Small caps, under the title. |
| `name` | `"Good to\nsee you"` | Bold lockup, bottom left. `\n` starts a new line. |
| `footnote` | `"Hover to look back"` | Bottom right. When `children` are given, it's replaced by the enter link. |
| `enterLabel` | `"Come in"` | Text of the enter link. |
| `backdrop` / `paper` / `ink` | `#6b0f14` / `#efe6d2` / `#15110e` | The table, the folder stock and the lettering. |
| `dropIntervalMs` | `260` | Time between photographs landing. |
| `seed` | `7` | Changes where every photograph lands and how it's tilted. |
| `height` | `"100svh"` | Always a definite length, never inherited. |
| `children` | none | Revealed after the visitor clicks the enter link. |
| `onReady` | none | Fires once the folder is up and the lettering has been written. |
| `onEnter` | none | Fires when the visitor clicks the enter link. |
| `className` | `""` | Added to the outer element. |

## Interaction

| | |
|---|---|
| Hover the folder (or focus it and press Enter/Space) | Photographs fan out around it, and the front flap tips forward. |
| Hover a fanned photograph | It lifts, straightens and shows its caption. |
| Leave both | Everything tucks back into the folder. |
| Touch | Tap the folder to fan out or tuck in, and tap a photograph to lift it. |
| Mouse anywhere | The folder tilts slightly and the photographs drift at different depths. |

While the folder is closed, the tucked photographs nudge up every few seconds
to hint that there's something inside.

## Layout

Every position is computed in pixels from the stage size by `layoutMemories`,
which is exported and tested in isolation (`tests/memory-folder-preloader.test.mjs`):

- **Dropped**: a jittered grid over the whole table, visited in random order,
  so the mess covers the screen instead of clumping.
- **Tucked**: standing inside the folder, with their tops peeking over its back
  edge.
- **Fanned**: on landscape screens, evenly spaced along an ellipse by arc
  length rather than angle, so the flatter sides don't pile up. On portrait
  screens there's no room beside the folder, so they're dealt into a band above
  it and a band below. Either way, any photograph that would cover the folder is
  pushed out along its spoke until it clears.
- **Exit**: thrown outward past the edge of the stage.

On landscape screens the folder's width is capped by the stage height, so a
row of photographs always fits above and below it.

## Accessibility

- The folder is a focusable `role="button"` with `aria-expanded`. Esc tucks the
  photographs away.
- The loading counter is a polite live region.
- Under `prefers-reduced-motion: reduce`, the drop sequence is skipped. The
  folder appears with the photographs already tucked in, and every transition
  becomes instant.
