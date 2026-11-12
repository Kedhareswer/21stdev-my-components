# Eyelet Curtain Tear

A cutwork cotton curtain hanging in a sunlit window. Every eyelet is a real hole,
so the morning sun flares through the embroidery and the thin cotton glows where the
sun sits behind it. Brush past and the cloth billows. Grab it and pull, and it
stretches, rips under the rod and drags a flap down. Yank enough and it falls away
to show the garden.

```tsx
import EyeletCurtainTear from "@/components/ui/eyelet-curtain-tear"

<EyeletCurtainTear />

// Your own photo behind the glass (defocused, and its highlights bloom through the eyelets)
<EyeletCurtainTear backdropSrc="/images/garden.jpg" onTornDown={() => console.log("open")} />
```

**Dependencies:** `three`, including its `examples/jsm` post-processing passes
(EffectComposer, RenderPass, UnrealBloomPass and OutputPass). Nothing is fetched unless
you pass `backdropSrc`. The cloth (weave, mottling, satin-stitch rims, flower, ring and
fan eyelets, hemstitch columns and the border band) and the default window (sky, sun,
layered trees, lawn, glazing bars) are both painted to offscreen canvases at runtime.

## Props

| Prop | Default | Description |
|---|---|---|
| `fabricColor` | `"#665441"` | Base colour of the cloth |
| `threadColor` | `"#efe4cc"` | Satin-stitch rims around the eyelets |
| `sunX` / `sunY` | `0.72` / `0.2` | Sun position as stage fractions. This moves the sun in the window, the glow on the cloth and the light beam. |
| `tearResistance` | `1` | Multiplier on how far a thread stretches before it snaps |
| `wind` | `0.6` | Breeze strength. `0` hangs still. |
| `backdropSrc` | painted window | Image URL for the view behind the curtain. It's cover-fitted and slightly defocused. Must be CORS-readable when cross-origin. |
| `caption` | `"Drag the curtain…"` | Hint pill. `""` hides it. |
| `onTornDown` | — | Fires once, when the cloth is off the rod |
| `height` | `"100svh"` | Root height. Use a definite length, never a percentage. |
| `className` | `""` | Extra root class names |

## How it works

1. **Verlet cloth.** The cloth is a grid of up to 84 × 60 particles in stage pixels.
   The top row is pinned to the rod. Irregular pleats are set into the rest lengths so
   they hold. The solver runs at a fixed 90 Hz with 6 constraint passes.
2. **Tearing.** A thread snaps once it passes 2.3 × its rest length (× `tearResistance`).
   Only one side of a snapped thread goes, so tears open as rips with hanging flaps
   rather than as punched holes. The patch in your hand holds together, so the cloth
   gives somewhere else. The three rows under the rod are hemmed twice as tough, so one
   yank doesn't unzip the whole curtain. Your hand follows the pointer at a capped speed,
   so a dropped frame can't teleport cloth across the stage.
3. **Light.** The shader discards the eyelet pixels, so the window really shows through.
   The cotton is lit mostly by light passing through it: brightest near the sun, along a
   vertical beam, and where the cloth faces you. Narrow pressed-in creases with a lit lip
   break up the folds, and a blurred perforation mask makes each eyelet glow. A light
   veiling glare and grain finish it.
4. **Window and bloom.** The window is a plane inside the scene. Its highlights are
   pushed past 1.0 and an UnrealBloom pass flares them through the eyelets and the tears,
   like the camera glare on real footage.
5. **Pointer.** Pressing grabs the particles under the pointer, and dragging holds them.
   The brush-past billow only runs under `(hover: hover) and (pointer: fine)`.
6. **Accessibility.** The **Pull it down** button rips the curtain off the rod loop by
   loop. Once it's torn, the button changes to **Hang it again**. Under
   `prefers-reduced-motion` the breeze and the hover billow are off, and the button drops
   the curtain all at once.

Rendering pauses while the component is offscreen. Without WebGL it falls back to a
still of the cloth over the painted window.
