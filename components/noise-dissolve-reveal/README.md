# Noise Dissolve Reveal

A sheet of colour covering your content, which dissolves along a fractal-noise
threshold. Holes nucleate, spread into ragged islands, and merge until the page
underneath is bare. The edges are fibrous rather than clean, so it reads as
paper tearing or ink bleeding, not as a wipe or a fade.

```tsx
import NoiseDissolveReveal from "@/components/ui/noise-dissolve-reveal"

// Page gate: tears away once, revealing the content beneath
<NoiseDissolveReveal onReveal={() => console.log("open")}>
  <YourHero />
</NoiseDissolveReveal>

// Ambient showcase: tears open, holds, seals back, repeats
<NoiseDissolveReveal loop veilColor="#000000">
  <YourHero />
</NoiseDissolveReveal>
```

**No dependencies, and no network requests.** The noise is generated in a
single inline WebGL2 fragment shader — there is no texture to download and no
image to ship.

## Props

| Prop | Default | Description |
|---|---|---|
| `children` | — | Content under the veil, revealed as it tears |
| `veilColor` | `"#000000"` | The sheet that tears. Any `#rgb` or `#rrggbb`. |
| `durationMs` | `1100` | How long the tear itself takes |
| `delayMs` | `600` | Hold before the tear begins |
| `loop` | `false` | Tear open, hold, seal back, repeat. For showcases. |
| `holdMs` | `900` | Hold at each end of a loop cycle |
| `noiseScale` | `7.0` | Island size. Higher means smaller and more numerous. ~1.5 to 12. |
| `softness` | `0.015` | Edge feather. `0.01` is a hard paper tear, `0.2` an ink bleed. |
| `centerBias` | `0.16` | How much earlier the middle opens than the corners. `0` tears everywhere at once. |
| `height` | `"100svh"` | Root height — a definite length, never a percentage |
| `onReveal` | — | Fired once, when the veil has finished tearing |
| `className` | `""` | Extra root class names |

## How it works

1. **A static noise field, a moving threshold.** The veil is a full-screen quad.
   Each pixel evaluates five octaves of value-noise fBm; the fragment stays
   opaque while its noise value sits above a threshold, and turns transparent
   once the threshold passes it. Sweeping that one threshold from below zero to
   above one takes the veil from solid to gone.

2. **Why it looks torn.** Raw fBm clusters around 0.5, so a sweeping threshold
   passes through most of the image at once and reads as fog lifting. The noise
   is stretched apart around its midpoint first (`smoothstep(0.28, 0.72, n)`),
   which separates the field into distinct basins — so the cut yields defined
   islands with fibrous edges instead of a soft haze. The high octaves are what
   make those edges ragged.

3. **Nucleation from the middle.** The threshold is offset by distance from
   centre, so the middle crosses it first and the corners last. Both ends still
   land inside the sweep, so the veil is fully solid at 0 and fully gone at 1
   regardless of `centerBias`.

4. **Easing.** `tearEase` is slow while the first holes open and fast once they
   start merging, which is what makes the tear feel like it gives way rather
   than dissolving at a constant rate.

5. **Looping.** One cycle is open → hold → seal → hold. Sealing replays the
   tear backwards, so ink appears to flow back across the frame. The test
   asserts the cycle wraps without a jump.

## Install safety

- Explicit `height`, never `h-full`, which collapses to `0px` in a page with no
  `html, body { height: 100% }` chain.
- Every rule in the scoped `<style>` block is `.ndr-` prefixed.
- The `canvas` resets `max-width` and `height`, which Tailwind Preflight would
  otherwise set to `100%` / `auto` and collapse inside the absolute parent.
- **Without WebGL2 the veil still covers the content.** A plain CSS veil renders
  until the shader is confirmed live, so an unsupported browser sees the veil
  and then a fade, never a flash of the page it was meant to hide.
- `prefers-reduced-motion: reduce` skips the tear and uncovers the content.
- Nothing is fetched. The component and its demo contain zero URLs, which the
  test enforces.

## Notes

The veil is a single flat colour, because the shader controls its alpha per
pixel and cannot mask arbitrary DOM. If you want a logo on the veil that tears
with it, render it into the veil colour layer as a second pass — or put it in
`children` and let it be revealed instead.
