# Darwaza Preloader

A loading screen in the manner of a Jaipur doorway. A pink-washed wall, a
cusped Mughal arch framed in steel blue and white plaster, and a pair of rose
timber doors studded with brass.

## Storyboard

1. **Bare plaster.** The doorway starts unpainted: raw plaster, raw wood, the
   monogram settling in above it.
2. **The paint rises.** Progress is a wet edge climbing from the floor to the
   top of the frame. The blue climbs the frame, the doors turn rose, and each
   row of brass studs pops in as the paint passes it. The plaster leaves, vines
   and crest bloom out of the wall the moment the paint reaches them.
3. **Pesh karte hain.** At 100 the title cascades letter by letter along the
   arch. Two hands rise from the bottom corners, one in a sheer dupatta and
   red-and-gold bangles, one in an embroidered sleeve and gold bangles. Each
   holds a ring.
4. **The rings.** The hands lift, press, and the bangles slide down the wrist.
   The rings click onto the door plates with a glint, and the hands withdraw.
5. **The doors open.** Both leaves swing inward in real 3D, light spills
   through, and the camera pushes through the doorway onto your page.

**No dependencies.** React is the only import. SVG for the wall, the frame and
the hands, DOM for the doors. Nothing is fetched.

```tsx
import DarwazaPreloader from "@/components/ui/darwaza-preloader"

<DarwazaPreloader loop />                                         // showcase

<DarwazaPreloader progress={loaded} onComplete={() => setReady(true)}>
  <YourPortfolio />
</DarwazaPreloader>

<DarwazaPreloader preset="neel" monogram="ns" title="Aaiye Tashreef Laiye" />
```

Click or press Enter while the paint is rising to rush it to 100.

## Props

| Prop | Default | |
|---|---|---|
| `children` | — | The page behind the doors. It is mounted from the start, and flows normally once the gate is gone. Ignored while `loop` is set. |
| `loop` | `false` | Showcase mode: replays forever. |
| `progress` | — | Real progress, 0–100. Leave it out to simulate over `durationMs`. |
| `durationMs` | `5600` | Length of the simulated load. |
| `preset` | `"gulabi"` | `gulabi` (Jaipur pink and blue) · `neel` (indigo wall, turquoise frame, mustard doors) · `haldi` (turmeric wall, green frame, rose doors) |
| `palette` | — | Override any of `wall`, `frame`, `plaster`, `door`, `brass`, `ink`, `skin`, `sleeveLeft`, `sleeveRight`, `banglesLeft`, `banglesRight`. |
| `title` | `"Pesh Karte Hain"` | The line arched over the doors. Long lines shrink to fit the curve. |
| `monogram` | `"etc"` | Three letters work best. The middle one is set large. |
| `logo` | — | Your own node in place of the monogram. |
| `meta` | `"Portfolio · 2026"` | Top-left line. |
| `message` | `"Khush aamdeed."` | Seen through the open doors when there are no children. |
| `hands` | `true` | The hands and the ring hand-off. When off, the rings simply appear. |
| `hud` | `true` | The top-left line and the counter. |
| `label` | `"Loading"` | Accessible name of the progress bar. |
| `displayFamily` / `monoFamily` | Yatra One / JetBrains Mono → system serif and mono | Faces for the title and the corner type. Load Yatra One yourself for the poster look. |
| `height` | `100svh` | A definite length. |
| `onComplete` | — | Fired once, after the camera has passed through the doorway. |

## Notes

- **Timing.** The load takes as long as your page does. After 100 the
  presentation runs for about 7.5 seconds, or 3 seconds without the hands.
- **Performance.** Paint progress moves one clip path per frame and flips
  data attributes on the reliefs and studs as the edge passes. Every other
  motion is a CSS transition or keyframe.
- **Accessibility.** The gate is a focusable `progressbar` with its value.
  Enter and Space rush it, and the title is announced once it is ready.
- **Reduced motion.** The paint follows the load directly, the hands are
  skipped, and the doors fade instead of swinging.
