# Strobe Diva Footer

A site footer laid out like a screen-printed fashion poster. The top half is paper, with a seal, the house's founding year and a barcode, and the link columns tracked small in the flanks. In the middle, a dancer stands in front of a red sun, printed like a photocopy. A wheel of her own arms fans out behind her. Below, the wordmark fills a black band edge to edge in sandpapered red, cut off at its foot by the floor. The legal line and back-to-top sit on the floor.

## The signature

- **The photo is printed by a copier in the browser.** The backdrop is keyed out by a flood fill from the edges, so the gaps in a mesh cape open up while light inside the figure stays. Then a hard contrast curve and clumped grain turn it into toner. A paper rim is cut round it, so a black gown still reads over the black band.
- **Her arms are cloned into a wheel.** Each echo is a copy of a copy. It prints a little darker and a little larger, like a copier left on 104%. Move the pointer and the wheel turns to follow it. Each echo rides a softer spring than the one before, so a quick sweep spreads the arms into a motion trail that closes up when you stop. Move high and the fan opens wider. Move low and it folds.
- **The entrance is a storyboard.** The barcode bars rise, the sun comes up and the letters stamp in one by one. Then the copier lamp sweeps down and prints her, the columns arrive, and the arms fan out generation by generation.
- **Click the sun** and the arms clap shut. The lamp prints her again and the wheel reopens.
- **The pointer polishes the print.** The grit in the wordmark clears in a lens around it.

**No dependencies.** React is the only import. The default photograph comes from `images.unsplash.com`, which sends CORS headers so its pixels can be read. Everything else is drawn in code: the seal, barcode, grit, grain and floor are SVG, and the copy is a canvas.

```tsx
import StrobeDivaFooter from "@/components/ui/strobe-diva-footer"

<StrobeDivaFooter />

<StrobeDivaFooter
  preset="midnight"
  wordmark="NOCTURNE"
  sealText="Nocturne · Paris · Tokyo ·"
  established="1991"
  columns={[
    { title: "Shop", links: [{ label: "New arrivals", href: "/new" }, { label: "Eyewear", href: "/eyewear" }] },
    { title: "Help", links: [{ label: "Orders", href: "/orders" }] },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `wordmark` | `"ARDENTE"` | The giant word. Short and all caps reads best. It is measured by its ink and stretched to fill the band. |
| `mark` | first letter | The initial in the seal. |
| `sealText` | `"Ardente · Maison de couture ·"` | Runs round the seal. It spins on hover. |
| `established` / `barcode` | `"1978"` / `"7736831210"` | The year under "Est." and the barcode digits. |
| `columns` | Maison · Collections · Clients · Follow | `{ title, links: { label, href?, external? }[] }[]`. The first half go in the left flank, the rest in the right. Phones stack them under the band. |
| `copyright` / `legalLinks` | | The floor line. |
| `backToTop` / `onBackToTop` | `true` | Scrolls the window to the top unless you handle it. |
| `figure` | the dancer | A photograph to print, see below. `null` uses the drawn figure. |
| `arms` | `7` | Echo arms per side, 0–10. |
| `fanStep` | `19` | Degrees between echoes. |
| `preset` | `"crimson"` | `crimson` · `midnight` · `cobalt` · `gilt` |
| `palette` | | `{ paper, ink, accent, figure, figureLight }` overrides. `figure` and `figureLight` must be hex, because the copier prints with them. |
| `grit` | `0.6` | How distressed the wordmark prints, 0–1. |
| `grain` | `0.16` | Film grain over the whole footer, 0–1. |
| `interactive` | `true` | The wheel, the sun's parallax and the lens. |
| `labels` | English | `{ established, backToTop, replay }`. |
| `fontFamily` / `monoFamily` | Impact stack / JetBrains Mono stack | The wordmark face and the small type. Nothing is fetched. |
| `height` | `"100svh"` | A definite length, never a percentage. Minimum 640px. Phones size to content. |

### Your own photograph

Any full-length photo on a plain light or dark backdrop works. Every point is a fraction (0–1) of the photo's width and height.

```tsx
<StrobeDivaFooter
  figure={{
    src: "https://images.unsplash.com/photo-…?w=1200&q=80&fm=jpg",
    alt: "…",
    ratio: 2 / 3,                    // the photo's width / height
    crop: [0.29, 0.045, 0.71, 0.845], // the person: left, top, right, bottom (feet on the floor)
    head: [0.47, 0.215],             // the sun centres here
    backdrop: "light",               // or "dark"
    tone: 0.46,                      // copier contrast midpoint: higher prints darker
    arms: [                          // what to clone, and where it turns (the elbow or shoulder)
      { pivot: [0.342, 0.188], outline: [[0.312, 0.19], [0.328, 0.15] /* … */] },
      { pivot: [0.668, 0.19], outline: [[0.698, 0.185], [0.672, 0.138] /* … */] },
    ],
  }}
/>
```

An arm left of the head opens anticlockwise and one right of it opens clockwise. Leave `arms` out for a photo with no wheel. The host must send CORS headers so the pixels can be read. If it does not, or the photo fails to load, the drawn figure stands in.

## Notes

- **Performance.** The photo is printed once per size, at up to 2× density, and reprinted only when the stage changes size by more than 6%. The wheel draws only while a spring is moving, and sleeps off-screen.
- **Accessibility.** The canvas has the photo's `alt` as its label. The wordmark is in the page as text. Every link is a real, focusable anchor, and the sun is a button labelled "Replay the entrance".
- **Reduced motion.** Everything appears in place. There is no scan, no stamping, no trail and no spin.
- The footer brings its own palette, so it looks the same in light and dark themes.
- The 21st capture sandbox blocks external origins, so a server-made cover shows the drawn figure. Supply your own `--preview` from `media/strobe-diva-footer/cover.png`.

## Photo credit

The default photograph is `https://images.unsplash.com/photo-1654787616600-59ce4b023edf` from [Unsplash](https://unsplash.com), free under the Unsplash License. The brand, the copy and the links are fictional; replace them with your own.
