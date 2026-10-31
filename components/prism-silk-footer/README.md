# Prism Silk Footer

An airy site footer above a bolt of iridescent silk. Five folds of fabric rise
back to front, each one a soft swell of shifting colour with threads of light
running along it. The far folds fade into a pale haze, and everything sits under
a coarse, living film grain. Above the silk: the brand, a tagline, social chips,
four link columns, a hairline, and the copyright and credit row.

## Storyboard

1. **Paper.** Until the footer is on screen it is only paper and grain, so a
   footer that is never reached costs almost nothing.
2. **Develop.** Once a fifth of it is in view, the grain flares like film in the
   developer. The folds climb out of the bottom edge back to front, each one
   overshooting and settling like cloth thrown over a line. They come up silver
   first, and the colour blooms into them as they settle.
3. **Type.** At the same time the mark opens slat by slat, and the name rises
   letter by letter out of a blur. The tagline and social chips follow. Each
   column's heading and then its links cascade in.
4. **Close.** The hairline draws from left to right and a prism glint runs along
   it. Then the copyright, the credit and the back-to-top button settle in.
5. **Live.** The silk keeps breathing:
   - Move over it and the crests rise toward the pointer, like fabric lifted on
     a fingertip. Moving across the footer also shifts the hue, as if you were
     tilting foil.
   - Click the silk and a ripple runs out through every fold.
   - Hover or tab into a column and the whole bolt turns to that column's
     colour.
   - Links roll over into a prism gradient, and social chips lift with an
     iridescent edge and a tooltip.
   - Hover the mark and its slats slide apart and take on the silk's colours.
   - The heart beats on hover and throws a few hearts when pressed. The arrow
     scrolls back to the top.

The reveal plays once. It does not replay on resize or theme change.

**No dependencies.** React is the only import. One WebGL2 fragment shader for
the silk (a CSS gradient stands in without WebGL2), real anchors for every link,
a scoped `<style>`, and nothing fetched.

```tsx
import PrismSilkFooter from "@/components/ui/prism-silk-footer"

<PrismSilkFooter />

<PrismSilkFooter
  preset="nocturne"
  seed={11}
  name="Afterglow"
  tagline="Night-shift tooling for teams who ship while the city sleeps."
  columns={[
    { title: "Product", links: [{ label: "Overview", href: "/overview" }, { label: "Agents", badge: "Beta" }] },
    { title: "Company", links: [{ label: "Careers", badge: "Hiring" }, { label: "Contact", href: "mailto:hi@afterglow.dev" }] },
  ]}
  socials={[{ icon: "x", href: "https://x.com/…" }, { icon: "github", href: "https://github.com/…" }]}
  credit={{ label: "Makora Studio", href: "https://…" }}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `name` / `brandHref` | `"Lumenfold Labs"` / `"#"` | Brand beside the mark. |
| `logo` | prism-fold mark | Any node to replace the built-in mark. |
| `tagline` | "Join thousands of companies…" | `""` hides it. |
| `columns` | Product · Company · Resources · Legal | `{ title, links: { label, href?, badge? }[] }[]` |
| `socials` | X · Instagram · LinkedIn · YouTube | `{ icon: "x" \| "instagram" \| "linkedin" \| "youtube" \| "github" \| "dribbble", href?, label? }[]` |
| `copyright` | `© <year> <name>, Inc. All rights reserved.` | |
| `credit` | `{ label: "Makora Studio", href: "#" }` | "Made with ♥ by …". `null` hides it. |
| `backToTop` | `true` | The round arrow button at the end of the bottom row. |
| `preset` | `"auto"` | `auto` (prism, or nocturne under `.dark`) · `prism` · `opal` · `ember` · `nocturne` |
| `palette` | — | `{ paperTop, paperLow, glow, ink, muted, line, chip, heart, silk, dark }` overrides. `silk` is five hex colours cycled around the folds; shorter lists repeat. The shader reads `paperTop`, `paperLow`, `glow` and `silk`, so use hex for those. |
| `seed` | `3` | Which bolt of silk to weave. |
| `speed` | `1` | How fast the silk breathes. `0` holds it still. |
| `grain` | `0.8` | Film grain strength, 0–1.5. |
| `grainSize` | `2` | One grain speck in CSS px. |
| `interactive` | `true` | Pointer lift, foil tilt, click ripples and column tints. |
| `maxDpr` | `1.5` | Highest device-pixel ratio the silk renders at. |
| `maxWidth` | `"1180px"` | Widest the content gets. |
| `fontFamily` | Inter → system | The face comes from the host page. |
| `height` | `"760px"` | A definite length. The footer grows past it when its content needs more room. |
| `stageMinHeight` | `"300px"` | The least height the silk itself gets, e.g. on phones. |

## Notes

- **Layout** responds to the footer's own width, not the window (container
  queries). Under 980px the brand sits above the columns. Under 640px the
  columns go two by two and the bottom row stacks.
- **Performance.** One full-screen triangle and one cheap fragment shader: five
  analytic folds, no textures, no feedback buffers. It renders at up to 1.5×
  device pixels and sleeps when off-screen or when the tab is hidden.
- **Accessibility.** The canvas and the silk stage are hidden from screen
  readers. Links are real, focusable anchors with a visible focus ring. The
  social chips, the heart and the back-to-top button all carry names. The
  columns sit in one `<nav aria-label="Footer">`, each list labelled by its
  heading. Keyboard focus tints the silk the same way hover does.
- **Reduced motion.** Everything appears at once and the silk is a still frame
  with still grain. There are no ripples, lift, sparks or glints. Column tints
  and the foil tilt still apply, since they only change when you act.
