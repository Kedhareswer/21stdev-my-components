# Florilegium Template

A full landing page for a botanical journal and atelier, built around **one
flower that never cuts**. It blooms out of the preloader, settles into the
editorial hero, and every scroll step after that morphs the same mesh into the
next species. Nothing is swapped or cross-faded, so the flower stays unbroken
from the first frame to the footer.

```
scene        flower                     page
-----------  -------------------------  -----------------------------------------------
preloader    a bud rises and opens      brand, ring + counter 000 → 100, "Skip intro"
0 hero       Anemone coronaria, huge    editorial header, search, headline, Today's thread
1 anthesis   Dahlia                     full-width wordmark, panel, side captions, 5 words
2 pixel      Poppy, pixelated           same layout, the flower renders as posterised pixels
3–6 species  four specimens on black    family, serif name, facts, thumbnails, View detail
7–9 footer   Rose → Tulip → Sunflower   paragraphs, newsletter, hand-scribbled notes + word
```

## How it works

- **The flower** is generated on the CPU from a `FlowerForm` (whorls, petal
  counts, length, width, cup, curl, roll, ruffle, tip shape, blotch, veins,
  speckles, disk, stamens, sepals, collar, stem, leaves, colours). Every field
  is a number, so two species interpolate. Counts are fractional, and petals
  grow in or shrink out. The mesh (about 100k vertices on a fixed 32-bit index buffer)
  is rebuilt only while a morph or the bloom is moving. Idle sway runs in the
  vertex shader.
- **Bloom** (0 = closed bud, 1 = open) drives the preloader and the tap-to-rustle
  spring. Outer whorls open first.
- **Pixel scene**: the flower renders into a small framebuffer and is blitted
  back with nearest filtering and a posterised palette.
- **Thumbnails** (Today's thread and the specimen tiles) are snapshots taken
  by the same engine at mount. There are no image files.
- **Handwriting** uses a single-stroke alphabet drawn as SVG, with a seeded
  wobble and a crayon filter on the big word. It draws on as each footer scene
  arrives. No web fonts are used.

**Rendering.** A key light casts real shadows between petals (an RGBA-packed
shadow map, 9-tap rotated PCF). Petals carry a fanned vein network, pigment
mottling, a velvet sheen and backlit translucency, all filmic tone-mapped. Each
petal's geometry is warped by noise and banked, so neighbours shingle over one
another instead of cutting through, and no two petals are alike.

**No dependencies.** React is the only import. WebGL1 with a 2D-canvas
fallback; context loss is handled. DPR is capped at 2, with a smaller pixel
budget in software renderers. Rendering pauses off-screen.

## Interaction

- **Scroll** scrubs every scene, in both directions.
- **Drag** the flower to turn it (with inertia). **Tap** it to make the petals rustle shut and spring back.
- **Search** ("lil", "Rosaceae"…) lists matching species. Enter jumps to one.
- The header nav, the ↑ ↓ buttons, the specimen dots, the thread items and the footer pager all jump between scenes.
- **View detail** opens a drawer with care notes (Esc closes it).
- The newsletter form validates the address and calls `onSubscribe(email)`.
- `prefers-reduced-motion` skips the preloader and stops the idle sway. Scroll still scrubs.

## Usage

```tsx
import FlorilegiumTemplate, { FLORA } from "@/components/ui/florilegium-template"

<FlorilegiumTemplate />

<FlorilegiumTemplate
  brand="Noctiflora"
  theme="dark"
  hero={{ title: "Flowers that open after dark", highlight: "Papaver rhoeas", season: "AW26" }}
  anthesis={{ word: "NOCTURNE" }}
  specimens={[{ name: "Moonflower", latin: "Ipomoea alba", family: "Convolvulaceae", origin: "Americas",
    blurb: "…", form: { ...FLORA.waterlily, colors: { ...FLORA.waterlily.colors, petal: ["#d9dde8", "#f2f3f7", "#ffffff"] } } }]}
/>
```

`demo-nocturne.tsx` shows a full second preset.

## Props

| Prop | Default | Notes |
|---|---|---|
| `brand` | `"Anthesis"` | Logo, preloader and labels. |
| `nav` | Journal / Atelier / Species / Visit | `{ label, href?, scene? }`; `scene: -1` is the last scene. |
| `hero` | anemone copy | `species`, `breadcrumb`, `category`, `title`, `highlight`, `season`, `cta`, `date`, `views`, `threadTitle`, `thread[{ title, to }]`, `hint`. |
| `anthesis` | dahlia + poppy copy | `word`, `species`, `left`, `right`, `pixelSpecies`, `pixelLeft`, `pixelRight`, `words[5]`. |
| `specimens` | 4 species | `{ name, latin, family, origin, blurb, form, note?, care? }`. Any length. |
| `footer` | 3 blooms | `paragraphs`, `blooms[{ species, word, notes[] }]`, `links`, `signature`, `copyright`, `newsletter`. |
| `socials` | Instagram, Pinterest, X | `{ label, href, icon }`. |
| `onSubscribe` | — | Called with a valid email. |
| `palette` / `darkPalette` | warm paper / ink | Override any colour. |
| `theme` | `"auto"` | Follows a `.dark` ancestor, then the OS. Or `"light"` / `"dark"`. |
| `fonts` | system stacks | `{ sans, geo, serif, href }`. `href` injects one stylesheet link. `null` (the default) loads nothing. |
| `preloader` / `preloaderDuration` | `true` / `2.8` s | |
| `pixelBlock` | `9` | CSS px per pixel in scene 2. |
| `alive` | `true` | Idle sway, slow turn and pointer tilt. |
| `height` | `"100svh"` | The sticky stage. Must be a definite length. |
| `sceneScroll` | `0.85` | Stage-heights of scroll per scene. |

`FLORA` exports ten tuned forms: `anemone`, `dahlia`, `poppy`, `ranunculus`,
`magnolia`, `lily`, `waterlily`, `rose`, `tulip`, `sunflower`. Pass a key as
`form`, or spread a preset to build your own.

Layout responds to the **stage**, not the window (`container-type: size`). It
has a designed phone layout and holds in a 21st preview frame.
