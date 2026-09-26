# Lycoris Specimen

A scroll-scrubbed type specimen built around one object: a red chrome spider
lily, modelled procedurally and lit in raw WebGL. Six frames, one continuous
camera move:

```
frame       flower                                  type
----------  --------------------------------------  -----------------------------------------
Cover       side view, huge, stem through the word  name + "Font", header, specs, colophon
Crown       straight down onto the umbel            cover word's first/last letters flank it
Specimen    small, high, stem trimmed               A–Z, a–z, accents, numerals, punctuation
Fancy       from below, low in the frame            FANCY / VINTAGE / SERIF stacked
Bloom       large, cropped off the right edge       editable tagline — type your own
Ligatures   flies to the top, seen from underneath  Affluent + ligature circle, multilingual
```

Scroll is the timeline. The camera's spin, elevation, size and screen position
are keyframed per frame and interpolated, so every transition is a morph of the
same object rather than a cut. The cover word morphs too: its first and last
letters slide out to flank the crown while the rest blur into the flower.

**No dependencies.** React is the only import. One WebGL1 canvas (2D-canvas
fallback), no CSS file, no animation library, no image assets — the flower is
~27k vertices generated from a seed at mount.

## Interaction

- **Scroll** scrubs every frame, both directions.
- **Drag** (mouse) spins the flower with inertia; the pointer tilts it slightly.
- **Hover a glyph** on the specimen frame to inspect it large with its code point.
- **Click the bloom tagline** or the multilingual line to type your own text.
- **Click "Affluent"** to toggle ligatures on and off.
- **Side index** (≥720px wide) jumps to any frame.

## Font

The display face is [Federant](https://fonts.google.com/specimen/Federant)
(OFL), an Art Nouveau uncial that is the closest free match to the reference
board's hooked capitals. It is loaded at runtime by injecting one `<link>` into
`<head>` — never an `@import` — and falls back to Uncial Antiqua / Cinzel
Decorative / Georgia. Pass your own `fontFamily` + `fontHref`, or
`fontHref={null}` to load nothing.

The font request is to an external origin, so `21st render` builds the
component but its capture sandbox will refuse it — supply your own
`--preview` cover.

## Usage

```tsx
import LycorisSpecimen from "@/components/ui/lycoris-specimen"

<LycorisSpecimen />

<LycorisSpecimen
  name="Hanabi"
  studio="Your Studio"
  year="2027"
  crimson="#ff2a3d"
  tagline={[{ text: "Burn" }, { text: "like", small: true }, { text: "fireworks" }, { text: "at night", small: true }]}
  fontFamily='"Cinzel Decorative", serif'
  fontHref="https://fonts.googleapis.com/css2?family=Cinzel+Decorative&display=swap"
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `name` | `"Lycoris"` | The cover word and every label. First and last letters flank the crown. |
| `studio` / `year` | `"Kedhareswer"` / `"2026"` | Credit, colophon, fan footer. |
| `description` | generated | Cover paragraph (hidden under 1020px). |
| `specs` | 5 lines | Cover spec list. |
| `tagline` | Bloom like flowers in the sun | `{ text, small? }[]`, one per line. |
| `multilingual` | `"Múl·tî·lĺn·güål"` | Middle dots render in crimson. |
| `ligatureWord` | `"Affluent"` | |
| `links` | 21st + GitHub | Two `{ label, href? }` for the last frame's bar. |
| `fontFamily` / `fontHref` | Federant | `fontHref={null}` injects nothing. |
| `ink` / `bone` / `crimson` | `#050505` / `#b6b095` / `#e3131b` | Ground, type, flower + accents. |
| `height` | `"100svh"` | The sticky stage. Must be a definite length. |
| `sceneScroll` | `1.2` | Stage-heights of scroll per frame. |
| `florets` / `seed` | `6` / `7` | Shape of the flower (florets clamped to 3–8). |
| `alive` | `true` | Idle turn, pointer tilt, petal sway. Reduced motion forces it off. |
| `className` | `""` | Appended to the root. |

Layout responds to the **stage**, not the window (`container-type: size`), so
it holds in a 21st preview frame as well as full-page, portrait or landscape.
