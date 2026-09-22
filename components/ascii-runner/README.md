# ASCII Runner

A side-scrolling endless runner drawn entirely in monospace characters. A bunny
runs, jumps and ducks past blocks of `@` while the ground scrolls beneath it.
Space or click to jump, shift to duck, hold for a full jump and tap for a hop.

```tsx
import AsciiRunner from "@/components/ui/ascii-runner"

<AsciiRunner onGameOver={(score) => console.log(score)} />
```

**No dependencies beyond React, and no network requests.** Everything is
`fillText` on a 2D canvas — no sprite sheet, no font file, no images.

## It inverts with the page

The canvas paints **no background**. It clears, so the frame's surface shows
through, and the ink is read off `--color-foreground` /
`--color-muted-foreground` at runtime.

Painting its own `#FFFFFF` — which is what it did first — punches a white slab
into a dark page. Every other check passes and the component still looks
perfect in the workshop's light mode, so this is the kind of thing you only
catch by loading `?dark` and looking.

Tokens can't reach a canvas directly, so a hidden probe span resolves them:

```tsx
probe.style.color = fallback                          // known-good baseline
probe.style.color = "var(--color-foreground, " + fallback + ")"
return getComputedStyle(probe).color                  // always an rgb()
```

Assigning the fallback first is what makes it safe: if a host defines the token
as something a canvas can't parse, the second assignment is dropped and the
readback is the fallback rather than whatever was set last.

A theme flip is a class swap on `<html>`, not a media query, so a
`MutationObserver` on `class` / `style` / `data-theme` covers the Tailwind and
shadcn toggles that `prefers-color-scheme` misses. It repaints once on change —
necessary, because the loop is idle on the ready and game-over screens.

## Props

| Prop | Default | Description |
|---|---|---|
| `caption` | `"space jump · shift duck"` | Left side of the footer bar. `""` drops the whole bar. |
| `onGameOver` | — | `(score: number) => void`, fired when a run ends |
| `className` | `""` | Extra root class names |

## Controls

| | |
|---|---|
| Jump | `Space`, `↑`, or click / tap |
| Hop | tap and release — releasing early cuts the jump short |
| Duck | `Shift`, `↓`, or drag downward on touch |
| Retry | `Space` after a crash (400ms guard, so the fatal press does not restart) |

## Keys are bound to the canvas, not to window

This is the part worth knowing before you install it.

Listening on `window` and calling `preventDefault` on Space and the arrow keys
means that from the moment the component mounts, **the visitor cannot scroll
the host page** — the game silently eats the keys wherever they are on the
page. The canvas is focusable instead (`tabIndex={0}`), and the handlers live
on it, so `preventDefault` only applies while the game actually has focus.

Verified: with the game unfocused, pressing Space scrolls the page normally
(`scrollY` 0 → 612). Clicking the canvas gives it focus and the keys take
effect.

## The loop stops when nothing is moving

A run needs every frame. The ready screen only needs them for the bunny's
blink, and the game-over screen is completely static — looping through those
burns a core redrawing identical pixels.

Measured rAF per second:

| | normal | `prefers-reduced-motion` |
|---|---|---|
| ready | 146 | 0 |
| game over | 0 | 0 |

Under reduced motion the idle blink is dropped, so both idle states are still.
The run itself still animates: it is motion the player asked for by pressing a
key, and a runner that does not run is not a runner.

## Collision

Each sprite's box is the glyph block inset on every side, because monospace
glyphs never fill their cells and a tight box makes near-misses read as unfair
hits. The bunny is inset slightly further than obstacles, which biases every
marginal call in the player's favour.

`hit`, `boxOf`, `scoreOf` and `hash` are exported and covered by
`tests/ascii-runner.test.mjs`, which checks that touching edges are not a hit,
that collision is symmetric, and — the one that matters — that a 60px jump
actually clears a ground obstacle. A runner where the jump does not clear is
unplayable, and nothing else in the file would catch that.

## Layout

One framed object, not three loose pieces. The canvas and a footer bar share a
bordered, rounded container; the caption used to be a `<p>` floating on the page
background below an unframed canvas, which left the component with no edges at
all — on a light page it read as a hairline and some specks in empty space.

Inside the canvas:

- The HUD lays out from the right edge off the **measured** width of the score,
  so a six-digit run pushes `HI` left instead of colliding with it. It was two
  hard-coded offsets that happened not to overlap at five digits.
- Prompt copy sits just above the bunny's head rather than mid-sky, so the eye
  reads prompt and character as one thing.
- The ground row moved up 10px. The pebble band was landing in the last 4px of
  the canvas, reading as debris jammed against the footer rather than as ground.
- Clouds are seeded inside the frame. At the old spread one sat permanently
  sliced by the right edge on the ready screen, which looks like a bug.
- Copy follows the input: `press space to run` on a mouse, `tap to run` on
  `(pointer: coarse)`.

Focus is `:focus-visible` only, so clicking to play doesn't leave a ring. The
frame's border warms on hover — the cheapest signal that the thing is live —
gated behind `@media (hover: hover)` so a tap doesn't stick it on.

## Install safety

- The root is content-sized. It takes no percentage height, which would
  collapse to `0px` in a page with no `html, body { height: 100% }` chain.
- The canvas sets `maxWidth: "none"` and an `aspectRatio` rather than a fixed
  height, against Preflight.
- The `<style>` block is scoped to `.ascii-runner-*`, with no `@import` and no
  bare `*` / `body` / `:root` rule. The only tokens it touches are the five in
  `dev/styles.css`; the test enforces that.
- `touch-action: none` on the canvas, so dragging to duck does not scroll the
  page on mobile.
- Nothing is fetched. The component and its demo contain no URLs at all.
