# Perimeter Wordmark Preloader

A preloader that assembles a short word out of letters parked at the corners of a gradient panel.

The first letter already sits in its place at the bottom left. The others wait at the bottom-right, top-right and top-left corners. Once a second every waiting letter moves one corner along the edge, and the one at the bottom right slides home, so the word builds left to right. With the last letter the panel drops away and the page underneath is left holding the wordmark.

## Usage

```tsx
import PerimeterWordmarkPreloader from "@/components/ui/perimeter-wordmark-preloader"

export default function Page() {
  return (
    <PerimeterWordmarkPreloader text="NOIR" duration={3400} onComplete={() => console.log("ready")}>
      <YourHero />
    </PerimeterWordmarkPreloader>
  )
}
```

To replay it, remount it with a new `key`. The demo's Replay link does that.

## Props

| Prop | Type | Default | What it does |
|---|---|---|---|
| `text` | `string` | `"NOIR"` | The word. Each letter after the first takes one move, so two to six letters read best. Spaces are dropped. |
| `duration` | `number` | `3400` | Whole sequence in milliseconds, from the first frame to the panel being gone. |
| `onComplete` | `() => void` | none | Called once, when the panel has left and the page is interactive. |
| `onReveal` | `() => void` | none | Called once, when the panel starts to drop. Use it to start the page's own entrance. |
| `children` | `ReactNode` | none | The page underneath. It is rendered from the start, kept `inert` while covered, and uncovered at the end. |
| `height` | `string \| number` | `"100svh"` | Height of the stage. Give it a definite length, not a percentage. |
| `panel` | `string` | blue field | Any CSS `background` for the panel. |
| `color` | `string` | `"#fcfcfc"` | Letter colour. |
| `fontFamily` | `string` | Helvetica stack | Font for the letters. A bold grotesque keeps the proportions. |
| `keepWordmark` | `boolean` | `true` | Leave the assembled word on the page. `false` fades it out with the panel. |
| `className` | `string` | none | Added to the root. |

## Lining the page up with the word

The stage is a size container, and it publishes three custom properties to its children:

- `--pwp-g`: the side gutter the letters sit on;
- `--pwp-iy`: the inset of the word's baseline from the bottom, and of the top row from the top;
- `--pwp-fs`: the letters' font size. The cap height is about `0.72` of it.

The demo page pads itself with `--pwp-g` and `--pwp-iy`, so its logo, its picture and the wordmark share the same edges. With `keepWordmark` on, keep the bottom-left corner of the page free: the word stays there.

## Timing

Measured on the reference, per second of a 3.4 s run:

- 0.4 s hold on the corners;
- one move per second, each 0.78 s long, eased with `cubic-bezier(0.65, 0, 0.35, 1)`;
- the panel starts to drop 0.22 s into the last move and takes 0.76 s, same easing.

`duration` scales all of it. A longer word adds one move per letter inside the same duration.

## Notes

- No dependencies beyond React.
- Positions are container units and percentages, so nothing is measured and a resize needs no code. A canvas reads each letter's side bearings and the font's cap height once, so the ink, not the letter box, meets the gutters.
- With `prefers-reduced-motion` the letters do not travel and the panel does not slide: the finished word shows, then the panel fades.
- The demo's photograph is loaded from `https://kedhar-components.pages.dev/perimeter-wordmark-preloader/red-coat.webp`. The component itself fetches nothing.
