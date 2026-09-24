# Bubble Graffiti Preloader

A cinematic preloader in blue balloon graffiti, drawn entirely in code.

The shutters open on a cream grid and hollow balloon lettering slides by in
three bands. Then about forty loose letters (blue balloons, white hollows and
black ink) swirl in from off-frame and get sucked into the centre. A black slab
wipes in, a ribbon draws itself across it, pixel blocks stack up, and the word
inflates one tube at a time. A starburst pops and a crowned wordmark drops in
at the top. The whole shot pushes in like a dolly move. Around it runs a film
slate: a blinking REC dot, a 24 fps timecode, the take number, status lines and
a big `000 → 100` counter with a pixel meter. At 100, blue and black pixels cover
the frame and clear to reveal whatever you passed as `children`.

It stays playable while it loads:

| Do this | And |
|---|---|
| Tap a letter | It squishes and throws sparkles |
| Drag a letter | It follows you, then springs back |
| Tap the starburst | It spins and every letter hops in turn |
| Hover a pixel block | It jumps |
| Hit **skip** | The counter races to 100 and the wipe plays |

No image, font file or npm dependency beyond React. The letters come from a
balloon alphabet (A–Z, 0–9, `! ? . -`) stored in the file as centre-line
strokes. Each stroke is inflated into an outlined tube with knotted ends and a
highlight.

## Usage

```tsx
import BubbleGraffitiPreloader from "@/components/ui/bubble-graffiti-preloader"

// Time-based: plays for `duration`, then reveals the children.
<BubbleGraffitiPreloader onComplete={() => console.log("in")}>
  <YourPage />
</BubbleGraffitiPreloader>

// Real progress: the counter follows `progress` and it exits at 100.
<BubbleGraffitiPreloader progress={loaded} word="wait" brand="acme" />

// Showcase / cover: replays forever.
<BubbleGraffitiPreloader loop />
```

The landing counterpart, `bubble-graffiti-landing`, opens with this same
intro and ends on the same drawing it starts from.

## Props

| Prop | Default | What it does |
|---|---|---|
| `word` | `"hello"` | The word the storm collapses into. Four to seven characters fill the slab best. |
| `brand` | `"kedhar"` | Lettered in black at the top, with a crown on the second letter. |
| `tagline` | `"made with no asset"` | Mono line under the brand. |
| `duration` | `4200` | Length in ms when `progress` is not given. It also paces the choreography, so everything speeds up or slows down together. Minimum 1200. |
| `progress` | — | Real progress, 0–100. The counter eases toward it, and the intro exits once it reaches 100 and at least 72% of `duration` has played. |
| `loop` | `false` | Replays with a new take number. Children are never shown and `onComplete` never fires. |
| `messages` | 6 lines | Status lines in the bottom bar, stepped through as progress climbs. |
| `slate` | `"SCENE 01"` | Top-right slate text. |
| `skippable` | `true` | Show the skip button. |
| `palette` | cream / ink / blue | `{ paper, ink, balloon, shine, grid }`. |
| `height` | `"100svh"` | Must be a definite length. |
| `minHeight` | `"560px"` | |
| `fill` | `false` | Cover the nearest positioned ancestor instead of taking a height of its own. |
| `onReveal` | — | Fires when the pixels have covered the frame and the children mount. |
| `onComplete` | — | Fires after the pixels have cleared. |
| `className` | — | On the root. |

Do not pass `height="100%"`. Everything inside is sized with container query
units off the root, so a percentage height collapses to 0px on any installed
page.

## Notes

- All styles are in one scoped `<style>` block (`.bgk-*`). No Tailwind
  utilities are needed, and there are no global resets.
- `prefers-reduced-motion` removes the letter storm and the marquee, and every
  other animation jumps to its final frame. The counter still counts and the
  wipe becomes a cut.
- The counter, meter, timecode and status line are written straight to the
  DOM each frame. They never re-render the drawing.
- The progress is exposed as `role="progressbar"` with a live `aria-valuenow`.
