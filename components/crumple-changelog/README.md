# Crumple Changelog

A changelog where every update is a printed poster. Moving between updates
crumples the current poster into a paper ball and unfolds the next one out of
it — a real WebGL deformation, not a scale or a blur.

**Requires `three` and `gsap`** (tested with three 0.186, gsap 3.15; uses
`gsap/ScrollTrigger`). Both fonts are embedded as woff2 data URIs, and every
poster is painted on a canvas, so nothing is fetched: it works offline and in
21st's capture sandbox.

## What you write vs. what it prints

You only write content. Each update becomes a two-ink risograph poster:

| Field | Printed as |
|---|---|
| `headline` | the huge hand-lettered word (Permanent Marker, each glyph set slightly off) |
| `subline` | the smaller lettered line; up to three words get a staggered layout |
| `icon` | `star` · `heart` · `moon` · `smiley` · `bolt`, in the black plate |
| `iconLabel` | tiny text knocked out of the icon (optional) |
| `tagline` | lettered line under the icon (optional) |
| `body` | the short paragraph (up to seven lines) |
| `kind` | the ⓘ NEW / ⓘ IMPROVED badge |
| `date` | "Released …" above a barcode generated from the date |
| `color` | the ink — `CRUMPLE_INKS` has pink, lime, blue, orange, violet and cream |
| `summary` | the italic line under the poster, next to the date pill |

The print: colour plate on white paper with halftone dots where the ink runs
thin (worn edges, starved patches), a black plate that never quite registers,
speckle and paper grain, a ragged cut edge. On pale inks the small print goes
black; on loud ones it knocks out to paper.

## Usage

```tsx
import CrumpleChangelog, { CRUMPLE_INKS } from "@/components/ui/crumple-changelog"

<CrumpleChangelog
  title={"Acme\nchangelog"}
  createdBy="created by the Acme team"
  brand="Acme changelog"
  edition="Pro edition"
  changelogHref="https://acme.dev/changelog"
  updates={[
    {
      date: "2026-10-14",
      kind: "improved",
      headline: "Memory",
      subline: "for your team",
      icon: "star",
      tagline: "+ a calmer admin page",
      body: "Admins can switch Memory on for a whole workspace…",
      summary: "Team memory, private per person, and a calmer admin page",
      color: CRUMPLE_INKS.pink,
    },
    // newest first
  ]}
/>
```

| Prop | Default | |
|---|---|---|
| `updates` | six sample updates | newest first |
| `title` | `"Paperplane\nchangelog"` | `\n` breaks the line |
| `createdBy` | `"created by Kedhareswer"` | |
| `brand` | `"Paperplane changelog"` | printed upside down along each poster's top |
| `edition` | `"Team edition"` | printed down each poster's left edge |
| `changelogHref` | `"#"` | the "Full changelog ↗" link |
| `height` | `"100svh"` | always a definite length |

## Interaction

| Input | What happens |
|---|---|
| drag the ◀▶ knob | the poster crumples continuously with your hand; halfway between two updates it is a ball and swaps; release and it settles to the nearest update |
| click / tap the poster | crumples to the next update (the last one goes back to the first) |
| swipe the poster | left = next, right = previous, tracking your finger |
| hover the poster | the paper dents and wrinkles a little under the pointer and tilts toward it |
| ← → (anywhere while on screen), Home / End on the slider | previous / next / first / last |
| Play all updates | plays through every poster; at the end the button reads "Play again" |

The entrance (on scroll into view, ScrollTrigger): the title rises out of its
mask line by line, the first poster drops in as a spinning paper ball, lands,
and unfolds flat; the ruler's ticks grow out from the knob, then the date pill
and controls arrive.

`prefers-reduced-motion`: no crumple, no drop — posters crossfade.

## How the crumple works

- A 110 × 156 plane wraps onto a sphere whose radius shrinks as the crumple
  grows, keeping arc length, so the sheet really closes around itself; the
  rim rolls back first, the sheet buckles and twists mid-way.
- A per-poster crease map (64 sheet-wide folds + 150 short creases,
  high-passed) displaces it along the surface normal — flat facets meeting at
  sharp creases.
- Normals come from screen-space derivatives, so every facet is lit on its
  own; concave creases get ambient occlusion; the back of the sheet is bare
  paper with the print ghosting through.
- A signed-distance soft shadow melts from the poster's rectangle into the
  ball's disc.

## Fonts

Permanent Marker (Font Diner, Apache License 2.0) and Instrument Serif
(Instrument, SIL Open Font License 1.1), subset to Basic Latin.
