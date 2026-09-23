# Glass Headline Hero

A hero section whose headline is thick refractive glass. A slow colour field
flows behind it and bends through the letters, with prism fringes at the
edges. The light follows the pointer, so the bevels catch sliding highlights
and cast a short contact shadow. When nobody is pointing, the light drifts on
its own.

```tsx
import GlassHeadlineHero from "@/components/ui/glass-headline-hero"

<GlassHeadlineHero
  eyebrow="Lumen 2.0 is here"
  title="Bend the light"
  description="Interfaces that feel crafted, not assembled."
  primaryAction={{ label: "Start for free", href: "/signup" }}
  secondaryAction={{ label: "Watch the film", onClick: openFilm }}
/>
```

**No dependencies beyond React.** Raw WebGL2, one file, no CSS file, no Tailwind.

## Props

| Prop | Default | Notes |
|---|---|---|
| `title` | — | Required. Becomes the glass, and stays a real `<h1>`. |
| `eyebrow` | — | Small pill above the headline. |
| `description` | — | Body copy under it. |
| `primaryAction` / `secondaryAction` | — | `{ label, href?, onClick? }`: a link with `href`, otherwise a button. |
| `colors` | `["#0D0A14", "#FF5A1F", "#FF9EC1", "#2F4CFF", "#FFE6B8"]` | Five `#rrggbb` colours: the ground, then four accents. Bad or missing entries fall back per slot. |
| `height` | `"100svh"` | **Must be a definite length.** |
| `className` | `""` | Appended to the root. |

## The headline is real text

Search engines, screen readers and text selection all see an ordinary `<h1>`.
Each word is its own `<span>`, laid out by the browser in the host's own font,
at a size that grows with the hero (`13cqw + 1.5rem`) and wraps where the
browser decides. The shader draws the glass exactly where each word landed,
and only then does the `<h1>` turn transparent. A red overlay test confirmed
the glass sits exactly on the DOM text on desktop, and across two wrapped
lines on a phone.

Because the glass is measured from where the headline sits, **the headline is
never animated**. Its entrance is the glass **forming**: over 1.1s the letters
condense from clear to full glass, while the solid type shown before the
scripts load melts into them instead of vanishing in one frame. The eyebrow,
copy and buttons rise in behind. A web font that arrives late, or a resize
that rewraps the headline, re-measures it, but only when the layout actually
changed.

## How the glass is made

1. The words are drawn white on black into a mask, at each span's position.
2. Four GPU blur passes turn the mask into a height field: a rounded bevel, steep at the edge, plus a gentle dome across each face, blurred from the already-smooth bevel.
3. The final pass bends the flowing field through that shape. Red, green and blue each bend a slightly different amount, which is the prism fringe. On top go a rim lit like a studio light from above, a pin highlight and a soft sheen from the pointer's light, a caustic line where light gathers on the far inner edge, and a thin dark lip where glass meets air. Normals come from an eight-sample Sobel stencil.
4. Behind the letters, a short contact shadow falls away from the light.

## Things it took

| Before | After | Why |
|---|---|---|
| Shadow and caustic sampled 28–54px away | A 12px contact shadow, no caustic | The offset copies read as a second, ghostly headline |
| Field mostly the near-black ground | Colour thresholds inside noise's real 0.25–0.8 range | Glass over near-black looked like smoky rubber |
| Rim lit only by the pointer | A rim that doesn't depend on the light | Letters far from the pointer went dark-on-dark |
| Faint seams counted as glass | Anti-alias debris under 8% ignored | Tight tracking overlaps glyphs, and the canvas leaves faint seams that tinted each glyph's box |
| `rgb(r,g,b)` + `"66"` fallback colours | `rgba()` from a tested function | The invalid colour dropped the whole background: a white flash before the glass, and white type on white without WebGL |
| Kept drawing off-screen while the light glided | Nothing drawn off-screen or in a hidden tab | Measured: 290 draws/s with the hero scrolled away, now 0 |
| Flat glass faces | A gentle dome across every face | A stem is a rectangle, and a flat face of one tint read as a box behind each letter |
| Dome blurred straight from the mask | Dome blurred from the already-smooth bevel | Its taps sit ~3px apart; sampling a sharp edge that coarsely aliased into a fine grid across every letter |
| Normals from a one-texel difference | An eight-sample Sobel stencil, two texels wide | A bilinear height map's slope jumps at texel edges, and the highlight turned the steps into dots |
| One broad highlight | A pin highlight plus a soft sheen, and a studio-lit rim | One lobe reads as plastic |
| Solid type vanished when the glass took over | It melts into the glass over 900ms | The headline blinked out while the glass was still clear |
| The mask built up to four times on load | Only when the layout changes | Each build is four blur passes; on a software renderer, repeated builds froze the page |

## Performance

- About 146fps on an Intel UHD integrated GPU. The field is smooth, so it's drawn at 0.4× and stretched.
- It only animates while it's on screen, the tab is visible and motion is welcome. Otherwise it draws nothing.
- A frame-time watchdog catches devices that can't keep up. Frames over 150ms count triple, so a software renderer trips it within a few frames. It then drops to a lighter path: 3 noise octaves instead of 5, the field at 0.25×, and the glass at 0.65× resolution. Measured in a software renderer: 2 → 12fps.

## Reduced motion

The field stops flowing and the light stops drifting. Moving the pointer still
moves the light, because that motion is the user's own, and it stops drawing
again once the light settles. The entrance fades instead of rising.

## Without WebGL2

The headline shows as solid white type over a CSS gradient built from the same
palette. That's also what's on screen for the moment before the glass fades
in, so there's no white flash.

## Install safety

- The root takes an explicit `height`, never a percentage.
- All styles live in one scoped `<style>` (`.ghr-*`).
- The shaders open with `#version 300 es` on the first line, and avoid GLSL ES 3.00 reserved words. The test checks both.
- The demo makes no network requests, so 21st can record its video.
