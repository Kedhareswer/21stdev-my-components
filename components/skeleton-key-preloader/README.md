# Skeleton Key Preloader

A loading gate for a portfolio, set up as Kedhar's own. While the page loads,
a typographic collage puts itself together, with a line about who's behind
it, and a gilded skeleton key unlocks it at 100.

## The storyboard

| Load | What happens |
|---|---|
| 0–40% | `welcome to my` types in. The first letter of the word prints pixel by pixel from a faint dot grid, top to bottom, like a print head. |
| 6% | The key drops in on a spring and settles diagonally across the collage, bobbing a little. |
| 6–96% | The dial around the monogram draws itself. It is the progress ring. |
| 14–76% | The superscript ring draws, the monogram is outlined stroke by stroke, the `#tag` pill drops in while its ink swoosh brushes out behind it, the script half of the word writes itself left to right, the ink stroke pours in with a clock that winds to the visitor's local time, the about lines type out with a blinking caret, and the signature scrambles into place. |
| 0 → 100 | The handwritten version counts `0.0 → 0.9`. |
| 100 | The version flips to the release and gets circled. Everything else dims. The monogram melts into a keyhole and the dial grows ticks. |
| unlock | The key swings upright over the keyhole and slides in. It turns a quarter turn (in 3D, so the bow goes edge-on), the dial clicks round 90° and the collage shakes. The camera then dives through the keyhole onto the page underneath. In `loop` it lands on an end card with your name in script and the about line. |

**Interactive.** You can grab the key and throw it around while the page loads.
It tilts with your speed and springs back when you let go, and a tap makes it
jingle. Your pointer is the light source on the metal, so the highlight follows
you across the bow and shaft. The layers drift in parallax. Hover the pixels and
they catch the key's colour. Tap the pill to cycle through the tags, and hover the
clock to spin its minute hand.

**`unlock="key"`.** The gate holds at 100 until the visitor drops the key into
the lock, clicks it, presses Enter, or uses the "Turn the key" button.

**No dependencies.** React is the only import. The key, the swooshes, the dial
and the clock are SVG drawn in the file. The metal is lit by an SVG
specular-lighting filter, not an image. The styles are one scoped `<style>`.
The faces (Space Grotesk, Fleur De Leah, Caveat, Space Mono) come in through an
injected Google Fonts `<link>`. Pass `fontHref={null}` to load nothing and use
the system fallbacks. The collage waits for the faces to land, for at most 1.6s.

```tsx
import SkeletonKeyPreloader from "@/components/ui/skeleton-key-preloader"

<SkeletonKeyPreloader loop />                                   // showcase, runs forever

<SkeletonKeyPreloader progress={loaded} onComplete={() => setReady(true)}>
  <YourPortfolio />
</SkeletonKeyPreloader>

<SkeletonKeyPreloader
  unlock="key"
  name="Your Name"
  signature="yourname"
  tags={["#you", "#design"]}
  about={["product designer", "in love with", "small details."]}
  links={["you.dev", "@you"]}
  metal="silver"
  paper="#0e0e0f"
  ink="#f1eee8"
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `children` | — | Revealed through the keyhole. Ignored while `loop` is set. |
| `loop` | `false` | Showcase mode: unlocks onto a signature panel, then starts over. |
| `progress` | — | Real progress, 0–100. Leave it out to simulate over `durationMs`. |
| `durationMs` | `6200` | Length of the simulated load. |
| `unlock` | `"auto"` | `"auto"` turns the key by itself. `"key"` waits for the visitor. |
| `greeting` | `"welcome to my"` | The small line over the wordmark. |
| `word` | `"portfolio"` | Cut four ways: the first letter in pixels, the second as a superscript (an `o` becomes a ring), the next two in the dial, the rest in script. |
| `tags` | `#kedhar`, `#design`, `#motion`, `#code` | Pill tags. Tap to cycle. |
| `name` | `"Kedhareswer Naidu"` | The end card (first name, in script) and the accessible label. |
| `aboutLabel` | `"about/"` | The light prefix on the about block. Empty string drops it. |
| `about` | design engineer / building interfaces / that move. | Short lines typed out beside the script, and joined on the end card. |
| `links` | `21st.dev/@kedhareswer`, `kedhar.vercel.app` | Along the bottom edge (hidden under 640px wide). |
| `signature` | `"kedhareswer"` | Letter-spaced along the bottom. |
| `release` | `"1.0"` | What the version lands on at 100. |
| `metal` | `"gold"` | `"gold"`, `"silver"`, `"rose"` or `"bronze"`. |
| `paper` / `ink` | `#fbfaf7` / `#0d0d0d` | The two colours of the whole collage. |
| `hud` | `true` | The status, the "grab the key" hint and your links along the bottom edge. |
| `fontHref` | Google Fonts URL | Stylesheet for the faces. `null` loads nothing. |
| `height` | `100svh` | A definite length, never a percentage. |
| `onComplete` | — | Fired once, after the camera has gone through the keyhole. |

## Notes

- **It never rushes.** Even when a real `progress` jumps straight to 100, the
  count climbs for at least 2.8s, so every piece still gets its entrance.
- **The bitmap letter** comes from a built-in 5 × 7 font (A–Z, 0–9), set bold.
  Any other character prints as a solid block.
- **The dive is a camera, not a mask.** The paper is one SVG path with the
  keyhole cut out of it, and the same camera that fits the collage to the
  screen zooms in until the keyhole's round covers every corner. It stays sharp
  at any size.
- **Accessibility.** The gate is a `progressbar` with its value. "Unlocked" is
  announced politely. In `unlock="key"` mode the gate takes focus, Enter
  unlocks it, and a real button is there too. The collage is decorative and
  hidden from assistive tech.
- **Reduced motion.** Pieces fade in without travel. The key does not fall,
  drift or drag, the parallax is off, and the unlock is a crossfade instead of
  the insert, turn and dive.
