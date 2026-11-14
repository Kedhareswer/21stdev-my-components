# Bunkum Studio Template

A one-page landing template for a small illustration and motion studio: a stretchy wordmark, a turning illustrated box, a plain index and an endless wall of scraps.

1. **Hero.** A giant BUNKUM wordmark set as a grid of flat letters on a speckled ground. Move the pointer and the letters near it pull their stems down to almost twice their height, then ease back. Only the stems lengthen: bowls, junctions and the M's valley stay put, so a stretched letter still reads as itself. A pink blob peeks out of the U. Gerald the gremlin rides the bottom of the K, swaying as it moves. An aubergine hides in the M. A tall illustrated box sits centre stage, turning to look at the pointer and slowly spinning on its own. A signature sits bottom left.
2. **Studio.** Centred title; the about text, then three columns: what the studio makes, who it has made it for, and how to say hi.
3. **Index.** Twelve projects in a quiet table (name, client, year, arrow). A row brightens slightly on hover, and clicking one opens its picture.
4. **Archive.** A pinned stage that opens in preview mode, with one large card and a row of small scraps either side. Scroll and it zooms out to an endless wall of scraps. The wall keeps panning as you scroll, and on a desktop you can drag it in any direction. Click any scrap to bring it back to the preview.
5. **Footer.** "Got a weird brief?" with a magnetic commission button, a copy-the-email pill, a fan of cards that spreads on hover, a rolling strip of badges, and the signature.

**Nav.** Pills in the letter colour. On hover each label rolls up a line, letter by letter from the right, with a small springy settle. The spinning flower at the end cycles the palette (Cobalt, Tomato, Night, Pistachio). Each change is instant and recolours the stage, letters and pills together.

**Easter egg:** poke Gerald five times and he lets go. He's fine; he drops back onto the K a moment later.

## Motion

The motion follows measurements taken from a live preview of the reference this template pays tribute to, not guesses:

| | Value |
|---|---|
| Letter stretch | 1.89× rest height; full pull within 0.139 × viewport width of a letter's centre, falling linearly to none at 0.462 × width |
| Letter easing | exponential, τ = 105 ms, no overshoot; letters rest when nobody is pointing |
| Box look-at | rotateY = 175° × pointer x, rotateX = −175° × pointer y (−1…1 from centre), τ = 300 ms |
| Box idle spin | 6° per second about Y |
| Nav label roll | one line height, about 16% overshoot, 30 ms stagger from the right, about 400 ms |
| Archive | preview → grid in 450 ms; grid pitch 1/13.5 of the width, rows 1.75 pitches apart |

The frame reads layout once (the root's box). Everything else is SVG path data and transforms, and the loop sleeps when the template is off screen. The wordmark and the box follow a mouse, or a finger while it is down. The context label and magnetic pills only exist where `(hover: hover) and (pointer: fine)` matches. With `prefers-reduced-motion`, the letters rest, the box holds a still pose, Gerald doesn't swing, the archive shows a still wall, and transitions are instant.

## Pictures and fonts

The eighteen illustrations and four sticker characters were generated for this template with ChatGPT's image model. They're embedded as compressed WebP data URIs (about 520 KB in total), so the component makes no network requests. The stickers were keyed to transparent WebP. Each picture is set once as a CSS custom property on the root, so a scrap that appears many times on the wall doesn't copy the data. To use your own art, replace the entries in `IMG` at the bottom of the file (`a0`–`b8` are square illustrations, `s0`–`s3` are the stickers).

Text uses subsets of **Inter Tight** (400 and 700) and **JetBrains Mono** (capitals). Both are SIL Open Font License 1.1 fonts, embedded as base64 woff2. As the licence asks of modified copies, the subsets are renamed (`BkmSans`, `BkmMono`). Together they add about 34 KB.

It needs nothing beyond React and Tailwind's base styles.

```tsx
import BunkumStudioTemplate from "@/components/ui/bunkum-studio-template"

<BunkumStudioTemplate
  email="hello@bunkum.studio"
  commissionAction={{ label: "Start a commission", href: "/contact" }}
/>
```

`height` sets the height of each pinned stage. It defaults to `100svh` and must be a definite length. Projects, scraps, themes and copy are constants near the top of the file. The wordmark's glyphs are drawn for the letters B, U, N, K and M. To change the word, add a case to `glyph()` for each new letter.
