# Title Sequence Preloader

A page gate cut like the opening titles of a design conference. While your page
loads, a monochrome reel plays shot after shot, and every shot credits your
people on leader lines, each in its own typographic voice. When the load hits
100, a rocket lifts off through the clouds. The clouds rise over the lens, then
part on your page.

**No dependencies.** React is the only import. Every picture is drawn live by
one inline WebGL2 fragment shader: raymarched solids, value-noise fog,
volumetric light and a two-ink grade. There are no images, fonts, videos or
3D files to fetch. The callouts, HUD and type are DOM and SVG over the canvas,
so they stay crisp at any resolution.

```
shot            picture                                             credits look
--------------  --------------------------------------------------  -------------------------------
beams           a dark room; light fans through a window onto a     accent + white caps, stacked
                monitor with a red tally, dust in the shafts
monolith        a faceted polyhedron turning under a lamp, in fog,  small tracked caps; laser lines
                with a volumetric cone and a pool of light
debris          an explosion held still round an eye that follows   tags: yellow, white, plate, red
                the pointer
target          a reticle locking on in lit fog                     navy plates: GIVEN Family (italic)
tunnel          a kaleidoscope tunnel of blocks, flying at a light  navy plates on a rail
constellation   a night sky; a date strung between two names        spaced mono with double rings
moon            an astronomer with a telescope on a moon's horizon  accent + white caps
eclipse         a dark planet with a lashed corona; its sun         caps on a tick ruler
                follows the pointer
finale          lift-off through a cloud bank     TITLE ←  ·  → LOCATION, then the clouds part
```

## Usage

```tsx
import TitleSequencePreloader from "@/components/ui/title-sequence-preloader"

// Built-in timed loader (16s), then the page
<TitleSequencePreloader>
  <YourPage />
</TitleSequencePreloader>

// Your crew, your event, your inks, paced by a real loader
<TitleSequencePreloader
  progress={loaded}                       // 0..100 from your asset loader
  credits={[{ name: "Mira Castellanos", role: "Vocals" }, "Tobias Rehn", ...]}
  title="NIGHT SHIFT"
  location="LISBON"
  date="14.11.2026"
  shots={["moon", "target", "eclipse", "tunnel", "constellation", "monolith"]}
  accent="#ffb86b"
  plate="#5c1d12"
  tint="#f7e8d4"
  onComplete={() => {}}
>
  <YourPage />
</TitleSequencePreloader>

// The reel on its own, forever
<TitleSequencePreloader loop />
```

Give it a parent with a width (see `demo.tsx`). While the gate is up, the root
is exactly `height` tall. Once the clouds part, it grows to fit `children`.

## Interaction

| Input | Does |
|---|---|
| Move the pointer | The camera drifts. The eye in `debris` watches the pointer, the sun in `eclipse` follows it, and the reticle in `target` locks towards it. |
| Hover a credit | Holds the shot and highlights that credit. With the built-in loader, the load waits too. |
| Tap / click | Cuts to the next shot, with a flash. |
| Press and hold | Fast-forwards ×4, with tape tracking lines. |
| `→` / `Space`, `←` | Cut forward and back (the stage must have focus). |
| `Enter` / `Esc`, **Skip** | Goes to the lift-off. With a real loader that has not finished, it waits and shows "Skip when ready". Pressed during the lift-off, it reveals the page. |

## Props

