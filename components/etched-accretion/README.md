# Etched Accretion

A black hole drawn like an engraving. A tilted accretion disk made of
hair-thin orbital streaks banded in crimson, a photon crown flaring off the
horizon, dark nebula banks cut from contour lines, and heavy film grain over all
of it. It animates, and it's meant to sit behind a hero.

**No dependencies.** It uses one full-screen WebGL2 fragment shader, and React
is the only import. There's no three.js, no textures and no network assets:
every streak, cloud and star is generated procedurally, so it stays sharp at any
size.

## Usage

```tsx
import EtchedAccretion from "@/components/ui/etched-accretion"

<EtchedAccretion />                                    // full-bleed, crimson
<EtchedAccretion preset="glacier" height="640px" />    // inside a section
<EtchedAccretion params={{ grain: 1.6, angle: -8, center: [0.62, 0.5] }} />

// As a background: children are laid over the canvas.
<EtchedAccretion>
  <h1 className="text-6xl text-white">Nothing escapes.</h1>
</EtchedAccretion>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | **Must be a definite length.** The canvas fills this box. |
| `preset` | `"crimson"` | Options: `crimson`, `ember`, `glacier`, `ash`, `orchid`. |
| `params` | none | A `Partial<AccretionParams>` layered over the preset. |
| `interactive` | `true` | Pointer parallax, plus hold-to-feed. |
| `renderScale` | `1` | Multiplies the drawing buffer, on top of a DPR capped at 1.5. |
| `children` | none | Overlay content, positioned `absolute inset-0` above the canvas. |
| `className` | `""` | Appended to the root. |

### Parameters

| Group | Keys |
|---|---|
| Palette (hex) | `diskColor`, `streakColor`, `glowColor`, `cloudColor`, `background` |
| Geometry | `center` `[x, y]` as fractions of the box, `holeSize`, `angle` (clockwise degrees), `inclination`, `diskRadius` |
| Motion | `speed`, `shear` (how much faster the inner disk orbits) |
| Texture | `streakDensity`, `crimson` (band share), `doppler`, `flare`, `lensing`, `clouds`, `cloudLines`, `stars`, `grain`, `vignette`, `exposure` |

`ACCRETION_DEFAULTS` and `ACCRETION_PRESETS` are exported. A preset is just a
partial overlay, so `{ ...ACCRETION_PRESETS.ember, grain: 2 }` works as a
`params` value. Every number is clamped to the range the shader is tuned for,
and an unparseable colour becomes black instead of NaN.

## Interaction

- **Move** to shift the layers in parallax. The foreground nebula moves most,
  the disk tilts slightly and the stars barely move. After a few idle seconds a
  slow drift takes over, so the scene doesn't settle into a fixed frame.
- **Hold** to feed the singularity. The orbit speeds up, the crown flares and
  the horizon swells, then everything eases back when you let go. A press on a
  link, button or input inside `children` doesn't count.
- **`prefers-reduced-motion`** draws one still frame and nothing more.

## How it's drawn

- **Disk.** Each pixel is projected back onto the tilted disk plane. Streaks are
  anti-aliased lines at constant radius, warped by noise sampled on
  `(cos θ, sin θ, r)` so there's no seam, and broken into dashes. The disk
  rotates differentially (Keplerian, inner faster). Where lines get closer than
  a pixel, they blend to their average brightness instead of shimmering into
  moiré. The far half of the disk passes behind the horizon and the near half
  crosses in front of it.
- **Nebula.** The density field is domain-warped fbm. The engraving comes from
  its iso-contours, and the silhouettes are lit from the horizon along the
  density gradient. The upper bank sits behind the disk and the lower bank in
  front of it.
- **Lensing.** Stars and the far nebula are sampled through a point-mass lens,
  so they bend into an Einstein ring near the horizon.
- **Film.** Two scales of grain, re-rolled at 24 fps (not every frame), plus
  occasional dust flecks.

## Notes

- Needs WebGL2. Without it, the component paints a still gradient of the same
  composition instead of a black box.
- The canvas measures **its own box**, not the window, and it stops drawing when
  scrolled off screen.
- The shader does a lot of work per pixel. If frames run long in the first few
  seconds, the buffer scale drops (down to about half) and stays there.
- A lost GPU context is rebuilt, and every GL object is released on unmount.
