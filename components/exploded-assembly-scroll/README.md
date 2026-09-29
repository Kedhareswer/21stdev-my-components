# Exploded Assembly Scroll

An engineering-services page whose drawing builds itself as you scroll.

A cream spec sheet (nav, breadcrumb, a heavy uppercase headline, three
capabilities with octagon bullets) sits over an orange drawing panel ruled
like a title block. When the panel reaches the top it pins, and scroll
assembles a line-drawn isometric **process pump skid** in four stages:

1. **Structural skid**: rails, cross members, pedestals
2. **Rotating equipment**: motor, coupling and bearing frame, pump casing
3. **Pressure vessel**: skirt and shell, elliptical head, access ladder
4. **Piping & instrumentation**: control panel, suction line and gate valve, discharge riser

Each part is first **traced in** where it floats in the exploded view, then
**slides home** along a dashed leader and lands with a ring, tagged with an
item balloon. Between stages the drawing **holds**: the stage row fills,
gets a tick, and the next one waits for you. Scroll back and it comes apart
again.

**No dependencies.** React is the only import. No images or fonts are
loaded; the machine is SVG built from numbers.

## Interaction

- **Scroll** drives the build. The drawing eases toward the scroll position
  (`smooth`), so wheel steps don't make it stutter.
- **Stop mid-stage** and it settles (`snap`): scrolling down finishes the
  stage, scrolling up backs out of it. It never snaps while a finger is on
  the screen.
- **Stage table**: the active row blinks a cursor and fills with its
  progress; finished rows get a tick. **Click** a row (or Tab to it and press
  Enter) to scroll to that stage finished.
- **Hover** a row or a part: every other stage's parts fade back.
- **Hover the drawing**: a crosshair with a coordinate readout.
- The BOM box lists the current stage's parts, with a spinner while each one
  is moving and a tick once it lands, plus an overall `%` bar.

## Usage

```tsx
import ExplodedAssemblyScroll from "@/components/ui/exploded-assembly-scroll"

<ExplodedAssemblyScroll />
```

Give it a parent with a width and nothing else (see `demo.tsx`). Re-skin
and re-word everything through props (see `demo-graphite.tsx`):

```tsx
<ExplodedAssemblyScroll
  brand="Ironline"
  title="Packaged Pump Skids"
  steps={[
    { title: "Frame & Fabrication", caption: "Base frame", detail: "Jig-welded square to 2 mm." },
    { title: "Machinery Set", caption: "Pump train" },
    { title: "Vessel Install", caption: "Knock-out drum" },
    { title: "Pipe, Wire, Test", caption: "Piping & controls" },
  ]}
  paper="#0f0d0c" surface="#1b1816" ink="#efe4d6" accent="#f06a28"
/>
```

### Your own machine

The geometry helpers are exported, so you can model a different assembly and
pass it as `parts`. The world axes are x (right-back), y (left-back) and z (up),
and parts are painted in array order, back to front.

```tsx
import ExplodedAssemblyScroll, { box, cyl, pipe, type AssemblyPart } from "@/components/ui/exploded-assembly-scroll"

const parts: AssemblyPart[] = [
  { step: 0, label: "Base plate", offset: [0, 0, 60], shapes: box(-60, -40, 0, 120, 80, 8) },
  { step: 1, label: "Housing", spec: "Cast Al", offset: [0, 0, 90], shapes: cyl([0, 0, 8], "z", 50, 30, [25]) },
  { step: 2, label: "Outlet", offset: [0, 40, 40], shapes: pipe([[0, 0, 40], [0, 0, 80], [60, 0, 80]], 6) },
]
<ExplodedAssemblyScroll parts={parts} steps={[/* three steps */]} />
```

| Helper | Draws |
|---|---|
| `box(x, y, z, w, d, h)` | a block: its top and two near faces |
| `cyl(c, axis, len, r, bands?)` | a cylinder from `c` along `"x"`/`"y"`/`"z"`, with optional seam rings |
| `flange(c, axis, r, t?)` | a short fat cylinder |
| `pipe(points, r)` | a pipe through axis-aligned points, with knuckles at the bends |
| `dome(c, r, h)` | an elliptical head on a vertical shell |
| `line(points)` | a stroke-only polyline (rungs, door lines) |

## Props

| Prop | Default | Notes |
|---|---|---|
| `brand` | `"CoreAxis"` | Logo, top left, in the accent. |
| `nav` | Home / About / **Services** | `{ label, href?, active? }[]`. The active one is painted in the accent. |
| `breadcrumb` | Home › Services › Mechanical Design Engineering | The last crumb is the accent. `[]` hides it. |
| `title` / `intro` | reference copy | Headline and mono paragraph. |
| `features` | three capabilities | `{ title, body }[]`, with octagon bullets. |
| `steps` | four stages | `{ title, caption, detail? }[]`. One table row each. |
| `parts` | the pump skid, 12 parts | `AssemblyPart[]`; `step` indexes into `steps`. |
| `tagline` / `statement` | reference copy | Italic line and the big uppercase block. `""` hides either. |
| `company` / `year` | `"CoreAxis Technologies"` / `"2024"` | Footer row. |
| `accent` | `#ec5d1a` | Brand colour and panel. Faces are shaded from it, so a 6-digit hex gives the best result (anything else falls back to `color-mix`). |
| `surface` / `paper` / `ink` | cream / sand / near-black | Card, surround, card text. |
| `panelInk` | `#1c0f07` | Lines and text on the panel. |
| `fontSans` / `fontMono` | system stacks | Headlines / everything else. No fonts are loaded. |
| `height` | `"100svh"` | Height of the pinned panel. **Must be a definite length.** |
| `scrollPerStep` | `0.9` | Panel-heights of scroll per stage. |
| `smooth` | `true` | Ease toward the scroll position. |
| `snap` | `true` | Settle on a finished stage when scrolling stops. |
| `ghost` | `true` | Faint dashed outline of the finished assembly. |
| `onStepChange` | none | `(index)`: the stage being built, `-1` before the first. |
| `className` | `""` | Appended to the root. |

## Notes

- **The panel's height is the scroll budget:** `(1 + stages × scrollPerStep)`
  panel heights. Inside it, a `sticky` stage at `height`.
- The card uses `overflow: clip`, not `hidden`. `hidden` would make it a
  scroll container and the panel would never pin.
- Progress is measured from **the element**, never `window.scrollY`, so it
  works anywhere on a page.
- Scroll schedules one rAF, which writes transforms and CSS variables
  straight to the SVG. React re-renders only when the stage or hover changes.
- Paints its own palette and ignores the page's light/dark theme. For a dark
  page, pass dark `paper`/`surface` and a light `ink` (see `demo-graphite.tsx`).
- Under 720px of container width the grid stacks: drawing on top, stage
  table below, and the BOM, tagline and statement fold away.
- `prefers-reduced-motion`: no easing, no snapping, no smooth jumps, no
  blinking or spinning. The scroll-linked build stays, since it only moves when
  you do.

## Credit

Layout and palette after a reference shot of an engineering-services page
(CoreAxis, via desaina.co). The drawing, the assembly and the code are
original.
