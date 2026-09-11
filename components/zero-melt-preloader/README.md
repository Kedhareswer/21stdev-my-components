# Zero Melt Preloader

A page gate with no enter button. A sheet of ice wipes down over the surface while a counter runs to zero, then you **melt your way in by tracing a circle**. Get the shape right and the screen blows out to white, pays you, and lifts.

Inspired by the entry gate on [Why Zero](https://www.awwwards.com/inspiration/page-unlock-why-zero) (Sindhur Dutta).

```tsx
<ZeroMeltPreloader onUnlock={() => console.log("in")}>
  <YourPage />
</ZeroMeltPreloader>
```

**No dependencies.** Raw WebGL2 — two fullscreen passes. Three.js would be ~600KB for a job that needs no scene graph, no camera and no geometry, and every package a 21st component imports is one the installer has to already have.

## Props

| Prop | Default | |
|---|---|---|
| `children` | — | Content revealed on unlock |
| `prompt` | `"Draw a zero"` | Headline on the gate |
| `hint` | `"Trace a full circle to melt your way in"` | Sub-line |
| `wordmark` | `"zero"` | Big mark in the bottom-left once the ice lands |
| `retryHint` | `"Not quite — one closed circle"` | Sub-line after a rejected stroke |
| `tolerance` | `0.6` | 0–1. Higher demands a rounder, better-closed circle |
| `brush` | `0.075` | Melt radius, as a fraction of surface height |
| `loadMs` | `1800` | Time for the sheet to wipe in while the counter runs down |
| `reward` | `"+100 XP"` | Held on the white after the blowout. `""` skips the beat |
| `baseColor` | `#1d6b52` | Deep water behind the ice |
| `frostColor` | `#9fd8c0` | The frozen sheet |
| `meltColor` | `#48c257` | What melting reveals |
| `glowColor` | `#eafff4` | Rim light at the melt front |
| `onUnlock` | — | Fires when the gate finishes lifting |
| `className` | `""` | Extra classes on the root |

## How it works

**Recognition.** `scoreZero(points, tolerance)` is exported and pure. It scores a stroke against its own centroid on three axes: **roundness** (50%, how little the radius varies), **sweep** (30%, signed angle swept — 1.0 is a full turn), **closure** (20%, how close the end lands to the start). A stroke unlocks when `score ≥ tolerance` **and** it swept ≥75% of a turn **and** its mean radius is ≥28px. The sweep gate is what rejects arcs, lines and scribbles that score well on roundness alone. Hand-drawn ovals pass — a real zero is never a circle.

Run the check: `node tests/score-zero.test.mjs` from the repo root.

**Rendering.** A half-resolution texture is ping-ponged each frame holding one value per texel: how melted it is. Pointer movement stamps a capsule between last frame's position and this one, at a radius that scales with pointer speed — dwell melts wide, flick melts thin. The display pass builds the ice procedurally, then uses that heat, warped by three noise octaves, to decide ice, melt, or the bright rim between them.

**The melt is a real hole.** The context is `alpha: true, premultipliedAlpha: false`, `children` render behind the canvas, and the shader outputs alpha rather than painting a "melted" colour. Whatever you wrap is what shows through.

Five things worth knowing if you edit the shaders:

- **GLSL `smoothstep` is undefined when `edge0 > edge1`.** It does not reverse the ramp; on ANGLE it returns NaN and the whole canvas goes black. Every ramp here runs low-to-high and is inverted with `1.0 - smoothstep(...)` where it needs to fall off.
- **The melt warp's frequency matters more than its amplitude.** The low octave has to sit near the brush width. Wider, and it slides the entire boundary instead of lobing it.
- **Cracks need a basis that can make lines.** Value-noise fbm only makes blobs. Ridged noise works because the fold in `abs()` *is* a line; Voronoi `F2 - F1` gives the plate boundaries. Both are then masked by a low-frequency field so fracture appears in patches — an even net at full strength reads as cellular skin, not ice.
- **The rim comes from the raw field, gated by heat.** Derived from the thresholded hole it is a 3px outline; taken from the raw field it is the soft cloud that sells melting — but that field is zero-mean away from the stroke, so without the `touched` gate the rim lights up wherever the warp noise peaks.
- **The opening is not a bigger hole.** `uOpen` raises alpha and whitens: light pours *out* of the ring. Lowering alpha instead shows the page through the expanding front, which is backwards.

## Motion

- Sheet wipes in top-down with a noise-frayed front while the counter runs 99→0.
- Rejection refreezes: the heat buffer decays at 0.93/frame and the ice heals over the failed stroke while the prompt shakes (320ms, `cubic-bezier(0.23, 1, 0.32, 1)`).
- Unlock is three beats, not one: the hole grows out of the drawn ring and floods with warm light (620ms, ease-out), *then* 260ms to white, **then** a hold for the reward before the lift. The hold is the point — fading the white and the reward together means nobody ever sees the payoff.
- `prefers-reduced-motion: reduce` drops the shake, the pop and the spark, and collapses the transitions.

See [docs/reference-comparison](../../docs/reference-comparison/) for a frame-by-frame diff against the reference, and what is deliberately not matched.

## Notes

- Self-contained: one file, Tailwind utilities plus one scoped `<style>` block, shaders inline. No `@import`, no global resets.
- Falls back to a plain SVG stroke on the base colour if WebGL2 is unavailable — the gate always stays passable.
- `touch-action: none` plus pointer capture, so a drag never turns into a scroll or escapes the surface.
- Keyboard and screen-reader users get a visually-hidden **Skip and enter** button that appears on focus. A gesture-only gate is not accessible; don't remove it.
- GL resources are deleted on unmount, and the buffers survive a StrictMode remount — see the `buffers.length` guard in `resize`.
- Fills its parent — give the wrapper a height.
