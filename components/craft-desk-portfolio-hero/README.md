# Craft Desk Portfolio Hero

A full-bleed portfolio hero drawn as an illustrator's desk, seen from above: a
green cutting mat, a torn sheet with **PORTFOLIO** lettered in felt-tip, a die-cut
sticker of you throwing a peace sign, a sticky to-do list, a glue bottle and its
puddle, crayons, a polaroid, pencil shavings, paint brushes, washi tape, paper
clips, a spiral sketchbook with a figure study, and a drawing tablet — all in
thick-outlined cartoon style, with slanting window light over the top.

It is a toy as well as a hero. Everything on the desk can be picked up:

| Do this | And |
|---|---|
| Drag any object | It lifts off the mat, casts a longer shadow and lands on top |
| Tap a to-do row | A red tick draws in and the row is struck through |
| Tap a crayon, then draw on the sketchbook | You doodle in that colour; the swatch on the page shows which |
| Tap the eraser on the sketchbook | The doodles go |
| Tap the glue bottle | It squishes and the puddle spreads (five squeezes, then it resets) |
| Tap the orange key on the tablet | The lamp switches off, and the desk falls into shade |
| Tap the sticker | It winks |
| Tap a star | It spins |
| Tap the polaroid | It develops again |
| Tap the title | It re-letters itself |
| Tap the name note | Opens `nameHref`, if you gave one |
| **Tidy the desk** | Everything goes back where it started |

Keyboard: the main pieces are in the tab order; arrow keys move the focused one
(hold Shift for bigger steps) and Enter/Space does its tap. To-do rows are
checkboxes.

Everything is generated. No image file, no icon set, no font file, no npm
dependency beyond React.

## Usage

```tsx
import CraftDeskPortfolioHero from "@/components/ui/craft-desk-portfolio-hero"

<CraftDeskPortfolioHero />
<CraftDeskPortfolioHero name="Your Name" nameHref="https://you.dev" />
<CraftDeskPortfolioHero
  title="Showreel"
  tag="Motion"
  year="Vol. 3"
  todos={["Storyboard", { text: "Animatic", done: true }, "Sound pass"]}
  matColor="#1f6fa8"
  crayons={["#ff5a7a", "#ffb000", "#7c4dff", "#00b894"]}
  height="44rem"
/>
```

Every rule is scoped to `.cdp-*` inside the component's own `<style>`; no
Tailwind utilities.

## Props

| Prop | Default | What it does |
|---|---|---|
| `height` | `"100svh"` | Height of the hero. Must be a definite length. |
| `minHeight` | `"560px"` | Floor, so the desk stays readable on short viewports. |
| `title` | `"Portfolio"` | Lettered on the torn sheet. Around ten characters stay big; longer shrinks to fit. |
| `name` | `"Kedhareswer Naidu"` | The torn note. Broken onto two lines at the first space. |
| `nameHref` | — | Tapping the name note opens this in a new tab; a small red arrow appears. |
| `tag` / `year` | `"Design"` / `"2026"` | The yellow and orange tape labels. |
| `todoTitle` | `"To-do list"` | Heading on the sticky note. |
| `todos` | 4 rows | `string` or `{ text, done }`. Four fit, about twelve characters each. |
| `avatar` | drawn face | Image for the sticker, cropped to a circle. |
| `photo` | drawn sunset | Image for the polaroid. |
| `matColor` | `"#2f9a57"` | The cutting mat. The grid is drawn over it in white. |
| `crayons` | red, orange, green, blue | Four colours; also the doodle inks. |
| `onPieceTap` | — | `(id) => void` on every tap — `"glue"`, `"avatar"`, `"todo"`, `"crayon-2"`… |
| `className` | — | On the root `<section>`. |

Do not pass `height="100%"`. The desk is fitted to the root's box, so a
percentage height collapses to 0px on any installed page.

## Two desks

The objects are drawn round their own origins and placed from a layout table.
When the hero's box is taller than it is wide (aspect below 0.9) the same
objects are rearranged on a tall desk, so a phone gets a full composition rather
than a thumbnail of the wide one. The switch is measured on the component with a
`ResizeObserver`, not by media query — the hero is rarely the whole viewport.
Moved pieces keep their offsets across the switch; doodles live in the
sketchbook's own coordinates, so they travel with it.

## The lettering is drawn

The title, the labels, the list and the name are felt-tip capitals from a drawn
alphabet in the file — centre-line strokes set with a round pen and a small
repeatable wobble per letter — not a font. A script font stack resolves
differently on every machine and to a serif on the headless box that renders
the cover. Lower case is set as capitals, and unknown characters become spaces.

## Notes

- `touch-action: none` is set on the pieces only, so a phone can still scroll
  past the hero by swiping the mat.
- `prefers-reduced-motion` shows the title fully lettered, stops the light and
  twinkles, and removes the lift, spin, squish and tick transitions. Dragging
  still works.
- The avatar and photo, when given, render as SVG `<image>` with
  `max-width: none` so Tailwind Preflight cannot collapse them. A URL from
  another origin will render on a real page but blocks 21st's cover capture —
  use a data URI in a demo.
- The drawn sticker face is a generic cartoon, not a likeness. Pass `avatar` to
  make it yours.
