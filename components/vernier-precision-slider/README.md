# Vernier Precision Slider

A ceramic, instrument-style slider for values that need decimals. The track is a ruler of fine ticks with taller majors. A frosted glass cursor with a hairline index rides on it, and the ticks under it swell like they're seen through a lens. Ticks you've passed turn dark. The readout is a real odometer: every digit rolls continuously, and a higher digit only turns as the one below it passes 9, so 93.5 to 91.0 visibly winds back.

For precision, drag away from the ruler while holding. Past about 36 px the drag slows to a quarter, and past 90 px to a tenth, and a FINE ×0.25 / ×0.1 badge says so. The cursor and readout follow on a light spring.

Under `prefers-reduced-motion` the cursor and digits jump straight to the value.

```tsx
import VernierPrecisionSlider from "@/components/ui/vernier-precision-slider"

<VernierPrecisionSlider label="Water temperature" min={80} max={100} value={t} onChange={setT} unit="°C" />
<VernierPrecisionSlider label="Dose" min={10} max={25} decimals={1} unit="g" accent="#2f6b4f" hint="" />
```

## Props

| Prop | Default | |
|---|---|---|
| `label` | `"Temperature"` | Visible label; also names the slider. |
| `value` | none | Controlled value. |
| `defaultValue` | `21.4` | Initial value when uncontrolled. |
| `min` / `max` | `0` / `40` | Range. Non-negative. |
| `decimals` | `1` | Places kept and shown (0–3). Arrows step by one unit in the last place. |
| `onChange` | none | `(value) => void`, already rounded to `decimals`. |
| `unit` | `"°C"` | Shown after the readout. |
| `ticks` | `81` | Ticks along the ruler. |
| `hint` | fine-control tip | Line under the ruler. `""` hides it. |
| `accent` | vermilion | Index line, focus ring and FINE badge. |
| `font` | system sans stack | CSS `font-family`. |

It's a `role="slider"`: arrows step by the smallest unit, Shift + arrows by ten, Page Up/Down by a tenth of the range, Home and End jump to the ends. The track takes `touch-action: none` so the vertical fine-drag works on touch; the page still scrolls from anywhere else. The spring runs in `requestAnimationFrame` only while moving and reads only stored numbers (the ruler width from a `ResizeObserver`, the track edge measured once per press). No dependencies beyond React.
