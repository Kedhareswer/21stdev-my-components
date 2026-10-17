# Animator Title Preloader

A loading screen for an animator's portfolio, staged as the title card of a
short film. The load bar is the production pipeline: **rough → ink → paint →
final**, and you watch your title go through it.

- **Rough.** A blue-pencil sketch of the title draws itself in as the page
  loads, guide lines first and then two loose passes per letter. A magenta
  ghost sits under it, slightly off register, like a cheap print.
- **Ink.** Each letter pops in as a cream outline, with squash and stretch.
- **Paint.** Each outline then fills from the bottom with a peach-to-white
  gradient. Most of the rough gets erased, the way an animator cleans up. The
  first letter and the last round ones keep their blue pencil.
- **Lettering.** "An Animation", "of" and your name are written stroke by
  stroke with a broad nib. The name gets a swash under it.
- **Hands.** Two painted hands in patterned sweaters reach in from the lower
  corners as the load climbs, and hold the word at its ends.
- **Boil.** Every hand-drawn line boils at 8fps, like drawn animation shot on
  twos. The hands' idle drift steps at 12fps.

At 100 the hands squeeze the word, then fling it back to the corners. An
**iris** closes on the little spectacled mascot, which winks, and the iris
reopens onto your page. In `loop` mode it reopens onto a fresh take.

**No dependencies.** React is the only import. The lettering uses the Hershey
script and sans single-stroke fonts (public domain, via the MIT `hersheytext`
data), packed inline into about 7 KB. Any ASCII text writes itself on, with
nothing fetched. Hands, mascot and trinkets are inline SVG, with grain from
SVG turbulence.

```tsx
import AnimatorTitlePreloader from "@/components/ui/animator-title-preloader"

<AnimatorTitlePreloader loop />                                      // showcase

<AnimatorTitlePreloader progress={loaded} onComplete={() => setReady(true)}>
  <YourPortfolio />
</AnimatorTitlePreloader>

<AnimatorTitlePreloader
  preset="dusk"
  kicker="Selected Works"
  title="Showreel"
  connector="by"
  name="Mira Okafor"
/>
```

Click or press Enter/Space while it loads to rush it to 100. Move the pointer
and the card leans, the hands follow, and the mascot's eyes track you.

## Props

| Prop | Default | |
|---|---|---|
| `children` | — | Revealed when the iris opens. Ignored while `loop` is set. |
| `loop` | `false` | Showcase mode: replays forever, each take opening through the iris. |
| `progress` | — | Real progress, 0–100. Leave it out to simulate over `durationMs`. |
| `durationMs` | `7000` | Length of the simulated load (quick start, two stalls, a sprint). |
| `kicker` | `"An Animation"` | Hand-lettered line above the title. `""` hides it. |
| `title` | `"Portfolio"` | The bold word. It shrinks to leave the hands room. |
| `connector` | `"of"` | Small line under the title. `""` hides it. |
| `name` | `"Kedhareswer"` | Written last, with a swash. `""` hides it. |
| `meta` | `"Showreel · 2026"` | Top-right HUD line. |
| `scene` | `"Sc. 01 — Title card"` | Top-left HUD line, like a slate. Hidden on phones. |
| `frames` | `120` | Length of the HUD frame counter (`Fr 0060 / 0120`). |
| `preset` | `"ember"` | `ember` (charcoal, crimson hands, cyan rough) · `dusk` (midnight, teal sweaters, yellow rough) · `paper` (animation paper, cobalt sweaters, ink-black title) |
| `palette` | — | Override any of `stage`, `ink`, `muted`, `rough`, `ghost`, `word0`–`word2`, `sleeve0`–`sleeve2`, `pattern`, `speck`, `skin0`–`skin2`, `nail`, `cuff`. |
| `hands` / `rough` / `mascot` / `hud` | `true` | Turn any layer off. With no mascot, the iris closes on the title. |
| `seed` | `11` | Reshuffles the hand wobble in the lettering and the rough. |
| `label` | `"Loading portfolio"` | Accessible name of the progress bar. |
| `displayFamily` | Inter Display → system | Face for the bold title. Heavy weights look best. |
| `monoFamily` | JetBrains Mono → system | Face for the HUD. |
| `height` | `100svh` | A definite length. |
| `onComplete` | — | Fired once, after the iris has opened. |

## Notes

- **Lettering.** The Hershey fonts cover printable ASCII. A line with any
  other character (for example `José`) falls back to the system's script face
  (Segoe Script, Bradley Hand, Snell Roundhand), which wipes on instead of
  writing.
- **Layout.** Everything scales from the title's size, which follows the
  stage through container query units. The title shrinks until about 60% of
  the width is left for the hands. On a portrait screen the arms rise more
  steeply and hold the word from below.
- **Performance.** Continuous motion (progress, rough, hands, pointer, iris)
  is written straight to the DOM from one rAF loop. React re-renders only on
  whole percents and phase changes. The painted hands sit on their own
  compositor layers and only move. Don't wrap the rough in a `<use>` clone:
  Chrome then re-filters the hands every frame.
- **Accessibility.** The gate is a focusable `progressbar` whose value text
  names the pipeline stage, e.g. "Paint, 64%". The full title is announced,
  and Enter or Space rushes the load.
- **Reduced motion.** No boil, grain drift, pops or swing. Lettering and
  letters appear as the load reaches them, the hands are simply there, and
  the gate fades instead of the iris.
