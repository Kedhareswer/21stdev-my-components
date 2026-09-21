# Elastic Editorial About

A brutalist, dark-mode studio About page component featuring giant vertical masked typography, staggered entrance choreography, and an interactive WebGL2 background with elastic parabolic curvature responding to scroll inertia.

```tsx
import ElasticEditorialAbout from "@/components/ui/elastic-editorial-about"

export default function AboutPage() {
  return (
    <ElasticEditorialAbout
      tagline="Architecting tactile digital systems through spatial computation and physical animation."
      enableWarpShader={true}
      height="100svh"
    />
  )
}
```

**Zero external dependencies beyond React.** Vector typography is inlined directly, and the background warp physics is powered by a zero-dependency raw WebGL2 quad shader with procedural gradient fallback.

## Props

| Prop | Default | Description |
|---|---|---|
| `titleWords` | `["ABOUT", "STUDIO", "KINESIS"]` | Brand title words displayed in the giant vertical SVG stack. |
| `tagline` | Manifesto string | Studio tagline beneath the titles. |
| `statementJp` | Japanese statement | Studio manifesto in Japanese with optical character kerning. |
| `statementEn` | English statement | Studio manifesto in English. |
| `crews` | 4 team members | Array of team members with `position` and `name`. |
| `awards` | 14 honors | Array of design awards and recognition strings. |
| `profile` | Studio metadata | Studio metadata: `name`, `directors`, `established`, `locations`, `email`, `capital`. |
| `backgroundImageSrc` | — | Optional custom background image sampled by the shader (falls back to procedural plate). |
| `enableWarpShader` | `true` | Enables real-time parabolic curvature responding to scroll velocity and inertia. |
| `height` | `"100svh"` | Root container height (definite length, never `h-full`). |
| `className` | `""` | Extra CSS class names for the root container. |

## How It Works

1. **Masked Vertical SVG Wordmarks**:
   The left column features three stacked vector wordmarks. Each wordmark is enclosed in an `overflow: hidden` mask and slides upward into place (`translateY(140%)` → `translateY(0)` over `2.0s` via `cubic-bezier(0.215, 0.610, 0.355, 1.000)`).

2. **Parabolic Elastic Scroll Warp (WebGL2)**:
   The background quad evaluates `u_delta * pow(abs(uv.x - 0.5), 2.0)` in its fragment shader. As the user scrolls, velocity feeds into `u_delta`, curving the backdrop like flexible film before smoothly dampening back to rest via a `0.85` friction decay.

3. **Staggered Scale-In Typography**:
   Editorial sections on the right enter with staggered cubic keyframes:
   - `eea-scale-color`: elements translate upward from 100px while scaling down from `1.2x` and shifting from black to white.
   - `eea-scale-color-g`: position subheadings scale from black to `#888888`.
   - `eea-scale-opacity`: awards grid scales in while fading from `opacity: 0` to `1`.

4. **Install Safety**:
   - Definite default height (`100svh`) prevents 0px container collapse inside installer layouts.
   - CSS rules strictly scoped under `.eea-*` without bare `*`, `body`, or `:root` selectors.
   - Fully honours `prefers-reduced-motion: reduce`.
