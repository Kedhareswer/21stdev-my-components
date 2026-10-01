# Hollow Tide Preloader

A grainy, monochrome loading gate where the percentage fills like a glass.

1. **Load.** The count is set huge in a hairline outline. A live waterline,
   with a translucent back-wave behind it, rises through the numerals as the
   load climbs. Two `LOADING` marquee bands run top and bottom in opposite
   directions. They idle when the load stalls and race when it surges.
2. **Full.** At 100% the glyphs are solid and the bands switch to `LOADED`.
3. **Flood.** The tide spills over. A wave-crested panel rises from the bottom
   and covers the stage. The numerals and bands are held still inside it, so
   they invert in place as the crest passes over them.
4. **Lift.** The flooded card slides up off whatever it was guarding. In
   `loop` mode it drains back down to `0%` instead.

**Interaction.** The pointer's horizontal position tilts the water. Hovering
the numerals stirs it. A tap, click, Enter or Space during the load sloshes
it and rushes it to 100%. After the load, the same input skips the current
hold.

```tsx
import HollowTidePreloader from "@/components/ui/hollow-tide-preloader"

// Looping showcase, nothing else on screen
<HollowTidePreloader loop />

// Page gate, driven by real progress
<HollowTidePreloader progress={loaded} onComplete={() => {}}>
  <YourPage />
</HollowTidePreloader>

// Your own look
<HollowTidePreloader
  label="Developing"
  doneLabel="Fixed"
  palette={{ background: "#ece8df", ink: "#1b1a18" }}
  strokeWidth={1.6}
  fontFamily='"Inter Tight", sans-serif'
/>
```

**No dependencies beyond React.** The numerals, water, crest and film grain
are inline SVG (the grain is an `feTurbulence` filter). One
`requestAnimationFrame` loop drives the progress, the water and the marquee.

## Props

| Prop | Default | Description |
|---|---|---|
| `children` | — | Content revealed once the gate lifts. Ignored while `loop` is set. |
| `loop` | `false` | Load → flood → drain, forever. `onComplete` never fires. |
| `progress` | — | Real progress, `0`–`100`. Leave it out to run a simulated load. The fill waits for `100`. |
| `durationMs` | `4200` | Length of the simulated load (it surges and stalls like a real one). |
| `label` | `"Loading"` | Word in the marquee bands while loading. Also the progressbar's label. |
| `doneLabel` | `"Loaded"` | Word the bands switch to at 100%, and the inverted bands on the flood. |
| `suffix` | `"%"` | Set after the count. `""` for a bare number. |
| `palette` | see below | Partial overrides: `{ background, ink }`. |
| `fontFamily` | Helvetica/Arial stack | Face for the numerals and bands. Nothing is fetched. |
| `fontWeight` | `700` | Weight of the numerals. |
| `strokeWidth` | `1` | Outline width in CSS px. It stays a hairline at any size. |
| `grain` | `0.55` | Film-grain strength, `0`–`1`. `0` removes the layer. |
| `marqueeSpeed` | `42` | Band drift at rest, px/s. Surges and the finish add to it. |
| `height` | `"100svh"` | Root height: a definite length, never a percentage. |
| `onComplete` | — | Fired once, after the gate has lifted. |
| `className` | `""` | Extra root class names. |

| Palette key | Default | Used for |
|---|---|---|
| `background` | `#222221` | the stage, and the inverted type on the flood |
| `ink` | `#f4f3ef` | outline, water, bands, and the flood itself |

## Demos

- `demo.tsx`: the looping showcase, full bleed.
- `demo-gate.tsx`: driven by real (faked) asset progress; lifts to reveal a page.
- `demo-ink.tsx`: paper-and-ink palette, heavier outline, custom words.

## Install safety

- Explicit `height`, never `h-full`.
- Every rule in the scoped `<style>` block is `.htp-` prefixed. SVG
  `max-width` is reset against Tailwind Preflight.
- Clip-path and filter ids come from `React.useId()`, so two instances on one
  page don't share them.
- The water's travel is measured from the real ink box of the digits in
  whatever face resolved (`measureText`), so 0% is dry and 100% is full in any
  font.
- `prefers-reduced-motion: reduce` stills the water, the marquee and the grain.
  The flood and lift become fades.
- The gate is a focusable `role="progressbar"` with `aria-valuenow`.
