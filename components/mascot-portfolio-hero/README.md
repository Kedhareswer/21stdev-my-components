# Mascot Portfolio Hero

A full-bleed portfolio poster: a one-point-perspective grid room, a stacked
display headline (`2026 ↘ UI / PORTFOLIO / DESIGN / WORK(S)*`) with a looping
swash, a vertical tag and bracket arcs, a split "Seeking / UI · Graphic" pill,
a doodled flower and arrow, a services row — and a 3D-style mascot in a beanie
who **turns to face your cursor**.

Everything is drawn in the one component file. There is no image, no model, no
font file and no icon set: the character, the room and the doodles are SVG.

## Usage

```tsx
import MascotPortfolioHero from "@/components/ui/mascot-portfolio-hero"

<MascotPortfolioHero />                                   // full-viewport poster
<MascotPortfolioHero initials="KN" href="#contact" />     // your mark, pill links out
<MascotPortfolioHero beanie="#2f3d8f" shirt="#1f2a5c" accent="#f2b33d" />  // restyle the character
```

No npm dependencies beyond React, and no Tailwind utilities. Every rule is
scoped to `.mph-*` inside the component's own `<style>`.

## The character

- **Follows the pointer.** The head, face, nose, eyes, brows, ears, blush and
  beanie are separate layers. Each one moves by a different amount, so the flat
  drawing reads as a head turning. The features ride over the skull and the
  nose sits out in front of them. The ears move the opposite way and
  foreshorten. The maths is the `// #region gaze` block: `aim` → `approach` →
  `pose`.
- **Reacts to proximity.** Bring the cursor close to the face and the eyes widen
  and the brows lift.
- **Blinks**, now and then twice in a row.
- **Idles.** After 3.5s with no pointer, it looks around the room by itself.
- **Click / tap / Enter** makes it grin with happy eyes and bigger blush. The
  leather tag wiggles and a speech bubble shows the next line of `greetings`.
- Tracking uses window-level pointer events, so touch drags steer it too. The
  loop writes straight to the SVG, not to React state, and does no work while
  the hero is off screen.

`prefers-reduced-motion`: idle wandering, blinking, breathing and every CSS
animation are off. The head still follows the pointer, because the user is the
one moving it, but it snaps there instead of drifting.

## Props

| Prop | Default | What it does |
|---|---|---|
| `height` | `"100svh"` | Must be a definite length. |
| `minHeight` | `"440px"` | Floor for the height. |
| `index` / `discipline` | `"08/01"` / `"Visual design"` | The pill, top left. |
| `tagline` | `"Make it helpful"` | Bold line beside it. |
| `collection` | `["Selected", "Works"]` | `{A/B}`, top centre-right. |
| `reel` | `["Sample reels @ 2026", "Visual design"]` | Two lines beside the green dot. |
| `year` / `initials` | `"2026"` / `"UI"` | Line one, either side of the arrow. |
| `badge` | `"Hire me"` | The ringed stamp. |
| `line2` / `line3` | `"Portfolio"` / `"Design"` | `line3`'s last letter gets the swash. |
| `word` / `verticalTag` / `bracketed` | `"Work"` / `"Visual"` / `"S"` | The big fourth line: `WORK [VISUAL] (S)*`. |
| `seekingLabel` / `seeking` | `"Seeking*"` / `"UI / Graphic"` | The two halves of the pill. |
| `href` | — | Makes the green half a link. |
| `services` | four disciplines | The bottom row. |
| `greetings` | four lines | Cycled, one per click. |
| `skin` `beanie` `shirt` `tag` | warm peach, near-black, near-black, tan | Character colours. Shading is layered over the flat fills, so any colour still looks rounded and lit. |
| `accent` `paper` `ink` | green, `#ebebea`, `#111` | The poster palette. |
| `className` | — | Appended to the root. |

## Layout

The root is a CSS size container. In landscape the poster is a 16:9 stage
centred in the box. In portrait it switches to a stacked layout: the headline,
pill and services sit above, and the character stands along the bottom edge.
All type is sized in container units, so it scales with the stage rather than
the viewport. The room grid always fills the whole root.

Do not pass `height="100%"`. On an installed page the ancestors have no height,
so it collapses to 0px.

## Fidelity note

This is a reconstruction of a Chinese-language portfolio poster, set in English:
作品集 → *Works*, 视觉 → *Visual*, 面試 → *Hire me*, 求職崗位 → *Seeking*, and the four
design disciplines along the bottom. The character is an original drawing in the
same spirit (beanie with leather tag, glossy eyes, big grin, cheek star, black
polo). It is not a trace of the reference render.

The display face is a system heavy-grotesque stack (`Archivo Black` → `Arial
Black` → Helvetica). No webfont ships with a 21st component.

The poster uses no semantic colour tokens, so it looks the same in light and
dark by design.

## Checks

```bash
npm run dev     # /#mascot-portfolio-hero, /#mascot-portfolio-hero/custom, ?dark
npm run check
node tests/mascot-portfolio-hero.test.mjs
```
