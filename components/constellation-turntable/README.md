# Constellation Turntable

A star-chart record on a flat, illustrated deck. The vinyl is a night sky:
a starfield and a Milky Way lane pressed between the grooves, the planets on a
spiral, and one constellation per track with its name set along its groove
band. A white tonearm with a perforated headshell rests on it.

It plays, and the music is generated live.

**No dependencies.** React is the only import. No images, fonts, audio files
or network requests. Every shape is SVG built from numbers, and the score
(a slow pad, star chimes through an echo and a hall, vinyl crackle) is
synthesised with Web Audio.

## Interaction

| Do | What happens |
|---|---|
| **Play** (button, tap the label, or <kbd>Space</kbd>) | The platter spins up, the arm swings to the lead-in and drops (you hear the needle land), and the needle walks inward through the side in real time. |
| Pause | The cue lifts the needle and the platter coasts down. The pitch sags with it, like a real deck. |
| **Grab the record** | Scratch it. The music bends with the platter, and runs backwards in time if you do. Let go and it flicks on, then the motor pulls it back to speed. |
| **Drag the arm** | Drop the needle anywhere. Off the record parks it and stops. |
| Tap a constellation's name | Cues its track. |
| Tap a planet | Rings it. The giants ring low, the small ones high. |
| Track map in the player | One segment per track, as long as the track. Click one to cue it. |
| 33⅓ / 45 | Switches speed. Spin and pitch both follow. |

The constellation under the needle draws itself in, and its name lights up.
Keyboard, once the deck has focus: <kbd>Space</kbd>/<kbd>K</kbd> play/pause,
<kbd>←</kbd>/<kbd>→</kbd> previous/next, <kbd>3</kbd>/<kbd>4</kbd> speed,
<kbd>M</kbd> mute.

## Usage

```tsx
import ConstellationTurntable from "@/components/ui/constellation-turntable"

<ConstellationTurntable />                          // the print: six constellations, side A
<ConstellationTurntable framing="full" defaultRpm={45} />
<ConstellationTurntable
  title="Side B"
  subtitle="Winter Sky"
  tracks={[
    { title: "Orion", duration: 236, angle: -140, root: 98 },
    { title: "Cassiopeia", duration: 198, angle: -40 },
    { title: "Lyra", duration: 174, figure: [[[-1, 0], [0, 0.6], [1, 0], [0, -0.6], [-1, 0]]] },
  ]}
  palette={{ vinyl: "#6b1d2a", groove: "#a13a4a", background: "#140d10" }}
  onTrackChange={(i, t) => console.log("now playing", t.title)}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `tracks` | the print's six | Outermost groove first. Up to about eight read well. |
| `palette` | deep blue | `background` `vinyl` `deadWax` `groove` `label` `labelInk` `star` `planet` `planetInk` `arm` `armShade` `accent` `screw`. Any subset. |
| `title` / `subtitle` | `"Side A"` / `"Music of the Spheres"` | Curved around the label, and shown in the player. |
| `framing` | `"poster"` | `poster` crops like the print: the record bleeds off the top-left and the arm drops in from above. `full` shows the whole deck, pivot, counterweight and cue lever. |
| `defaultRpm` | `33` | `33` or `45`. |
| `autoPlay` | `false` | Spins on mount. Sound waits for the first tap or key, as browsers require. |
| `sound` / `volume` | `true` / `0.7` | `sound={false}` never creates an audio context. |
| `density` / `seed` | `1` / `7` | Star count multiplier (0–3) and the sky's seed. Same seed, same sky, so server and client render match. |
| `planets` | `true` | The planet spiral. |
| `controls` | `true` | The player panel. Keyboard and the record still work without it. |
| `height` | `"100svh"` | **Must be a definite length.** |
| `onTrackChange` | — | `(index, track) => void` |
| `onPlayingChange` | — | `(playing) => void` |

A `ConstellationTrack` is `{ title, duration?, angle?, figureAngle?, figure?, root? }`:

- `duration`: seconds, default 210. The groove pitch is constant, so a track's
  band is as wide as it is long.
- `angle`: where the name sits, in degrees (0 is three o'clock, clockwise).
  Names in the lower half are set to read the other way round, as on a real
  label. Keep custom angles clear of the planet spiral (roughly 55°–150°).
- `figure`: polylines in a −1..1 box, x along the groove and y outward. Leave
  it out and a figure is drawn from the title. `figureAngle` places it.
- `root`: the root note of that track's score in Hz. Tracks alternate minor
  and major.

## How it's built

- **The arm is real geometry.** It's drawn once in the print's pose and turned
  about its pivot. The angle for any groove radius is solved exactly (law of
  cosines), so the stylus sits on the groove that's playing.
- **The side is a spiral timeline**: lead-in, tracks with silent gaps between,
  lead-out. Radius and time map both ways, which is how dropping the arm finds
  the second you dropped it on, and how the needle walks inward as it plays.
- **The platter has inertia.** The motor pulls it to speed, friction lets it
  go, and the playhead advances by platter speed. That's why spin-up, coast-down
  and scratching all bend the pitch.
- **Cheap to spin.** The pressed sky (about 1,200 stars) is one static SVG on a
  composited layer that only gets a CSS rotation each frame. The reflection
  doesn't rotate, so the sky turns under the light.

## Notes

- `prefers-reduced-motion` stops the platter turning on its own and the stars
  twinkling. Playing, dragging and scratching still work.
- On touch, a vertical swipe over the record scrolls the page and a sideways
  drag scratches.
- The player moves to fit the box: a side panel when there's room right of the
  deck, under the deck in tall boxes, otherwise a slim bar.
- Audio pauses when the tab is hidden. Every observer, listener, frame and
  audio context is released on unmount.
