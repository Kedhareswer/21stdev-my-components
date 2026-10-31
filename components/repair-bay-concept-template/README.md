# Repair Bay Concept Template

A one-page showcase for a single piece of concept art, laid out like an
art-book entry. The scene is an original night workshop: an old badger
mechanic in brass goggles and a fennec fox apprentice repair a small broken
robot, in front of a flooded tank full of glowing jellyfish.

There are two editions:
- **`demo.tsx`, rendered (the one to publish).** It uses three generated
  renders: the workshop, the same bench on a mustard poster backdrop, and a
  close-up of the mechanic. It also uses the poster's foreground keyed out of
  its backdrop, so the giant title sits *behind* the hanging lamps and chains.
- **`demo-drawn.tsx`, no images.** The scene is layered SVG drawn inside the
  component, re-skinned through props (teal, "Overtime / Deep Water").

**Requires `gsap`** (with ScrollTrigger), declared in the root `package.json`.

## Storyboard

1. **Poster.** A mustard poster with a giant title that drops in letter by
   letter. The HUD frame and its crossing lines draw themselves, the issue
   tag, date, note and "Record by" signature settle in, and the speech bubble
   pops. The hanging lamps and chains sit *in front of* the title: the title
   sits between the poster and its keyed-out foreground (or, in the drawn
   edition, between the scene's back and front layers).
2. **Problem.** Scrolling pushes the camera in and the letters fly off. The
   room goes dark and a dry-brush chapter title ("Strange / Signal") is wiped
   on, then scatters.
3. **Room.** While it is dark, the poster is clipped down into the window
   frame. The lights come back as the camera pulls out, and the poster fades
   to reveal the glowing tank. Live light is layered over the render:
   - sparks at the soldering iron
   - screens and bulbs that flicker
   - light moving through the tank water
   - dust in the beams

   (The drawn edition animates its own jellyfish, hoist, oscilloscope, steam
   and fan.)
4. **Explore.** Numbered hotspots appear. Click one (or Tab, then Enter) to
   open its note in the caption panel, or step through with ← →. A chapter
   index in the corner tracks the four phases.
5. **Details.** Eight square crops of the *same live scene*, which are still
   animated. They wipe in on scroll and zoom on hover. Clicking a crop opens a
   viewer that grows out of the tile. ← → pan the camera across the scene from
   crop to crop, "In the scene" zooms out to the whole room with the crop
   outlined, and Esc closes the viewer.
6. **Dynamics.** The live scene in a film frame with REC, a running timecode
   and letterbox bars that open as you scroll. It cuts between the wide shot
   and every close-up on its own, with a slow push-in on each. There are
   switches for:
   - **Power**: the lights flicker down or up
   - **Sparks**
   - **Play / Freeze**
   - **Cut**: next shot
   - **Mood**: grades the frame amber, abyss teal, coral or ultraviolet
7. **Credits.** A marquee that speeds up with scroll velocity, an outlined
   title that fills with colour as you scroll, the credits, the signature and
   a back-to-top link.
8. **Pointer.** On the main stage, four depth layers move with the pointer
   (parallax), and the title drifts the other way.
9. **Reduced motion.** There are no camera moves, letter flights or loops,
   and the phases change with plain fades.

The poster's three icon buttons all work:
- ↙ jumps to the details
- ✱ cycles the poster colour through `accent` and `accents` (on a photo
  poster, the backdrop is recoloured behind the cut-out)
- ✕ freezes every animation in the scene

```tsx
import RepairBayConceptTemplate from "@/components/ui/repair-bay-concept-template"

<RepairBayConceptTemplate />

// your own renders (all coordinates are scene units, 1600 × 900):
<RepairBayConceptTemplate
  sceneImage="/repair-bay/scene.webp"
  posterImage="/repair-bay/poster.webp"            // same composition, flat backdrop
  posterCutout="/repair-bay/poster-cutout.webp"    // its foreground, backdrop keyed out
  posterCutoutHeight={558}
  windowRect={{ x: 476, y: 62, w: 786, h: 386 }}    // where the poster shrinks to
  fx={{ sparks: { x: 781, y: 473 }, glows: [{ x: 833, y: 452, r: 30, color: "#6dff8c" }] }}
  hotspots={[{ x: 790, y: 338, label: "Brass goggles", note: "…" }]}
  crops={[
    { x: 610, y: 219, size: 257, caption: "Goggles down" },
    { x: 657, y: 286, size: 267, caption: "Spark in the lens", src: "/repair-bay/mechanic.webp" },
  ]}
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
| `crops` | eight | `{ x, y, size, caption, src?, alt? }`: square crops for the details grid and the viewer. With `src`, the tile shows that close-up instead, the film cuts to it, and x/y/size mark where it sits in the scene. |
| `credits` | four | `{ role, name }` |
| `moods` | Amber, Abyss, Coral, Ultra | `{ name, hue, swatch }`: grades for the film frame, as a hue rotation in degrees. |
| `detailsLabel` / `motionLabel` | `Details` / `Dynamics` | Section headings. |
| `accent` / `accents` | `#e9b518` / three more | Poster colour, and the ones ✱ cycles through. |
| `sceneImage` / `sceneAlt` | drawn scene | A 16:9 render, cover-fit to 1600 × 900. |
| `posterImage` | yellow panel | The same composition on a flat backdrop: the hero. |
| `posterCutout` / `posterCutoutHeight` | — / `558` | The poster's foreground with the backdrop keyed out, cropped from the top, and its height in scene units. It goes in front of the title. |
| `fx` | — | `{ sparks?: { x, y }, glows?: { x, y, r, color }[] }`: live light over `sceneImage`. |
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
  class selectors on its host, so power, sparks and freeze are set as
  `--rb-lamp`, `--rb-sparks` and `--rb-play` on the film frame. They reach
  only that copy. The power flicker is a GSAP tween on those variables. Mood
  is a `hue-rotate` filter on the frame.
- **Real artwork.** When you pass `sceneImage`, the image replaces all four
  drawn layers. The poster morph, hotspots, crops, viewer and moods work on
  it unchanged, and `fx` adds the live light. The renders in `demo.tsx` are
  embedded as AVIF `data:` URIs (165 KB in all), so the demo makes no request
  and stays under 21st's 200 KB demo limit. AVIF needs Safari 16 or later.
  Full-size WebP copies, ready for your `public/` folder, are in
  `media/repair-bay-concept-template/public/`. Their origin and processing
  are in `media/repair-bay-concept-template/ASSETS.md`.
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
