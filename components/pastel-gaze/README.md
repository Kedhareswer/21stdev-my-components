# Pastel Gaze

A full-bleed, textured pastel portrait inspired by the supplied reference: starry hazel eyes, a pink butterfly, wildflowers and a crimson mushroom on black paper. The embedded illustration is an AI-generated recreation, not the original reference image.

Move the pointer to catch the eye highlights and gently shift the artwork. The eyes gently close and reopen every 4.2–6.8 seconds while visible. Click, tap, Enter or Space triggers a blink and scatters stars. An embedded matching closed-eye frame and animated SVG eye apertures preserve the pastel texture; only the eye areas change. Reduced motion keeps the eyes open and disables movement and particles, retaining the activation feedback. No dependencies beyond React, remote assets, fonts or global styles.

```tsx
import PastelGaze from "@/components/ui/pastel-gaze"

<PastelGaze />
<PastelGaze accent="#ffd898" height="70svh" onActivate={() => console.log("Magic")} />
```

| Prop | Default | Purpose |
| --- | --- | --- |
| `src` | Embedded WebP | Custom artwork URL or data URI. The glints are aligned to the default portrait. |
| `closedSrc` | Embedded closed-eye frame for the default artwork | Matching closed-eye artwork. Custom portraits must supply this to enable blinking; eye regions use the default portrait positions. |
| `blink` | `true` | Enable natural and activation-triggered blinks. |
| `alt` | Portrait description | Describe custom artwork here. |
| `accent` | `#f8c9df` | Particle and keyboard focus color. |
| `height` | `auto` | Uses a 16:9 aspect ratio; set a definite CSS length for a cropped scene. |
| `interactive` | `true` | Disable blinking, pointer and activation effects for a static illustration. |
| `onActivate` | — | Called on click, tap or keyboard activation. |
| `className` | Empty | Additional root class. |

The default asset is embedded so the single component travels with 21st installs. Custom images use `object-fit: cover`. Failed images show a retry action. The demo has no fixed-height parent dependency and works in either host theme.
