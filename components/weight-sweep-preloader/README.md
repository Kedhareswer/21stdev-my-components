# Weight Sweep Preloader

A type-specimen loading gate. The whole page is one giant counter set in a
variable grotesk, and as the load climbs from `000` to `100` the numerals
thicken from hairline to black. The weight axis is the progress bar. A specimen
HUD reads out the live weight, a tick rail fills under the top rule, and at 100
an ink panel rises over the sheet with one line of italic serif before the gate
lifts off your page.

**No dependencies.** React is the only import. No canvas, no fonts fetched, no
CSS file. The faces come from your page or the fallback stacks.

```tsx
import WeightSweepPreloader from "@/components/ui/weight-sweep-preloader"

<WeightSweepPreloader loop />                                  // showcase, runs forever

<WeightSweepPreloader progress={loaded} onComplete={() => setReady(true)}>
  <YourPage />
</WeightSweepPreloader>

<WeightSweepPreloader preset="ink" weights={[200, 900]} message="Welcome in." />
```

## Props

| Prop | Default | |
|---|---|---|
| `children` | — | Revealed once the gate lifts. Ignored while `loop` is set. |
| `loop` | `false` | Showcase mode: replays forever, click the panel to replay sooner. |
| `progress` | — | Real progress, 0–100. Leave it out to simulate over `durationMs`. |
| `durationMs` | `3600` | Length of the simulated load. |
| `preset` | `"paper"` | `paper` · `ink` · `vermilion` · `bone` |
| `palette` | — | `{ paper, ink }` overrides. |
| `weights` | `[100, 900]` | Lightest and heaviest weight of the sweep. |
| `label` / `caption` | `"Specimen Nº 07"` / `"Loading assets"` | The HUD lines. |
| `message` | `"Set in motion."` | The italic line on the closing panel. `""` skips the panel. |
| `hud` | `true` | Corner type, the rule, the rail and the live weight readout. |
| `fontFamily` | Inter Tight → system variable faces | Face for the numerals. |
| `serifFamily` / `monoFamily` | Instrument Serif / JetBrains Mono → system | Faces for the closing line and the HUD. |
| `height` | `100svh` | A definite length. |
| `onComplete` | — | Fired once, after the gate has lifted. |

## Notes

- **The sweep needs a variable font** to move smoothly. Inter Tight, Inter,
  Segoe UI Variable and SF Pro all have a weight axis. A static font still
  works, but it steps between the weights it ships.
- **Accessibility.** The gate is a `progressbar` with its value, and the closing
  line is announced politely.
- **Reduced motion.** The count still climbs, but the panel and its line appear
  without sliding.
