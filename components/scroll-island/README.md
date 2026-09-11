# Scroll Island

A slim black rail pinned to the edge of the viewport. It rides along as you
scroll, and opens into a panel of options on hover, on focus, or on tap.

Self-contained: Tailwind-free, one inline `<style>` block scoped under `.sil`, no
CSS file, no local imports, no npm dependencies beyond React.

## Usage

```tsx
import ScrollIsland from "@/components/ui/scroll-island"

<ScrollIsland />                                   // default items, right edge
<ScrollIsland side="left" clock={false} />
<ScrollIsland items={myItems} accent="#F97316" />

<ScrollIsland items={myItems}>
  <NowPlayingCard />                               {/* rich header on the open panel */}
</ScrollIsland>
```

Render it once, anywhere in the tree — it takes itself out of flow, so it does
not matter where. It never reflows the page.

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | a 4-item demo set | `{ id, icon, label, meta?, active?, onSelect? }`. `label` is required: it is the button's accessible name whether the island is open or closed. |
| `children` | — | Rich content above the rows on the open panel. Collapses to nothing when closed. |
| `side` | `"right"` | `"left"` or `"right"`. |
| `railWidth` | `44` | Closed width, in px. Also the glyph button diameter. |
| `openWidth` | `268` | Open panel width, in px. |
| `clock` | `true` | Live HH:MM at the foot of the rail. |
| `accent` | `"#1E90FF"` | Active rows, the open clock, the focus ring. |
| `defaultPinned` | `false` | Start open. Hover and focus still drive it. |
| `inset` | `12` | Distance from the viewport edge, in px. |
| `aria-label` | `"Quick controls"` | Names the group. |

## Behaviour

**It scrolls with you because it is `position: fixed`.** That is what pinning to
the viewport means — there is no scroll listener, no `requestAnimationFrame`, and
no work on the main thread while the page moves.

**Open is the union of three inputs**, not just hover:

- hover, for a mouse
- `focus-within`, so tabbing into a row opens the panel — blur is ignored when
  focus moves *between* rows, which would otherwise close the panel under you
- tap, which pins it; Escape or a tap outside unpins

Hover alone would leave it unreachable by keyboard and unusable on touch.

**Labels are clipped, not unmounted.** Closed, the label and meta fade to zero
width but stay in the tree, and each row carries an `aria-label`, so a row is
named identically at both sizes.

**The panel height is not measured.** `grid-template-rows: 0fr → 1fr` is the only
way to transition to a content-driven height without JS; a `max-height` guess
eases wrong and clips tall `children`.

**The clock is SSR-safe** — it starts null and fills in after mount, so the
server and the first client render agree.

Under `prefers-reduced-motion: reduce` every transition collapses to 1ms. The
island still opens and closes; it just stops animating.

## Install notes

- **A transformed ancestor breaks the pinning.** `position: fixed` resolves
  against the nearest ancestor with a `transform`, `filter`, `perspective`,
  `backdrop-filter`, `contain: paint` or `will-change` on those. If the island
  sticks to a container instead of the viewport, that is why — hoist it above
  that element.
- It sits at `z-index: 60`. Raise it with `className` if your overlays sit higher.
- Icons are any inline node. SVGs get sized to 17×17 by the rail; plain
  characters inherit the row's font size.

## What it does not do

- No scroll-progress readout on the rail. The reference it came from had the
  widget drift with scroll; that is a separate behaviour and would need a scroll
  listener. Add one if you want it.
- No nested submenus. One flat list of options.
- Vertical placement is centred and not configurable yet.

## Verifying a change

```bash
npm run check
node tests/scroll-island.test.mjs
npm run dev        # then open #scroll-island and hover the rail
```

`21st render` only picks up a demo file literally named `demo.tsx`, so to
photograph a variant, copy it over that name in the prepared directory first:

```bash
node scripts/prep-publish.mjs scroll-island
cp output/publish-src/scroll-island/demo-music.tsx output/publish-src/scroll-island/demo.tsx
21st render output/publish-src/scroll-island/scroll-island.tsx \
  --demo output/publish-src/scroll-island/demo.tsx --out ./render
```
