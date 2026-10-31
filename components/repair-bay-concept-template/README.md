# Repair Bay Concept Template

A one-page showcase for a single piece of concept art, laid out like an
art-book entry. The default scene is an original night workshop: an old
badger mechanic in brass goggles and a fox apprentice repair a humming pocket
radio, in front of a flooded tank full of glowing jellyfish.

**Requires `gsap`** (with ScrollTrigger), declared in the root `package.json`.

## Storyboard

1. **Poster.** A mustard poster with a giant title that drops in letter by
   letter. The HUD frame and its crossing lines draw themselves, the issue
   tag, date, note and "Record by" signature settle in, and the speech bubble
   pops. The chain hoist hangs *in front of* the title, because the title sits
   between the scene's back and front layers.
2. **Problem.** Scrolling pushes the camera in and the letters fly off. The
   room goes dark and a dry-brush chapter title ("Strange / Signal") is wiped
   on, then scatters.
3. **Room.** While it is dark, the flat yellow poster shrinks into the window
   frame. The lights come back as the camera pulls out, and the yellow fades
   to reveal the glowing tank: drifting jellyfish, dust in the light, swaying
   hoist, sparks at the soldering iron, a flickering oscilloscope, steam off
   the mug and a spinning desk fan.
4. **Explore.** Numbered hotspots appear. Click one (or Tab, then Enter) to
   open its note in the caption panel, or step through with ← →. A chapter
   index in the corner tracks the four phases.
5. **Details.** Eight square crops of the *same live scene*, which are still
   animated. They wipe in on scroll and zoom on hover. Clicking a crop opens a
   viewer that grows out of the tile. ← → pan the camera across the scene from
   crop to crop, "In the scene" zooms out to the whole room with the crop
   outlined, and Esc closes the viewer.
6. **Dynamics.** The live scene in a film frame with REC, a running timecode
   and letterbox bars that open as you scroll. There are switches for:
   - **Power**: the lights flicker down or up
   - **Sparks**
   - **Play / Freeze**
   - **Mood**: tints the tank amber, abyss teal, coral or ultraviolet
7. **Credits.** A marquee that speeds up with scroll velocity, an outlined
   title that fills with colour as you scroll, the credits, the signature and
   a back-to-top link.
8. **Pointer.** On the main stage, four depth layers move with the pointer
   (parallax), and the title drifts the other way.
9. **Reduced motion.** There are no camera moves, letter flights or loops,
   and the phases change with plain fades.

The poster's three icon buttons all work:
- ↙ jumps to the details
- ✱ cycles the poster colour through `accent` and `accents`
- ✕ freezes every animation in the scene

```tsx
import RepairBayConceptTemplate from "@/components/ui/repair-bay-concept-template"

<RepairBayConceptTemplate />

<RepairBayConceptTemplate
  issue="No.12"
  title="Overtime"
  problem={{ top: "DEEP", bottom: "WATER", tag: "pressure rising" }}
  accent="#1fb5aa"
  // your own 16:9 render instead of the drawn scene:
  sceneImage="/art/overtime.webp"
  windowRect={{ x: 260, y: 80, w: 1080, h: 560 }}   // where the poster shrinks to
  hotspots={[{ x: 820, y: 400, label: "Goggles", note: "…" }]}
  crops={[{ x: 700, y: 300, size: 300, caption: "Goggles down" }]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `issue` / `kicker` / `title` / `year` / `date` | `No.11` / `Concept art` / `Tinkerer` / `2026` / `10 / 31` | Poster text. Keep `title` to one word of 6–10 letters. |
| `bubble` | `BZZZT!!` | Speech bubble. `null` hides it. |
| `note` | a line about the radio | Small mono note under the title. |
| `recordLabel` / `signature` | `Record by` / `Wren` | Poster pill and footer signature. |
| `problem` | `{ top: "STRANGE", bottom: "SIGNAL", tag: "the night shift" }` | The dry-brush chapter title. |
| `hotspots` | six | `{ x, y, label, note }`, in scene coordinates (the scene is 1600 × 900). |
| `crops` | eight | `{ x, y, size, caption }`: square crops for the details grid and the viewer. |
| `credits` | four | `{ role, name }` |
| `moods` | Amber, Abyss, Coral, Ultra | `{ name, tint }`: colour washes for the tank. `tint: null` keeps the original colour. |
| `detailsLabel` / `motionLabel` | `Details` / `Dynamics` | Section headings. |
| `accent` / `accents` | `#e9b518` / three more | Poster colour, and the ones ✱ cycles through. |
| `sceneImage` / `sceneAlt` | drawn scene | A 16:9 render, cover-fit to 1600 × 900. |
| `windowRect` | `{ x: 230, y: 92, w: 1140, h: 548 }` | Where the poster shrinks into. Set it to the bright area of your render. |
| `height` | `"100svh"` | Height of the sticky stage. A definite length. |
| `fontHref` | Google Fonts: Outfit, Permanent Marker, JetBrains Mono, Caveat | `null` loads nothing. |
| `displayFont` / `brushFont` / `monoFont` / `scriptFont` | those four, then system fallbacks | |

## Notes

- **The art is made here.** The scene is layered SVG:
  - wall, window and tank
  - cables, hoist and ceiling lamp
  - the bench and the characters
  - the foreground, haze and dust

  The layers live once in `<defs>`. The stage, the eight detail tiles, the
  viewer and the film frame all `<use>` them, so the art is drawn once and
  every copy stays animated. The jellyfish, dust, shelf clutter and grime come
  from a seeded RNG, so they are the same on every load. Nothing is fetched
  except the font stylesheet.
- **Per-copy switches are CSS custom properties.** A `<use>` clone ignores
  class selectors on its host, so power, sparks, freeze and mood are set as
  `--rb-lamp`, `--rb-sparks`, `--rb-play` and `--rb-tint` on the film frame.
  They reach only that copy. The power flicker is a GSAP tween on those
  variables.
- **Real artwork.** When you pass `sceneImage`, the image replaces all four
  layers. The poster morph, hotspots, crops, viewer and moods work on it
  unchanged. Pointer parallax then moves the one image layer.
- **Scroll.** The hero is `position: sticky` inside a section five stage
  heights tall. One scrubbed timeline drives all four phases. There is no
  ScrollTrigger pinning. Intro tweens and scroll tweens animate different
  elements (the inner and outer spans), so they never fight over a property.
- **Accessibility.**
  - The scene has a text description.
  - Hotspots are focusable buttons with labels, and the caption panel is
    `aria-live`.
  - The viewer is a modal dialog with Esc and arrow keys. It moves focus to
    Close when it opens and back to the tile when it closes.
  - Every control has a visible focus ring.
- **21st covers.** The demos load Google Fonts, which the capture sandbox
  blocks, so supply a cover shot with `--preview`.
