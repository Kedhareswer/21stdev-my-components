# Type Remix Preloader

A loading gate for a designer's portfolio. While the page loads, one word
(`PORTFOLIO` by default) is re-typeset through seven cover treatments, each
wiping over the last as the count climbs:

| Take | Look |
|---|---|
| `sticker` | Heavy grotesk covered in die-cut stickers: an air-mail stamp, a spinning motto badge over the O, a mug, a waffle, a frog, and a handwritten year |
| `felt` | Fuzzy multicolour felt letters, a pirate-hat mascot, a spinning ship's wheel in place of the last O, and a waving line |
| `bubble` | Inflated 3D bubble letters that bounce in, with sparkles, a drip and pill tags |
| `script` | A heavy italic script with a white sticker outline, surrounded by design-tool placeholder boxes |
| `stretch` | Condensed caps stretched to different heights, breathing |
| `vector` | Lime caps on a design canvas: a bounding box, a pen tool, an eye in the O, a rotating services seal, and a cursor that follows your pointer |
| `cutout` | A ransom-note collage of cut paper letters, which is where the count lands |

At 100 the camera pulls back to a 3 × 3 moodboard of every take, with an index
tile and a count tile, and the tiles burst away off the page underneath.

**Interactive.** Click anywhere while it loads to slap down a sticker (smiley,
heart, bolt, flower, WOW, HI!, frog). The pointer drifts the stickers in
parallax and steers the cursor on the vector take.

**No dependencies.** React is the only import. Every sticker is SVG drawn in the
file, and the styles are one scoped `<style>`. The display faces (Archivo Black,
Anton, Titan One, Shrikhand, Rubik, DM Serif Display, Abril Fatface, Caveat,
Space Mono) come in through an injected Google Fonts `<link>`. Pass
`fontHref={null}` to load nothing and fall back to system faces. The count
holds at 000 until the faces land, for at most 1.6s.

```tsx
import TypeRemixPreloader from "@/components/ui/type-remix-preloader"

<TypeRemixPreloader loop />                                    // showcase, runs forever

<TypeRemixPreloader progress={loaded} onComplete={() => setReady(true)}>
  <YourPortfolio />
</TypeRemixPreloader>

<TypeRemixPreloader
  word="SHOWREEL"
  name="Tomas Ferreira"
  takes={["vector", "bubble", "stretch", "cutout"]}
  themes={{ stretch: { bg: "#ff5a36" } }}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `children` | — | Revealed once the gate lifts. Ignored while `loop` is set. |
| `loop` | `false` | Showcase mode: plays, pulls back, bursts and starts over. |
| `progress` | — | Real progress, 0–100. Leave it out to simulate over `durationMs`. |
| `durationMs` | `7000` | Length of the simulated load. |
| `word` | `"PORTFOLIO"` | The word to remix. Two-line takes break it at a space, or in half. |
| `name` | `"Ines Calder"` | Byline on the takes and the index tile. |
| `discipline` | `"Graphic Design"` | HUD centre line, script and stretch captions. |
| `year` / `period` | `"2026"` / `"October 2025 — 2026"` | Handwritten year and badges / HUD date line. |
| `handle` | `"inescalder.studio"` | HUD top-right and the cut-out caption. |
| `roles` | Motion Design, Illustration, Branding, Packaging | Felt tag row, vector seal and index tile. |
| `kicker` | `"A Design"` | Heading on the vector take. |
| `tagline` | `"Personal Project"` | Line under the cut-out finale. |
| `motto` | `"great day ahead"` | Words that circle the sticker badge. |
| `takes` | all seven | Which takes play, in order. The last one is where the count lands. |
| `themes` | — | `{ [take]: { bg, ink, accent, pop } }` overrides. `pop` is the per-letter colour cycle of the felt and bubble takes. |
| `moodboard` | `true` | Pull back to the moodboard before lifting. `false` fades straight out. |
| `stickers` | `true` | Click to stick. |
| `hud` | `true` | Corner type, take index, count and progress hairline. |
| `fontHref` | Google Fonts URL | Stylesheet for the faces. `null` loads nothing. |
| `height` | `100svh` | A definite length, never a percentage. |
| `onComplete` | — | Fired once, after the gate has lifted. |

## Notes

- **Takes never cut faster than one per 640ms**, so a real `progress` that jumps
  straight to 100 still shows every take briefly instead of flickering through them.
- **Accessibility.** The gate is a `progressbar` with its value, and "Loaded" is
  announced politely. The scenes are decorative and hidden from assistive tech.
- **Reduced motion.** Takes appear without wipes or entrances. The loops, the
  grain and the pull-back are off, and the moodboard fades out instead of bursting.
