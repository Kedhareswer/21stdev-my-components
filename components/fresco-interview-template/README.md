# Fresco Interview Template

A long-read interview set inside a painted Baroque ceiling: an editorial
series page for founder stories, creator spotlights, artist profiles or any
"in conversation with" feature. The sky is a sticky stage of cumulus banks
painted on canvas that drift past at their own depths as the page scrolls.
Marble angels and cherubs are real photographs of sculpture, lifted off
their skies in a canvas keyer and re-graded to the fresco palette, so they
read as painted into the clouds. The headline sinks behind a bank of cloud,
the pull-quote is pinned while a twisting red ribbon draws itself through
it, and the next story rises out of the clouds at the end.

**Requires `gsap`** (with its bundled `ScrollTrigger`). Everything else is React.

Nothing is fetched but the photographs, and the page is finished before they
arrive: the clouds, the sky, the pearl and the ribbon are all drawn in code.
A photo that cannot be fetched stays out of the sky; a host that refuses
CORS shows the photo plain inside a soft oval instead of keyed.

- **Masthead.** The series wordmark stacks at the top left (`Studio Visit`,
  `Vol. 04`), with *Index* and *Next* at the right. It is transparent over the
  hero and gains a veil once you scroll, the story's kicker and title appear
  in the middle, and a gold hairline along its bottom edge is the reading
  progress.
- **Hero.** A serif line over a heavy sans line (`Loud` / `Quiet`), a kicker
  above, two angels at the corners and a figure rising out of the front
  bank of cloud, in front of the type. On load the lines rise and the front
  clouds settle. The pointer tilts the scene by depth. On scroll the copy
  lifts and fades while the front clouds come up to swallow it; every figure
  parallaxes by its own `depth`.
- **Deck.** The one-line summary in bold sans and italic serif
  (`**Loud Quiet** _got a city singing._`) with a pill button to the
  subject's site. Words rise as they are reached.
- **Q & A.** The ornamented title (any `X & Y`), a treasure at the right (the
  pearl in its shell, which follows the pointer, or any figure), then the
  questions in two editorial columns: small-caps questions with a gold rule
  that draws, answers in the body colour. The sky darkens and thins out
  behind the copy for contrast. Each section in `sections` is its own
  spread; the quote stage sits after the first.
- **Pull-quote.** Pinned for almost two screens. As you scroll, a twisting
  silk ribbon draws itself across the stage and keeps waving, the words of
  the quote arrive one by one, the figure drifts up and the front clouds
  rise past it. The ribbon is one SVG shape shaded by a live gradient.
- **Next story.** The next interviewee's name rises out of the clouds as the
  stage comes into view, with a figure in front of it. Hover or focus the
  stage and the clouds part a little and the letters spread. The whole
  stage is a link (`href`, or `onNext`). The footer row sits inside it:
  series mark, social icons, legal links and *Top*.
- **Three palettes.** `dusk` (the reference's sienna and gold), `dawn` (a
  daylight fresco: azure sky, cream clouds, umber ink) and `nocturne`
  (indigo and silver). `palette="auto"` is `dusk` in dark mode and `dawn` in
  light; `theme` follows the host's `.dark` class or the system by default.
- **Reduced motion** unpins the quote, draws the ribbon fully, stops the
  floating and the scrubbing, and leaves every section in its finished
  state.

```tsx
import FrescoInterviewTemplate from "@/components/ui/fresco-interview-template"

<FrescoInterviewTemplate
  palette="dusk"
  series={{ name: "Studio Visit", issue: "Vol. 04", href: "/" }}
  story={{
    kicker: "Interview 03",
    title: ["Loud", "Quiet"],
    subject: "Tomas Reyes, founder of Loud Quiet",
    deck: "**Loud Quiet** _got a locked-down city singing to itself from the rooftops._",
    cta: { label: "See Loud Quiet's site", href: "https://example.com" },
    figures: [
      { src: "/angel.jpg", alt: "A marble angel", key: "edges", x: -4, y: 4, w: 24, depth: 0.7, flip: true },
      { src: "/figure.png", alt: "A figure looking up", key: "edges", fade: 0.4, x: 37, y: 50, w: 26, depth: 0.08, front: true },
    ],
  }}
  sections={[{ title: "Q & A", ornament: "pearl", items: [{ q: "How did it start?", a: "On a roof." }] }]}
  quote={{ text: "**Breath, harmony** _and a little company are more important than ever._", cite: "Tomas Reyes" }}
  next={{ label: "Next story", title: ["Ines", "Varga"], blurb: "The stage designer who built a theatre in a car park.", href: "/stories/ines-varga" }}
  onNext={(n) => router.push(n.href)}
/>
```

