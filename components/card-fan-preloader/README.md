# Card Fan Preloader

A pixel-perfect, zero-dependency loading sequence. Six playing cards fan continuously through an arched deal in a seamless 0.5s cycle, floating upward and fading away to reveal your page content.

```tsx
import CardFanPreloader from "@/components/ui/card-fan-preloader"

// As a page gate — floats out when loaded to reveal your app
<CardFanPreloader durationMs={2400} onComplete={() => console.log("unlocked")}>
  <YourPageContent />
</CardFanPreloader>

// As a continuous ambient loop
<CardFanPreloader loop />
```

**No dependencies beyond React.** Scoped CSS keyframes, zero animation runtime, and authentic inlined vector card graphics.

## Props

| Prop | Default | Description |
|---|---|---|
| `children` | — | Content revealed once the preloader completes and the gate lifts. |
| `loop` | `false` | Run continuously as an ambient loader showcase. `children` are never revealed. |
| `durationMs` | `2400` | Duration in milliseconds before the preloader lifts (when `loop` is false). |
| `speed` | `1` | Playback speed multiplier (e.g. `2` runs the cycle twice as fast). |
| `scale` | `1` | Scale factor for the 300px × 300px card stage. |
| `height` | `"100svh"` | Root container height (always a definite length, never `h-full`). |
| `cardFace` | — | Optional custom node rendered inside each card. Defaults to an elegant Ace of Spades vector playing card. |
| `onComplete` | — | Callback fired when the preloader exit transition finishes. |
| `className` | `""` | Extra CSS class names for the root container. |

## How it works

1. **The 6-Card Fan Geometry**:
   The preloader uses an arc of 6 layered cards (54px × 78px with 5px corner radius) distributed along a curved trajectory:
   - **Card 1**: Static base card at `translate3d(52px, 110px, 0) rotate(-16deg)`
   - **Card 2**: Slides from `(52px, 110px, -16deg)` to `(87px, 105px, -8deg)`
   - **Card 3**: Slides from `(87px, 105px, -8deg)` to `(122px, 100px, 0deg)`
   - **Card 4**: Slides from `(122px, 100px, 0deg)` to `(157px, 105px, 8deg)`
   - **Card 5**: Slides from `(157px, 105px, 8deg)` to `(192px, 110px, 16deg)`
   - **Card 6**: Static apex card at `translate3d(192px, 110px, 0) rotate(16deg)`

2. **Perpetual Deal Illusion**:
   Because cards 2 through 5 simultaneously move into the next card's coordinates over the exact same 0.5s duration, the animation forms an unbroken, infinite dealing cascade.

3. **Fluid Exit Lift**:
   When the loading threshold is met, the container smoothly lifts upward by 20px and fades out over 250ms (`cubic-bezier(0.16, 1, 0.3, 1)`), unmounting cleanly and smoothly revealing children.

4. **Self-Contained Vector Graphics**:
   The playing card face is inlined as a pure SVG vector element with zero external image requests, guaranteeing crisp typography on Retina displays and zero layout shifts.

5. **Accessibility**:
   Emits `role="status"`, `aria-label="Loading"`, and `aria-live="polite"`. Supports `prefers-reduced-motion: reduce` by settling cards into an elegant static fan.
