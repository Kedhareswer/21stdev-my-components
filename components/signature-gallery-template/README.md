# Signature Gallery Template

A gallery-first portfolio for Kedhareswer, in three views behind one nav: **home**, **about** and
**projects**. Pale paper ground, black serif type, mono labels and one pure blue accent. Every
view ends in the same blue call to action and footer.

## Home

1. **Gallery hero.** A pinned stage holds 120 photographs scattered through real CSS 3D space
   (670px perspective). On load the closing portrait rises in up close, then the collage zooms back
   into place around it while the photographs fade in one by one. As you scroll, the camera flies
   through the field: photographs grow, pass beside you and fade just before the lens, and the
   field draws in toward the centre. At the end the portrait comes forward into a close-up and a
   handwritten signature draws itself across it. The stage tilts a few degrees toward the mouse.
2. **Manifesto.** Seven lines. As each comes into view a blue bar covers it and shrinks away from
   the middle; the words rise out from under it, edge words first, their letters shuffled until
   they land, grey turning through blue to ink.
3. **Disciplines.** Five rows, alternating sides. Each preview drops in behind a blue and a black
   curtain and its name rises in. On hover a blue wipe runs up the preview and brings the next of
   that discipline's projects, the picture eases larger inside its frame, a rule draws under the
   row and an arrow slides in. A click opens the projects view.

## About

1. **Headline.** Three huge lines (the last in blue italic) with two cut-out pictures between
   them: one rises in, the other settles from large to a slight tilt, then the words shuffle in.
   A full-height and full-width hairline crosshair follows the mouse on this view.
2. **Narrative.** A title, a small photograph in a blue box, one sentence and a tall
   black-and-white portrait.
3. **Timeline.** A pinned stage, four screens long. Four tilted blue squares on the left; the one
   for the current year straightens, grows and shows its photograph. On the right a ruler of 42
   ticks swells where the scroll is, and the current year grows and reveals its line.

## Projects

An endless rail of fifteen placeholders ("Project 01" … "Project 15"). Drag it, turn the wheel
over it, or focus it and use the arrow keys; it eases to a stop. The card nearest the middle is
larger and names the 250px title underneath. Filters narrow the rail to one discipline.

## Shared

- **Call to action.** A blue panel: a row of ticks that spin in a travelling wave, a paragraph
  whose words arrive from both ends inward, the signature large in white and a mail button.
- **Footer.** A marquee of the name at 50px a second, then pages and clients (Client 1, Client 2,
  Client 3) in mono type between dotted rules, and the email.

```tsx
import SignatureGalleryTemplate from "@/components/ui/signature-gallery-template"

<SignatureGalleryTemplate
  name="Kedhareswer"
  email="kedhareswer.12110626@gmail.com"
  images={["/work/01.webp", "/work/02.webp" /* … */]}
  portrait="/work/portrait.webp"
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `height` | `"100svh"` | Height of each pinned stage (hero, timeline, rail). |
| `heroLength` | `8.3` | Scroll travel of the hero, in stage heights. |
| `initialView` | `"home"` | `"home"`, `"about"` or `"projects"`. |
| `name` | `"Kedhareswer"` | Marquee, footer and labels. |
| `images` | 18 photographs | Any image URLs. Everything indexes into this list. |
| `portrait` | a photograph | The image the gallery folds into (4 : 5). |
| `manifesto` | 7 lines | One string per line; each line wipes in on its own. |
| `disciplines` | 5 rows | `{ name, href?, images: number[], projects: string[] }`. Also the rail's filters. |
| `aboutTitle`, `aboutCutouts` | | Three headline lines; two transparent pictures. |
| `narrativeKicker`, `narrativeTitle`, `narrativeText`, `narrativePortrait` | | The narrative block. |
| `timelineLabel`, `timeline` | 4 entries | `{ year, text, image }`. The years are placeholders: put your own. |
| `projects` | 15 placeholders | `{ title, discipline, image, href? }`. |
| `ctaLabel`, `ctaLead`, `ctaLines`, `ctaButton` | | Call-to-action copy; `ctaLines` is one string per line. |
| `email` | | Button and footer. |
| `clients` | `["Client 1", "Client 2", "Client 3"]` | Footer list. |

## Images

The default pictures are original, generated for this template, and served from
`https://kedhar-components.pages.dev/signature-gallery-template/`: eighteen 400 × 400 tiles, the
4 : 5 portrait, a tall black-and-white portrait and two cut-outs, about 400 KB in all. The files
live in this repo under `dev/public/signature-gallery-template/`. Pass your own to replace them.

## Fonts

Display type is a Latin subset of **Instrument Serif** (regular and italic); labels use **IBM Plex
Mono**. Both are SIL Open Font License 1.1 fonts, embedded as base64 woff2 and renamed `SgSerif`,
`SgItalic` and `SgMono`, as the licence asks of modified copies. Together about 50 KB. The small
sans labels on the projects view use Inter if the page has it, otherwise the system sans.

## Motion and access

- The hero and the timeline each run one `requestAnimationFrame` loop that reads its track's rect
  once per frame and then only writes. Scroll progress is eased (8/s), the tilt more gently (5/s),
  the rail at 4.2/s.
- Only the rail's strip takes the wheel, so the page can always scroll past it.
- The tilt and the crosshair only run under `(hover: hover) and (pointer: fine)` and ignore touch.
- `prefers-reduced-motion: reduce`: no intro, fly-through or tilt (the hero is one screen tall and
  shows the collage with the portrait and its signature in front); text appears without wipes or
  shuffling; ticks and marquee stand still; the rail and timeline move without easing.
- Below 810px the nav folds into a menu button, the rows stack and the timeline stacks.
- Rows, filters and the rail are keyboard reachable.

It needs nothing beyond React.
