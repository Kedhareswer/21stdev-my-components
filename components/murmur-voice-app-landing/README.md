# Murmur Voice App Landing

A dark, single-page landing for a voice-first AI phone app, designed and built by
Kedhareswer. A hand tips a phone up out of the dark while the headline writes itself
in, letter by letter, out of a blur. Below it sit a bento of features (live threads, a
fanned image stack, a voice prompt and a group-chat orbit), a pinned phone whose
screen changes as five features scroll past, a hands-free story with a looping,
draggable slider, a Plus tier with drifting glass shapes, and an early-access card
with a second phone rising into it.

```tsx
import MurmurVoiceAppLanding from "@/components/ui/murmur-voice-app-landing"

<MurmurVoiceAppLanding />
```

**No dependencies beyond React.** The phone screens are HTML laid over a photograph of
a hand holding a blank phone. That photo, six editorial portraits and three glass
shapes (envelope, bolt, sphere and blob) were generated with ChatGPT for this piece;
they are ten WebP files, about 385 kB together, served from
`https://kedhar-components.pages.dev/murmur-voice-app-landing/`. The portraits show
no real people. The voice orb is a canvas and the in-app "artworks" are painted on a
canvas when the page mounts (one per task, so the load animation never waits). Two
small font subsets are embedded: **Manrope** (headings) and **Inter** (body), both
under the SIL Open Font License 1.1.

## Play with it

| Do this | And |
|---|---|
| Load the page | The phone tips up from flat (rotateX −75°, 1 s) and the headline letters rise out of a 5 px blur, 40 ms apart |
| Scroll the first screen | The headline sinks toward 600 px and fades to 30% behind the phone |
| Scroll into a section | Headings write in letter by letter (word by word for Plus), cards swing up from −50° on their own delays, dividers grow from the centre |
| Scroll past the five features | Lines light up as they enter, and the pinned phone cross-fades to the matching screen |
| Watch the group-chat card | Three rings of portraits turn once every 20 s, the middle ring the other way |
| Hover the image card | The stacked paintings fan out (mouse only) |
| Move a mouse over any card | A soft violet light follows the pointer (mouse only) |
| Drag the slider, or use its arrows | Cards glide one step on an overdamped spring and loop forever |
| Scroll through Plus | The three glass shapes drift and turn at their own rates |
| Submit the beta form | Your mail app opens with the request addressed to the email prop |
| Open it on a phone | The nav folds into a two-line menu button |

## Props

| Prop | Default | What it does |
|---|---|---|
| `height` | `"100svh"` | Minimum height of the opening hero. Must be a definite length. |
| `email` | `kedhareswer.12110626@gmail.com` | Where "Talk to Kedhareswer", the footer and the beta form point. |
| `className`, `style` | | Passed to the root. |

## Notes

- The design is dark by intent and paints its own background, so it looks the same in
  light and dark hosts.
- `prefers-reduced-motion: reduce` shows everything in place: no reveals, no headline
  sink, no orbit, no glass drift, an instant slider, and the orbs draw one still frame.
- The cursor light and the fan hover only exist under `(hover: hover) and
  (pointer: fine)`; touch never drives them. The slider drags with any pointer.
- Layout is exact at 1200 px and up, tightens between 810 and 1199 px, and below
  810 px stacks the bento, keeps the pinned phone beside the feature lines and shows
  one slide at a time.
- Durations, delays, easings and distances are pinned by
  `tests/murmur-voice-app-landing.test.mjs`.
