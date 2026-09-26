# Clock Mascot Chat

A chatbot with a face. It's a 1930s rubber-hose cartoon clock, a cheerful
receptionist for a made-up time bureau, and she **acts out every reply**. She
waves hello, winks at her own jokes, taps her chin while she thinks (the dial's
ticks light up in turn), covers her blushing cheeks when you flatter her, and
narrows her eyes and glows red if you get rude. Type, tap a chip, or talk to her
with the mic. She types back with her mouth lip-synced to the words, and can say
them aloud too.

Everything is drawn in the one component file: the character, the gloves, the
reflection, the icons. There is no image, font file or icon set.

## Usage

```tsx
import ClockMascotChat from "@/components/ui/clock-mascot-chat"

<ClockMascotChat />                                        // orange on black, offline brain
<ClockMascotChat theme="peach" name="Penny Pendulum" />    // blush poster look, renamed
<ClockMascotChat theme="noir" onAsk={askMyModel} />        // black & white, your LLM
```

No npm dependencies beyond React, and no Tailwind utilities. Every rule is
scoped to `.rcc-*` inside the component's own `<style>`.

### Plugging in a model

```tsx
<ClockMascotChat
  onAsk={async (message, history) => {
    const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ message, history }) })
    const { text } = await res.json()
    return text                      // or { text, mood: "wink" } to choose her face
  }}
/>
```

`history` is already `{ role: "user" | "assistant", content }[]`. If you return
only text, her mood is read off it: apologies look sad, "!" looks happy, "I
don't know" gets a shrug, and so on. While the promise is pending she thinks.

## What she does

| Trigger | Reaction |
|---|---|
| Greeting, goodbye | Waves |
| "Who are you?", the time, the date, help | Hand on hip, finger up, explains |
| A joke | Winks, one eye shut |
| "My name is Ada" / "I'm Ada" | Cheers, then uses your name from then on |
| Compliments, "I love you" | Covers her cheeks, blushes, hearts float up |
| Insults | Stern eyes, arms on hips, trembles, red glow and a glitch |
| "Are you evil?" | Winks. A friendly, harmless, all-seeing clock |
| Maths (`what's 12 x 7`, `(3+4)^2`, `10 divided by 4`) | Works it out. Divide by zero alarms her |
| `timer for 5 minutes`, `remind me in an hour` | Starts a real countdown in the header, then rings |
| "I'm behind on my deadline" | Offers a 25-minute focus timer. Answer "yes" and it starts |
| SHOUTING | Startled: "Whoa there, inside voice!" |
| Typing in the box | Cups a hand to her ear and watches the input |
| Poking her (click / tap / Enter) | Giggles, then protests, then glitches if you keep going |
| Left alone | Checks in (twice at most), then dozes off with floating z's. Any movement wakes her, a little embarrassed |
| The pointer | Her eyes follow it. She also blinks, sometimes twice |

The brain is offline and deterministic. It uses ordered intent patterns, a
recursive-descent arithmetic parser (never `eval`) and a timer parser, all in the
`// #region brain` block. `tests/clock-mascot-chat.test.mjs` runs that block for
real.

Voice in uses the Web Speech API `SpeechRecognition`. Chrome, Edge and Safari
support it; where it's missing, the mic button is hidden. Voice out uses
`speechSynthesis` and is toggled in the header. It is off by default unless you
pass `voice`.

`prefers-reduced-motion`: the bobbing, hopping, wandering gaze, blinking,
typewriter and every CSS animation are turned off. Her expressions and poses
still change, and her eyes still follow a pointer you move.

## Props

| Prop | Default | What it does |
|---|---|---|
| `height` | `"100svh"` | Must be a definite length. |
| `minHeight` | `"560px"` | Floor for the height. |
| `theme` | `"midnight"` | `midnight` · `peach` · `noir`. |
| `name` / `org` / `motto` | `"Tilly Tock"` / `"Bureau of Timekeeping"` / `"Right on time. Every time."` | Her persona. The org's initials make the emblem. |
| `petName` | `"sugar"` | What she calls you until you tell her your name. |
| `lines` | — | Replace any lines by intent (`joke`, `greet`, `insult`, …) or cue (`greeting`, `nudge`, `poke`, `wake`, `timerDone`, …). `{name}` `{org}` `{user}` `{User}` `{time}` `{date}` `{motto}` are filled in. |
| `suggestions` | five starters | The chips above the input. |
| `placeholder` | `"Ask Tilly anything…"` | |
| `onAsk` | — | `(message, history) => string \| { text, mood } \| Promise<…>`. Replaces the offline brain. |
| `voice` | `false` | Start with speech out on. |
| `idleSeconds` / `sleepSeconds` | `25` / `70` | When she checks in, and when she naps. |
| `reflection` | `true` | The mirrored floor under her. |
| `hologram` | on except `peach` | Scanlines and a faint flicker. |
| `face` `ink` `glove` `shoe` `glow` `accent` `background` | from theme | Colour overrides. Face shading and the disc edge are mixed from `face` with `color-mix()`, so any colour stays round. |
| `className` | — | Appended to the root. |

Moods you can return from `onAsk`: `idle` `happy` `wink` `talk` `explain`
`think` `shrug` `stern` `surprised` `sleepy` `listen` `wave` `shy` `sad`.

## Layout

The root is a CSS size container. At 760px wide and above, the stage sits on
the left, with the motto set big over her, and the chat sits on the right. Below
760px the layout stacks: she stands on top and the chat is underneath. The
character is one SVG and scales to fit whatever box the stage gets.

Do not pass `height="100%"`. On an installed page the ancestors have no height,
so it collapses to 0px.

## Fidelity note

She is inspired by a well-known animated clock mascot. The rubber-hose limbs,
the orange dial with 12/3/6/9 bars, the lashes, the white gloves, the glow and
the floor reflection all come from the reference posters. The name, bureau,
motto, emblem and every line are original, so the published piece doesn't use
anyone else's character or trademark. Rename her with the props.

## Checks

```bash
npm run dev     # /#clock-mascot-chat, /#clock-mascot-chat/peach, /#clock-mascot-chat/noir, ?dark
npm run check
node tests/clock-mascot-chat.test.mjs
```
