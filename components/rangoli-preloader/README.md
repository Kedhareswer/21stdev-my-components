# Rangoli Preloader

A loading screen drawn in coloured powder on a red-oxide floor. As your page
loads, a rangoli pours itself from the centre outward, every fold at once: a
turmeric core, two rings of lotus petals, rice-flour kolam dots, marigold
petals with green leaves between them, an indigo band with a zigzag, scallops
and a crown of flame spikes. Every mark is thousands of jittered grains, so it
reads as powder, not vector.

At 100 the pattern holds for a beat. Then a gust sweeps across the floor, lifts
every grain into the air, and a short greeting appears on the clean floor
before the gate opens onto your page.

**No dependencies.** React is the only import. A 2D canvas for the floor and
the grains, nothing fetched.

```tsx
import RangoliPreloader from "@/components/ui/rangoli-preloader"

<RangoliPreloader loop />                                         // showcase

<RangoliPreloader progress={loaded} onComplete={() => setReady(true)}>
  <YourPage />
</RangoliPreloader>

<RangoliPreloader preset="slate" folds={12} meta="Pongal · 2027" blessing="நல்வரவு" message="Welcome in." />
```

Click while it draws to rush it to 100. In `loop` mode, click the greeting to
replay.

## Props

| Prop | Default | |
|---|---|---|
| `children` | — | Revealed once the gate opens. Ignored while `loop` is set. |
| `loop` | `false` | Showcase mode: replays forever. |
| `progress` | — | Real progress, 0–100. Leave it out to simulate over `durationMs`. |
| `durationMs` | `6200` | Length of the simulated load. |
| `preset` | `"oxide"` | `oxide` (red-oxide floor) · `slate` (dark stone) · `marble` (pale floor, dark rice line) |
| `palette` | — | Override any of `floor`, `rice`, `vermilion`, `marigold`, `turmeric`, `magenta`, `indigo`, `leaf`. |
| `folds` | `8` | Symmetry of the pattern: `6`, `8` or `12`. |
| `seed` | `7` | Reshuffles the grains. |
| `meta` | `"Deepavali · 2026"` | Top-right line. |
| `blessing` | `"शुभ आरंभ"` | Small line above the greeting. `""` hides it. |
| `message` | `"Welcome home."` | The greeting on the clean floor. `""` skips it. |
| `hud` | `true` | The top-right line and the percentage counter. |
| `label` | `"Loading"` | Accessible name of the progress bar. |
| `serifFamily` / `monoFamily` | Instrument Serif / JetBrains Mono → system | Faces for the greeting and the corner type. |
| `height` | `100svh` | A definite length. |
| `onComplete` | — | Fired once, after the gate has opened. |

## Notes

- **Performance.** Grains are poured onto an offscreen canvas once and never
  redrawn while loading; only the gust animates them. The count scales with the
  screen and is capped, so phones stay smooth.
- **Scripts.** The blessing line uses the system's Devanagari or Tamil face
  (Nirmala UI on Windows, Kohinoor or Tamil Sangam on Apple devices).
- **Accessibility.** The gate is a focusable `progressbar` with its value.
  Enter and Space rush or replay it, and the greeting is announced.
- **Reduced motion.** The pattern appears as the load arrives, and the gate
  opens with a fade instead of the gust.
