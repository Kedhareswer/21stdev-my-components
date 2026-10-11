# Breath Bloom

Six luminous petals orbiting one centre, breathing on a slow eased loop —
**in, hold, out** — with a quiet cue in the middle. Built as a **background**:
drop content in as children and it sits on top.

Take over with the pointer: **sideways spreads the petals, down grows them**.
Let go and the bloom eases back into its breath without a jump. Click to **pin**
the shape you made; click again (or Esc) to let it breathe. Focus it and the
arrow keys tune a pinned shape.

**No dependencies.** React is the only import — no CSS file, no `@property`
registration, no images. Each petal is a div with a radial gradient; overlaps
use `mix-blend-mode: lighten`, so they merge into one glowing flower.

## Usage

```tsx
import BreathBloom from "@/components/ui/breath-bloom"

<BreathBloom />                                       // full-bleed, abyss blue
<BreathBloom preset="ember" height="520px" />
<BreathBloom params={{ petals: 8, spin: 6, duration: 5 }} />
<BreathBloom guide={["Inhale", "Stay", "Exhale"]} hint={false} />

<BreathBloom onPinChange={(pose) => console.log(pose)}>
  <h1 className="p-10 text-5xl text-white">Slow down.</h1>
  <button className="pointer-events-auto">Begin</button>
</BreathBloom>
```

Children sit in a `pointer-events-none` layer so the pointer still reaches the
bloom; give interactive elements `pointer-events-auto`. Clicks on links,
buttons and form controls never pin.

## Props

| Prop | Default | Notes |
|---|---|---|
| `height` | `"100svh"` | **Must be a definite length.** The bloom centres in this box. |
| `preset` | `"abyss"` | `abyss` \| `ember` \| `aurora` \| `orchid` \| `solstice` \| `graphite`. |
| `params` | — | `Partial<BloomParams>` over the preset. Live — never restarts the loop. |
| `interactive` | `true` | Pointer shaping, click-to-pin, keyboard. |
| `touch` | `"scroll"` | `scroll` keeps the page scrollable (a tap pins); `draw` lets a drag shape it. |
| `guide` | `true` | Centre cue. `false`, or three words of your own. |
| `hint` | `true` | Bottom instruction line. `false`, or your own string. |
| `onPinChange` | — | `(pose \| null) => void` — `{ amplitude, scale }` in petal units. |
| `label` | `"Breathing bloom"` | Accessible name. |
| `children`, `className` | — | Content over the bloom; classes appended to the root. |

## Customising

`BLOOM_DEFAULTS` and `BLOOM_PRESETS` are exported.

| Param | What it does |
|---|---|
| `petals` | How many (1–24). |
| `size` | Petal diameter in px, or `"auto"` (≈13% of the box's short side). |
| `offset`, `tilt`, `spin` | Ring rotation, per-petal turn (where the dark edge points), slow orbit in °/s. |
| `duration`, `easing`, `keyframes` | The breath: seconds per pass (it plays there and back), a CSS-style cubic-bezier applied per segment, and `{ at, amplitude, scale }` stops. |
| `pointerAmplitude`, `pointerScale` | What the pointer maps to at the box edges. |
| `follow` | How quickly the bloom chases its target (per second). |
| `stops`, `focus`, `blend` | Three gradient stops, where they start inside a petal, and the blend mode. `solstice` uses `multiply` on paper. |
| `background`, `glow`, `glowColor`, `ink` | Box colour, halo strength and colour, text colour. |

The defaults reproduce the reference CSS exactly: `4.01s`,
`cubic-bezier(0.8, 0, 0.2, 1)`, `alternate`, amplitude 150 → 100 → 150px and
scale 1 → 3 → 3 at a 100px petal.

## Notes

- `prefers-reduced-motion`: the breath and spin stop on the held pose and the
  cue hides. Pointer and keyboard shaping still work.
- Pauses when scrolled off-screen or the tab is hidden.
- Sizes from its own box, not the window; pointer coordinates come from the
  component's rect, so it behaves the same in a card as full-bleed.
- Petals are not `will-change` layers on purpose — a promoted layer is
  rasterised at 1× and magnified, which frays the edge at 8×.
