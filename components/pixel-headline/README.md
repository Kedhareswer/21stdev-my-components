# Pixel Headline

A headline set in a pixel face drawn in code: every pixel is an SVG square. When it comes into view the pixels fly in from everywhere and assemble the words. They step aside from the pointer and spring back, and now and then a few catch the accent colour. A real text copy sits underneath for screen readers.

**Requires `gsap`.** No font file is loaded.

```tsx
import PixelHeadline from "@/components/ui/pixel-headline"

<PixelHeadline lines={["Describe an app", "We'll build it"]} />
```

## Props

| Prop | Default | What it does |
|---|---|---|
| `lines` | `["Describe an app", "We'll build it"]` | One entry per line. Lines share one pixel size and shrink together to fit. |
| `as` | `"h1"` | `h1`, `h2`, `h3` or `p`. |
| `pixelSize` | fluid | Size of one pixel, any CSS length. |
| `color` | `"#ffffff"` | Pixel colour. |
| `accent` | `"#a9dcff"` | Colour the shimmering pixels catch. |
| `assemble` | `"view"` | `load`, `view` (first time it scrolls in) or `none`. |
| `repel` | `true` | Pixels step aside from a mouse pointer. |
| `shimmer` | `true` | A few pixels catch the accent now and then. |
| `align` | `"center"` | `center` or `left`. |
| `className` | | On the root. |

## The pixel face

Capitals, lowercase with descenders, digits and `. , ' ! ? - : / & $ + %`. A character without a glyph falls back to its capital, then to a space. Each glyph is a few rows of `.` and `#` in the `GLYPHS` table; add your own the same way.

Reduced motion skips the assembly, the repel and the shimmer.

Part of the Mosaic kit. The full page is `mosaic-prompt-template`.
