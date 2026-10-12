# Cold Flame Drift

A field of grainy, hand-printed flames sliding along a diagonal. Every tongue
has a blunt base and a pointed tip. Some split into two prongs, and some throw
a lick off one side. A slow noise current bends the rows into S-curves as they
travel. Two inks stipple into each other like a risograph pull, and short dash
marks drift through the gaps. The grain re-rolls at 12 fps, so the print seems
to boil like hand-drawn animation.

Full-bleed by default. Use it as a **background**: children sit on top.

**No dependencies.** One raw WebGL fragment pass, and React is the only import.
No textures, no image assets, no fonts.

## Interaction

- **Hover** stokes the fire. Flames curl around the pointer, bulge away from it and run hotter.
- **Move fast** and the whole field races, then settles back to its drift.
- **Click** sends a flare ring through the flames. Clicks on links, buttons and inputs don't.

## Usage

```tsx
import ColdFlameDrift from "@/components/ui/cold-flame-drift"

<ColdFlameDrift />                                  // cobalt, full screen
<ColdFlameDrift palette="ember" angle={90} />       // upright orange fire
<ColdFlameDrift light="#ff4fa3" dark="#7a1250" background="#0b0207" />
<ColdFlameDrift scale={70} forks={1} dashes={0} grain={0} height={480} />

<ColdFlameDrift>
  <h1 className="m-auto text-7xl text-white">Burn cold.</h1>
</ColdFlameDrift>
```

| Prop | Default | |
|---|---|---|
| `palette` | `"cobalt"` | `cobalt` · `ember` · `jade` · `violet` · `bone` |
| `background` / `light` / `dark` / `dashColor` | from palette | Hex colours that override one slot of the palette |
| `angle` | `42` | Direction the flames point and travel, in degrees counter-clockwise from → (`90` = straight up) |
| `scale` | `110` | Row spacing in CSS px, which sets the size of the whole pattern |
| `length` | `3.6` | Flame length, in rows |
| `thickness` | `1` | Flame width multiplier |
| `turbulence` | `1` | How hard the current bends the rows (`0` = straight) |
| `speed` | `1` | Drift speed (`0` holds the field still while the flames keep flickering) |
| `forks` | `0.55` | Share of flames with split tips and side licks, from 0 to 1 |
| `dashes` | `0.6` | Density of the dash marks, from 0 to 1 |
| `grain` | `1` | `0` gives clean vector edges and `1` gives full print stipple |
| `grainSize` | `1` | Size of one speck in CSS px |
| `boil` | `true` | Re-roll the grain at 12 fps |
| `seed` | `0` | Reshuffles which flames appear where |
| `interactive` / `pointerRadius` | `true` / `220` | Pointer curl, speed-up and click flare, and how far they reach |
| `paused` | `false` | Freeze on the current frame |
| `height` | `"100svh"` | Any CSS length |
| `children` | | Laid over the flames. Links, buttons, inputs and `[data-interactive]` stay clickable |

`PALETTES` is exported too, so you can build swatches from the presets (see `demo-studio.tsx`).

## Notes

- With reduced motion it draws one still frame and redraws only when a prop changes. There is no boil, no drift and no flare.
- The render loop sleeps while the component is off-screen. Device pixel ratio is capped at 1.5, because grain this fine doesn't need more.
- If WebGL is missing, the root shows the same inks as soft diagonal bands rather than an empty box.
