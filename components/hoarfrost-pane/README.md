# Hoarfrost Pane

A full-bleed background: a winter window at blue hour that frosts over as the
page loads. The ice is a real phase-field crystal growth model (Kobayashi) on
the GPU: six-fold dendrites nucleate on specks along the cold frame, branch,
and stall where the glass is warmer, so the middle stays clear for content.
The ice is drawn as clear plates on the glass that bend the out-of-focus street
lights behind them.

Run a finger or the cursor across the glass to wipe a wet, clear trail. As the
glass dries, the frost creeps back in from the trail's edges along the paths it
first grew.

```tsx
import HoarfrostPane from "@/components/ui/hoarfrost-pane"

<HoarfrostPane>
  <h1>First frost</h1>
</HoarfrostPane>
```

## Props

| Prop | Default | |
|---|---|---|
| `coverage` | `0.6` | how far the frost reaches in from the frame, 0–1 |
| `brush` | `46` | radius of the wiping fingertip, CSS px |
| `interactive` | `true` | the pointer wipes the frost |
| `seed` | `11` | reshuffles the crystals and the street |
| `height` | `"100svh"` | a definite length |
| `children` | — | content laid over the glass; links and buttons stay clickable |

## Notes

- React only, WebGL2 with float render targets (`EXT_color_buffer_float`), no
  textures or network. Without them it shows a CSS frosted vignette instead.
- The frost grows once, then holds still; the sim only runs while a wipe is
  healing, and sleeps off-screen.
- With reduced motion the frost is fully grown before the first paint and there
  is no fade-in. Wiping still works.
- Resizing regrows the frost from scratch.
