# Bunkum Wordmark Hero

The hero from Bunkum Studio Template as a standalone piece: a giant BUNKUM wordmark set as a grid of flat letters on a speckled ground. The letters stretch under the pointer. Small stickers ride them, and a tall illustrated carton turns to look at you.

## What it does

- **Stretchy letters.** Move the pointer and the letters near it pull their stems down to almost twice their height, then ease back. Only the stems lengthen. Bowls, junctions and the M's valley stay put, so a stretched letter still reads as itself.
- **Stickers.** A pink blob peeks out of the U and boings when you click it. Gerald the gremlin rides the bottom of the K and sways like a pendulum as the K moves. An aubergine hides in the M.
- **The carton.** It sits centre stage, turns to look at the pointer and slowly spins on its own.
- **Nav.** The pills use the letter colour. On hover each label rolls up a line, letter by letter from the right, with a small springy settle. The pills lean towards a mouse (magnetic). The spinning flower badge cycles the palette (Cobalt, Tomato, Night, Pistachio). Each change is instant and recolours the stage, letters and pills together.
- **Context label.** With a mouse, hovering the badge, the blob or Gerald shows a small label next to the cursor. The system cursor stays.
- A hand-drawn signature sits bottom left, and a line of copy sits bottom right.

**Easter egg:** poke Gerald five times and he lets go. He's fine; he drops back onto the K a moment later.

## Motion

| | Value |
|---|---|
| Letter stretch | 1.89× rest height; full pull within 0.139 × width of a letter's centre, falling linearly to none at 0.462 × width |
| Letter easing | exponential, τ = 105 ms, no overshoot; letters rest when nobody is pointing |
| Carton look-at | rotateY = 175° × pointer x, rotateX = −175° × pointer y (−1…1 from centre), τ = 300 ms |
| Carton idle spin | 6° per second about Y |
| Nav label roll | one line height, about 16% overshoot, 30 ms stagger from the right, about 400 ms |

The frame reads layout once (the root's box). Everything else is SVG path data and transforms, and the loop sleeps when the hero is off screen. The wordmark and the carton follow a mouse, or a finger while it is down. The context label and the magnetic pills only exist where `(hover: hover) and (pointer: fine)` matches.

**Reduced motion:** with `prefers-reduced-motion`, the letters rest, the carton holds a still pose, Gerald doesn't swing or let go, the badge stops spinning, and transitions are instant.

## Usage

```tsx
import BunkumWordmarkHero from "@/components/ui/bunkum-wordmark-hero"

<BunkumWordmarkHero
  links={[
    { label: "Studio", href: "#studio" },
    { label: "Index", href: "#index" },
    { label: "Archive", href: "#archive" },
  ]}
/>
```

| Prop | Type | Default | |
|---|---|---|---|
| `height` | `string` | `"100svh"` | Stage height. Must be a definite length. |
| `brand` | `string` | `"BUNKUM"` | Text in the brand pill and the accessible heading. |
| `year` | `string \| number` | `"2026"` | Shown after the © in the brand pill. |
| `brandHref` | `string` | `"#"` | Where the brand pill links. |
| `links` | `{ label: string; href: string }[]` | Studio, Index, Archive (`#`) | The nav pills. |
| `copy` | `string` | the studio blurb | The line bottom-right (hidden under 640px). |
| `className`, `style` | | | Passed to the root. |

The giant wordmark always spells BUNKUM, because its glyphs are drawn by hand for B, U, N, K and M. To change the word, add a case to `glyph()` for each new letter.

## Pictures and fonts

The six carton faces and three stickers (blob, Gerald, aubergine) were generated for the original template with ChatGPT's image model. They're served full-size from `https://kedhar-components.pages.dev/bunkum/` (embedding them would push the file past 21st's 200 kB limit); to self-host, copy them and change `IMG_BASE` at the bottom of the file. Each picture is set once as a CSS custom property on the root. Text uses subsets of **Inter Tight** (700) and **JetBrains Mono** (capitals), both SIL Open Font License 1.1 fonts, renamed `BkmSans` and `BkmMono` as the licence asks of modified copies.

It needs nothing beyond React and Tailwind's base styles.
