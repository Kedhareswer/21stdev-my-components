# Silk Spider Cursor

A 3D jumping spider that lives on your page. It follows the pointer (or your
finger) with an eased, lagging walk, spins silk that sticks only to the
elements you mark, and makes the page feel inhabited. Drop it onto any page as
an overlay; it never blocks clicks.

**Requires `three`** (tested with 0.186). React and three are the only imports.
The spider model and its two photo projections are embedded in the file as
data URIs (about 110 KB), so nothing is fetched and it works offline and in
21st's capture sandbox.

## The storyboard

| Moment | What happens |
|---|---|
| enter | drops in from the top of the page on a drag line, bobs on the silk, lands and bites the line, which springs away |
| walk | the body eases after the pointer and turns to face where it is going; eight legs run 2-bone IK in two alternating groups (L1 R2 L3 R4 / R1 L2 R3 L4); feet stay planted and step only when they drift too far; a foot landing on silk plucks it |
| spin | a drag line trails from the spinnerets; crossing onto a marked element tacks it down there, long elements get tacked every few steps, and new lines sometimes bridge to older ones, so the lines pull each other into web shapes; a line that never finds an element is let go |
| stop | it turns to face you, rears up on its back legs so you see the big eyes, and blinks twice |
| sleep | a few seconds later it settles down, closes its eyes and floats "z z z"; the next move wakes it |
| clear | Delete or Backspace cuts every line loose: the silk springs off its anchors, sheds its dew and fades (ignored while typing in a field) |
| fly | now and then a fly buzzes in; if it hits silk it sticks and struggles, which wakes the spider, and it walks over and wraps it |

## Usage

```tsx
import SilkSpiderCursor from "@/components/ui/silk-spider-cursor"

// Mark what the silk may stick to. It never anchors to empty space.
<nav data-silk-anchor>…</nav>
<h1>{"found".split("").map((c, i) => <span key={i} data-silk-anchor>{c}</span>)}</h1>
<img data-silk-anchor src="/mug.png" />

<SilkSpiderCursor />
<SilkSpiderCursor seedWebs={18} bounceColor="#1430f0" silkColor="#ffffff" />
```

Anchors are read from their live bounding boxes every frame, so silk stays on
its element through scroll, resize and layout changes. Marking each letter of
a big wordmark gives the draped, letter-to-letter webs.

## Props

| Prop | Default | |
|---|---|---|
| `anchorSelector` | `"[data-silk-anchor]"` | what the silk may stick to |
| `seedWebs` | `0` | lines already spun across visible anchors when the page opens |
| `size` | scales with the viewport | leg span in px |
| `silkColor` | `"#ffffff"` | silk and dew |
| `bounceColor` | `"#1530e6"` | the page colour, used as bounce light on the spider's belly |
| `shadowColor` | `"#000a3a"` | tint of the cast shadow |
| `maxThreads` | `120` | oldest lines fade past this |
| `fly` | `true` | let a fly wander in |
| `sleepAfter` | `4500` | still time before it falls asleep, ms |
| `enter` | `true` | drop in on a thread |
| `clearKeys` | `["Delete", "Backspace"]` | keys that clear the webs |
| `modelSrc` | embedded spider | a GLB of your own spider, Y up and facing +Z; legs are found and skinned automatically |
| `topTextureSrc`, `faceTextureSrc` | embedded | the top and front photo projections for the default model |
| `position` | `"fixed"` | `"absolute"` covers the nearest positioned parent instead of the viewport |
| `zIndex` | `50` | |
| `maxDpr` | `2` | device-pixel-ratio cap for both canvases |

## How it is built

- **One loop, two layers.** A single `requestAnimationFrame` drives a 2D
  canvas for the silk and a WebGL canvas (three.js) for the spider. The spider
  is rendered inside a scissor box around it, so the full-page canvas costs
  almost nothing. The loop stops while the tab is hidden.
- **The spider** is a skinned mesh with 17 bones: a root, the abdomen, and two
  per leg. The knee pole swings with the leg from its sculpted rest bend, so a
  foot at rest returns the model's own pose untouched. While it rests, faces
  you or sleeps, the legs ease back into the sculpted pose and the whole body
  rears up around its back feet. A soft shadow falls on a shadow-only plane
  under it.
- **Its look** is baked from a 705k-triangle scan into 7k triangles. Colour
  comes from a top and a front orthographic photo projection, weighted per
  vertex by what each view really saw, with vertex colour as a fallback. The
  vertex alpha carries roughness, so the eyes stay glossy. The blink is an
  eyelid of fur from just above the eyes sliding down.
- **Silk** is one Verlet particle pool shared by every line, so a bridge pulls
  on the lines it hangs from. It runs at a fixed 120 Hz with elastic, tension-only
  constraints. Dew is a sprite, and a second hair-thin strand gives the
  micro-fibre look.
- **Reduced motion:** the spider sits still, breathing and blinking now and
  then. There is no drop-in, no webs and no fly.

## Credits

The default spider is "Prismatic Jumping Spider 3D Model Free" by iRahulRajput
(sketchfab.com/rt699448), licensed CC BY 4.0, reduced and re-textured for the
web. Keep this credit if you ship the default model.
