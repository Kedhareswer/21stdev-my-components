# Miss Minutes Clock

Miss Minutes, the TVA's cheerful rubber-hose clock from *Loki*, as an
interactive character. She stands on a glowing floor with her reflection under
her and reacts to what you do. She's not a chatbot: she's a clock with
opinions.

Everything is drawn in the one component file: the dial, the gloves, the shoes,
the reflection, the effects. There is no image, font file or icon set.

## Usage

```tsx
import MissMinutesClock from "@/components/ui/miss-minutes-clock"

<MissMinutesClock />                       // orange on black, like the hologram
<MissMinutesClock theme="peach" />         // blush-pink poster, orange boots
<MissMinutesClock theme="noir" />          // black & white "For All Time. Always."
<MissMinutesClock controls={false} height="520px" />   // just her, no button row
```

No npm dependencies beyond React, and no Tailwind utilities. Every rule is
scoped to `.rcc-*` inside the component's own `<style>`.

## Interactions

| You | She |
|---|---|
| Move the pointer | Her eyes follow it. Come close and her eyes widen and her brows lift |
| Hover over her | She blushes a little |
| Click / tap / Enter (poke) | Giggles and hops, then "Boop!", then winks, then plants her fists on her hips. By the fifth poke in a row she glitches red |
| Double-click | Dance break: she hops, arms up, sparkles |
| Scribble fast over her | Gets dizzy: spiral eyes, flailing arms, stars circling her head |
| **Hello** | Waves |
| **Time?** | Points a finger up and tells you the actual time |
| **Wink** | One eye shut, hand on hip (the peach poster pose) |
| **Yay!** | Both arms up, hopping (the hologram pose) |
| **Hmm** | Finger on her chin, looking up. The dial ticks light up round the face |
| **Aww** | Covers her cheeks, blushes, hearts float up |
| **Rude!** | Narrowed eyes, fists on hips, trembling, red glow and a glitch |
| **Nap** | Closes her eyes and sways, with z's floating up |
| Leave her alone | After ~14s she does a little idle antic. After `sleepSeconds` she dozes off. Move the pointer and she wakes with a start ("I was restin' my hands!") |

Every reaction comes with a line in a speech bubble. The bubble types out while
her mouth lip-syncs to the letters. She also idles, blinks (sometimes twice),
looks around when you're not pointing at anything, and flickers faintly like
a projection.

`prefers-reduced-motion`: the bobbing, hopping, wobble, wandering gaze,
blinking, typewriter and every CSS animation are turned off. Her poses and
expressions still change, and her eyes still follow the pointer.

## Props

| Prop | Default | What it does |
|---|---|---|
| `height` | `"100svh"` | Must be a definite length. |
| `minHeight` | `"480px"` | Floor for the height. |
| `theme` | `"midnight"` | `midnight` · `peach` · `noir`. |
| `name` / `org` / `emblem` / `motto` | `"Miss Minutes"` / `"Time Variance Authority"` / org initials / `"For All Time. Always."` | The persona and the poster text. |
| `petName` | `"sugar"` | What she calls you. |
| `lines` | — | Replace any of her lines: `greet` `wave` `time` `wink` `happy` `think` `shy` `stern` `sleepy` `poke` `wake` `dizzy` `dance` `antic`. `{name}` `{org}` `{user}` `{User}` `{time}` are filled in. |
| `controls` | `true` | The reaction buttons along the bottom. |
| `greet` | `true` | Wave and say hello on mount. |
| `sleepSeconds` | `45` | Idle time before she naps. |
| `reflection` | `true` | The mirrored floor. |
| `hologram` | on except `peach` | Scanlines and a faint flicker. |
| `onReact` | — | `(mood, cause) => void`, fired on every mood change. Use it to hook sounds or analytics. |
| `face` `ink` `glove` `shoe` `glow` `accent` `background` | from theme | Colour overrides. The shading and the disc edge are mixed from `face` with `color-mix()`, so any colour still looks round. |
| `className` | — | Appended to the root. |

## Layout

The root is a CSS size container. When it's at least 620px tall, the motto is
set big above her. Otherwise she gets the whole stage. On narrow widths the
button row scrolls sideways. Do not pass `height="100%"`: on an installed page
the ancestors have no height, so it collapses to 0px.

## Note

Miss Minutes, the TVA and "For All Time. Always." belong to Marvel/Disney. This
is fan art drawn from scratch, not traced. If you publish it publicly, that's
your call. Every name and line is a prop, so she can be renamed in one line.

## Checks

```bash
npm run dev     # /#miss-minutes-clock, /#miss-minutes-clock/peach, /#miss-minutes-clock/noir, ?dark
npm run check
node tests/miss-minutes-clock.test.mjs
```
