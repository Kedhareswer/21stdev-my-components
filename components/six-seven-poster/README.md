# Six Seven Poster

A thriller one-sheet that acts out the "six… seven" meme. A red field, a
figure in a stained shirt holding both palms out, and huge dry-brush numerals
painted across it. First the **6** lands over the left hand. Then the **7**
lands over the right. Then the hands pump like scales. Last, the title is
painted across the whole poster and the small print comes up.

**No dependencies.** React is the only import. It uses one 2D canvas and no
CSS file, fonts, images or animation library. The figure, the hands, every
brush stroke, the paper texture and the grain are drawn from numbers. So it
never waits on a download and never trips a sandbox that blocks off-site
assets.

## Two modes, one timeline

| Mode | What drives it |
|---|---|
| `"auto"` **(default)** | A clock. It plays from black to the finished poster, holds, fades out and loops. It has play/pause, replay, beat chips and a draggable scrubber. |
| `"scroll"` | The page. The root is `scrollLength` stages tall with a sticky stage inside, and scroll position *is* the timeline. Scroll back and the paint comes off. |

```
beat    what happens
------  ---------------------------------------------------------------
intro   black → the red field flickers up, the figure fades in, billing
six     cut on a white frame; left hand rises; the 6 is painted over it
seven   cut; right hand rises, left drops; the 7 is painted; the 6 dims
pump    the hands swing past each other three times; the numerals trade
        brightness; the camera shakes
title   the numerals sink behind the figure as dark ghosts; the title is
        painted letter by letter; tagline, billing, date and rating land
```

**Interactive.** The pointer drifts the layers at different depths, and the
hand under it lifts a little. Clicking flicks paint at the stage and kicks the
hand on that side, which also flares its numeral. Keyboard: `6` and `7` kick
the hands, `Space`/`K` pauses, `R` replays, and `←`/`→` step between beats.

## Usage

```tsx
import SixSevenPoster from "@/components/ui/six-seven-poster"

<SixSevenPoster />                       // autoplay, the default
<SixSevenPoster mode="scroll" />         // scrubbed by the page

<SixSevenPoster
  first="4"
  second="2"
  title="THE ANSWER"
  captions={["First, it was four.", "Then, it was two."]}
  red="#0f5e63"
  shirt="#b89a7a"
  loop={false}
/>
```

Give it a parent with a width and nothing else (see `demo.tsx`).

## Props

| Prop | Default | Notes |
|---|---|---|
| `mode` | `"auto"` | `"auto"` or `"scroll"`. |
| `first` / `second` | `"6"` / `"7"` | Any single A–Z or 0–9 glyph. |
| `title` | `"SIX SE7EN"` | A–Z, 0–9, space, hyphen. In portrait it wraps to two lines at the best-balanced space. |
| `captions` | six / seven lines | One per beat, joined into the tagline at the end. |
| `cast` | three names | Top-left billing. Each word gets its own line, as on the reference. |
| `credit` | `"A film by nobody in particular"` | Top right. |
| `billing` | parody block | The small print. Hidden below `sm`. |
| `release` | `"In cinemas 6.7"` | |
| `rating` | `"Not rated for sevens"` | Beside a box holding `first + second`. |
| `red` / `paint` / `ink` / `shirt` | `#d3141b` / `#f2eee8` / `#0f0808` / `#7f93a4` | Hex. Skin, blood and ghosts are mixed from these. Anything that isn't hex falls back to white. |
| `grain` | `0.14` | `0` disables it. |
| `duration` | `11` | Seconds from black to the poster (auto). |
| `hold` | `3.5` | Seconds on the poster before looping (auto). |
| `loop` | `true` | Off: plays once and rests on the poster. |
| `autoPlay` | `true` | Off: opens on the finished poster, and play starts from black. |
| `scrollLength` | `4` | Multiples of `height` (scroll). |
| `height` | `"100svh"` | The stage. **Must be a definite length.** |
| `controls` | `true` | Chips, play/pause, replay and scrubber. |
| `parallax` | `true` | Pointer drift and hover lift. |
| `onBeatChange` | none | `(beat: "intro" \| "six" \| "seven" \| "pump" \| "title") => void` |
| `className` | `""` | Appended to the root. |

`clamp01`, `smoothstep`, `easeInOut`, `progressFrom`, `beatIndex`,
`autoFrame`, `handLift`, `paintAt`, `flashAt`, `BEATS`, `BEAT_START` and
`BEAT_HOLD` are exported. You can drive something of your own from the same
timeline.

## Notes

- **The brush is a bundle of bristles.** Each stroke is a Catmull-Rom
  skeleton, resampled by arc length. It is painted as about 25 offset
  polylines. The middle bristles run the full length. The outer ones start
  late, run dry early and skip, so the tail splits into streaks. Paper tooth
  is punched out of the paint layer afterwards with one tiled
  `destination-out` pattern.
- The paint layer is redrawn only when a reveal or alpha actually changes. On
  the held poster it is one `drawImage` per frame.
- Each numeral is painted at full strength on a scratch canvas and landed with
  a single alpha. Dimming bristle by bristle would show every overlap as a
  stripe.
- Field, torso and vignette are cached, and rebuilt only on resize or a colour
  change. The arms and hands are drawn every frame because they move.
- Scroll progress comes from the element's `getBoundingClientRect()`, never
  `window.scrollY`. The rAF loop stops while the stage is off screen.
- `prefers-reduced-motion` opens on the finished poster with no loop, grain
  drift, shake, flashes or splatter. The chips still jump between beats as
  still frames.
- The canvas is `aria-hidden`. The poster copy is in an `sr-only` block, and
  the stage is focusable with its keys in its label.
- It is dark by design: it paints its own field in both themes.

## Credit

Art direction is from two references: a red thriller one-sheet (a torso in a
stained shirt, open palms either side, a giant white dry-brush title), and the
"6 7" meme (a baby holding up both hands). The implementation, the alphabet
and all the artwork are original and procedural. No real names, logos or
rating marks are used.