## Figures

Every figure is a photograph plus instructions for lifting it off its
background:

| Field | What it does |
|---|---|
| `src`, `alt` | The photo. Unsplash URLs are resized automatically; any CORS-enabled host works. |
| `key` | `edges` reads the background colour off the left and right edges of every row, so clear skies, studio walls and gradient backdrops key cleanly. `luma` keeps the lit parts and drops the dark (paintings, night shots). `none` shows the photo in a soft oval. |
| `range` | The two thresholds of the key, 0 to 1: below the first is background, above the second is subject. Widen the gap for a softer edge. |
| `crop` | Fractions `[x, y, w, h]` applied before keying, to lose a pedestal or a neighbour. |
| `fade` | Fades out the bottom of the figure into the clouds, as a fraction of its height. |
| `keep` | How much of the photo's own colour survives the fresco grade (0 is pure marble ramp, 1 is the photo). |
| `x`, `y`, `w` | Position and width on the stage, in percent. |
| `depth` | Parallax: 0 sits on the page, 1 floats far behind it. Also sets how much the pointer moves it. |
| `rotate`, `flip`, `drift` | A tilt, a mirror, and the idle float in pixels. |
| `front` | Stand in front of the copy rather than behind it. |

The default photographs are Bernini's angels on the Ponte Sant'Angelo and
a marble athlete, keyed from flat skies and a red wall, plus a painted
angel keyed by luminance. Credits below. Replace them
with your own cut-out PNGs (`key: "none"` with a transparent PNG is the
simplest path) or any photo against a plain background.

## Palettes

A palette is the cloud colours (`shadow`, `mid`, `light`, `rim`), the
marble ramp the figures are graded through, `ink`, `muted`, `gold`,
`ribbon` and `ribbonDark`, the `veil` behind the questions, and a sky
`tone` per section (`hero`, `qa`, `quote`, `next`: three gradient stops, the
sun's position and strength, and how much of the sky's cloud shows). Pass a
preset name or your own object. `seed` reshuffles every bank of cloud.

## Play with it

- `demo.tsx`: the reference page. A rooftop choir, dusk palette, pearl,
  three figures in the hero.
- `demo-nocturne.tsx`: a shadow-theatre interview in the night palette, with
  the painted angel in front of the headline, the marble athlete at the
  quote, and `onNext` logging the next story.

Open `?dark` before the hash in the workshop for dusk, or without it for the
daylight fresco.

## Props

| Prop | Type | Default |
|---|---|---|
| `series` | `{ name, issue, href? }` | Studio Visit, Vol. 04 |
| `story` | `{ kicker, title: string[], subject, deck, cta?, figures }` | Loud Quiet |
| `sections` | `{ title, items: { q, a }[], ornament?: "pearl" \| "none" \| FitFigure }[]` | two spreads |
| `quote` | `{ text, cite?, figure? } \| null` | the pull-quote |
| `next` | `{ label, title: string[], blurb?, href, figure? } \| null` | Ines Varga |
| `social`, `legal` | `{ label, href, icon? }[]` | three icons, two links |
| `labels` | `{ index, next, scroll, nextStory, top, ... }` | English |
| `palette` | `"auto" \| "dusk" \| "dawn" \| "nocturne" \| FitPalette` | `"auto"` |
| `theme` | `"system" \| "light" \| "dark"` | `"system"` |
| `seed` | `number` | `1` |
| `onNext` | `(next) => void` | follow `href` |
| `height` | `string` | `"100svh"` |
| `className` | `string` | |

## Notes

- One file. Styles are a scoped `<style>` on `.fit-` classes; no fonts are
  loaded (Playfair Display, Didot or Bodoni if the page has them, else
  Georgia; Helvetica Neue or the system sans).
- The sky is `position: sticky` inside the component, so the template works
  inside a scrolling panel as well as the window.
- Cloud banks are painted once per seed and palette and shared between
  instances; the first banks paint before the first frame and the rest a
  frame at a time.
- 21st's capture sandbox blocks external origins, so the server cover will
  not render the photographs: supply your own `--preview`.

## Photo credits (Unsplash)

- Marble angel with open wings: `photo-1782897955905-fb23f7db40bd`
- Marble angel holding a garment: `photo-1758651794755-465d25631649`
- Marble figure looking up, on red: `photo-1571033690858-b336bfa1dd0f`
- Painted angel seated on a rock: `photo-1775309678950-4d087e17d140`