| Prop | Default | Notes |
|---|---|---|
| `credits` | 24 invented names with roles | Strings or `{ name, role }`. The first word is set as the given name. With more names than slots (29 across all shots), each pass of the reel moves on to the next names. |
| `title` | `"STUDIO.2026"` | Finale, left of the rocket, and the top bar. |
| `location` | `"LOW ORBIT"` | Finale, right of the rocket. |
| `date` | today, `DD.MM.YYYY` | The `constellation` shot. |
| `shots` | all eight | Any order. Repeats are allowed and unknown ids are ignored. |
| `progress` | none | 0 to 100. When set, the reel loops until it reaches 100, then lifts off. When left out, the built-in loader runs. |
| `durationMs` | `16000` | Length of the built-in loader. The reel is paced so that the last shot ends at 100. |
| `shotMs` | `2200` | Length of one shot when `progress` drives the gate. |
| `loop` | `false` | Never lift. `children` are not rendered and `onComplete` never fires. |
| `speed` | `1` | Multiplies every clock. |
| `accent` | `#7fe0ee` | Given names, the date, the counter's `%`, the active reel segment. |
| `hot` | `#ff4d6d` | The monitor's tally light, the top-bar mark, one debris tag. |
| `marker` | `#f3e37c` | The yellow debris tag. |
| `plate` | `#1b2a7a` | The box behind boxed credits. |
| `tint` / `shade` | `#eef3f6` / `#050608` | Highlight and shadow inks of the grade. The whole picture is mapped between them. |
| `grain` | `0.5` | Film grain and gate scratches, from 0 to 1. |
| `interactive` | `true` | Pointer drift, tap, hold and keys. |
| `skipLabel` | `"Skip"` | Empty hides the button. |
| `hint` | `"Hold to fast-forward · tap to cut"` | Bottom bar. Empty hides it. |
| `height` | `"100svh"` | The stage. **Must be a definite length.** |
| `onShotChange` | none | `(index, shot)` on every cut. |
| `onComplete` | none | Once the clouds have cleared. |
| `className`, `children` | | `children` is the page behind the gate. |

`SHOTS`, `advance`, `skip`, `cut`, `distribute`, `simulatedProgress`,
`layoutCallout`, `estimateLabel`, `scramble`, `leet`, `timecode`, `formatDate`,
`splitCredit`, `shotList` and `hexToRgb` are exported. The sequencing is a pure
reducer, so you can drive or test it outside React.

## Notes

- **One shader, nine scenes.** `uScene` picks the scene, and since it is a
  uniform, every pixel takes the same branch. The monolith, debris and tunnel
  are raymarched. The monolith is a dodecahedron and an icosahedron
  intersected as planes, with soft shadows and a volumetric lamp cone. The
  debris is 14 tumbling boxes round a sphere. The tunnel is a mirrored polar
  repetition of blocks. The rest are 2D fields: domain-warped fog, a cratered
  moon, a filamented corona, and cumulus tops built from overlapping circles.
- **The reveal is a real hole.** The context is `alpha: true,
  premultipliedAlpha: false`, and `children` render underneath. During the
  reveal the clouds rise over the frame, then the shader cuts alpha along a
  noise threshold with a bright rim. Your page shows through the clouds as
  they part.
- **The compile does not block.** The shader is large. It is linked with no
  status read-back, and with `KHR_parallel_shader_compile` it is polled
  until ready, so the callouts and the counter keep moving while the driver
  works.
- **Resolution adapts.** The picture renders below device pixels (at most
  1.5× DPR × 0.8, and at most 1.1M pixels) and steps down further if frames
  run over 24ms. Grain hides it. The type never scales, because it is not in
  the canvas.
- **Callouts are laid out, not placed.** Each slot names a point on the
  picture, in the same units the shader draws in, plus a label position for
  landscape and one for portrait. `layoutCallout` keeps every label inside
  the stage and between the letterbox bars. The test checks this on six
  screen shapes.
- **The figure on the moon is SVG,** so the silhouette stays sharp at any
  render scale. The shader's ground moves with the same parallax as the
  overlay (`uPx`), so the figure stays planted.
- The loop pauses drawing while the stage is off screen or the tab is hidden.
  GL resources are released on unmount, and a lost context falls back to CSS
  gradients. The callouts, the counter and the finale still work without
  WebGL.
- **Reduced motion:** every shot is a still frame and the pointer drift
  stops. The type appears without scrambling, the leader lines appear without
  drawing on, and the reveal is a plain fade.
- **Accessibility:** the counter is a `progressbar` and the full credit list
  is in an `sr-only` list. The stage is focusable with its keys in its label,
  and Skip is a real button. The page underneath is `inert` until the clouds
  part.
- It paints its own black, so it looks the same in light and dark themes.
  Only `children` follow the theme.

## Credit

The art direction is a homage to the monochrome, callout-driven opening
titles of motion-design conferences: volumetric light, leader lines naming
speakers, mixed type on navy plates, and a launch at the end. The scenes,
figures, geometry, names and code are all original and procedural. The
default credits are invented. No real names, logos, footage or event branding
are used.
