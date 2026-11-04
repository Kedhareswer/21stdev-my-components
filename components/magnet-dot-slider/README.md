# Magnet Dot Slider

A dark-panel slider made of a row of dots in a recessed groove. The thumb is a glowing pit, a dark lens with a hot rim, and the dots nearest it are pulled toward it and swell as if drawn in by a magnet. Every dot it has passed is lit along a warm gradient. The pit follows the pointer on a spring, so a quick drag makes it lag and squash slightly while the field around it widens and pulls harder, then it settles exactly on the snapped value. A bubble above the pit shows the value while dragging or focused, and the readout above the track is tinted to match.

Under `prefers-reduced-motion` the pit jumps straight to the value with no spring.

```tsx
import MagnetDotSlider from "@/components/ui/magnet-dot-slider"

<MagnetDotSlider label="Intensity" value={lux} onChange={setLux} />
<MagnetDotSlider label="Colour temperature" min={2700} max={6500} step={100} suffix="K" from="#ffb347" to="#cfe3ff" />
```

## Props

| Prop | Default | |
|---|---|---|
| `label` | `"Intensity"` | Visible label; also names the slider. |
| `value` | none | Controlled value. |
| `defaultValue` | `42` | Initial value when uncontrolled. |
| `min` / `max` / `step` | `0` / `100` / `1` | Range and snapping. Decimal steps show matching decimals. |
| `onChange` | none | `(value) => void`, called as the snapped value changes. |
| `suffix` | `"%"` | Appended to the readout. |
| `dots` | `41` | Dots along the track. |
| `from` / `to` | gold / ember | Lit-dot gradient and accents (`#rrggbb`). |
| `font` | system sans stack | CSS `font-family`. |

It's a `role="slider"` with arrows, Page Up/Down, Home and End. The spring runs in a `requestAnimationFrame` loop only while the pit is moving and stops when it settles. The loop reads only stored numbers (the row width from a `ResizeObserver`, the track edge measured once per press) and writes transforms. No dependencies beyond React.
