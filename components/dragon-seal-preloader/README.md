# Dragon Seal Preloader

A film title card that loads, then stays on as the landing screen. Sepia
paper, a lace of cloud scrolls, a bronze astrolabe, a dragon coiled round it
and two hands rising out from behind the seal.

1. **Boot.** The projector warms up: the frame flickers in, the gate weaves,
   a timecode starts running top left.
2. **Unseal.** A ring of cloud scrolls (祥云) is engraved round the frame as the
   load climbs, swept by a spark like a leader countdown. The eight trigrams on
   the seal light one by one, and the read-out calls each out:
   `离 · Fire`, `震 · Thunder`…
3. **Summon.** At 100% a flash leaves the seal. The dragon draws itself in,
   tail first, scales, fins, claws, then the head, mane and whiskers. The
   raised hand and the open hand rise out from behind the seal, and the
   dragon's eye catches the light.
4. **Landing.** The credit sets itself bottom left like the opening of a film:
   roles, a large name, the Latin line under it. A brand chop, a nav, a
   vertical verse and the call to action come up round it.

The landing stays live. The light and every layer part in parallax under the
pointer, and the astrolabe's rule tracks it. The seal is a dial: **drag it**
round to scrub through the credits (it snaps to the nearest one), **tap** it
for the next one, or use **← →** when it's focused. Left alone, it turns to the
next credit every few seconds. The vermilion chop top left replays the
opening. During the load, a click, Enter or Space (or **Skip**) rushes it to
100%. A second click skips the dragon's entrance.

```tsx
import DragonSealPreloader from "@/components/ui/dragon-seal-preloader"

// The full opening, then the landing
<DragonSealPreloader />

// Driven by real progress, your own credits and tone
<DragonSealPreloader
  progress={loaded}
  tone="jade"
  brand="青龙"
  brandLatin="Azure Dragon"
  verse="东方七宿 · 角亢氐房"
  credits={[
    { roles: "视觉概念 | 动态设计", name: "顾青", rolesLatin: "Visual Concept | Motion Design", nameLatin: "Gu Qing" },
    { roles: "剪辑", name: "叶舟", rolesLatin: "Edited by", nameLatin: "Ye Zhou" },
  ]}
  cta={{ label: "Book a seat", href: "/tickets" }}
  onLoaded={() => {}}
/>

// Returning visitors: straight to the landing
<DragonSealPreloader skipIntro />
```

**No dependencies beyond React, and no assets.** Every line is procedural SVG
built in the file: the cloud lace, the dragon's spine, scales, fins, claws and
head, the two hands with their hatching, and the seal's rim, trigrams, lotus
and mandala palace. The paper and film grain are painted onto canvas once on
mount. Each layer is its own `<svg>`, so parallax and rotation stay on the
compositor. One `requestAnimationFrame` loop drives the light, the rule, the
seal's spring and the timecode, and another drives the load.

## Props

| Prop | Default | Description |
|---|---|---|
| `progress` | — | Real progress, `0`–`100`. Leave it out to run a simulated load. The dragon waits for `100`. |
| `durationMs` | `4600` | Length of the simulated load. It surges and stalls like a real one. |
| `skipIntro` | `false` | Open straight on the landing, for repeat visits. |
| `brand` | `"天枢"` | Set in the vermilion chop. One or two characters read best; up to four fit. |
| `brandLatin` | `"Tianshu"` | Beside the chop. |
| `nav` | Story, Cast, Stills, Screenings | `{ label, href? }[]`. Without `href` a link is a button. Hidden on narrow screens. |
| `credits` | four invented credits | `{ roles, name, rolesLatin?, nameLatin? }[]`. The seal turns through them. Two to eight read best. |
| `verse` | `"云起龙骧 · 星移斗转"` | Set vertically down the right edge. Empty to hide. |
| `cta` | `{ label: "Enter" }` | Bottom right. With `href` it's a link. |
| `onEnter` | — | Fired when the call to action is pressed. |
| `onLoaded` | — | Fired each time the landing comes up. |
| `autoAdvanceMs` | `6500` | Idle time before the next credit. `0` to never. |
| `tone` | `"sepia"` | `"sepia"`, `"jade"`, `"cinnabar"` or `"paper"` (ink on parchment, for light pages). |
| `palette` | from `tone` | Partial overrides, see below. |
| `fontFamily` | system CJK serif stack | Face for the CJK lines. Nothing is fetched. Pass one the host already loads. |
| `height` | `"100svh"` | Root height. Always a definite length, never `h-full`. |
| `className` | `""` | Extra root classes. |

### Palette

| Key | Sepia | Used for |
|---|---|---|
| `stage` | `#15100b` | Background. |
| `face` | `#0d0906` | The dark inside the seal, and the dragon's body. |
| `ink` | `#d3b98f` | Engraved lines on the stage. |
| `paper` | `#dcc39b` | Fill of the hands and the seal's rim. |
| `shade` | `#2c2015` | Lines drawn over the paper fills. |
| `glow` | `#ffcf8f` | Light behind the seal, the spark, the dragon's eye. |
| `seal` | `#b5352b` | The chop, the credit markers, the notch, the rule over the credit. |
| `text` | `#e8d6b6` | Interface text. |

## Notes

- The stage carries its own colours, so it reads the same in light and dark
  hosts. Use `tone="paper"` when it should sit on a light page.
- The default credits, brand and verse are invented. Swap in your own.
- CJK text uses the system's serif (Songti, Noto Serif SC, Source Han Serif…)
  and falls back to whatever CJK face the machine has.
- `prefers-reduced-motion` stops the parallax, rotation, weave, grain, flicker
  and scratches. The dragon fades in instead of drawing, and credits
  cross-fade.
- The read-out is a `role="progressbar"` with its value. On the landing, the
  seal is a `role="slider"` (arrows, Home, End), and the credit is announced
  as it changes.
