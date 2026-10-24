# Cairn Agents Landing

A complete landing page for an AI support-agent company, in one component.
The art direction is **the window**: every section opens onto a landscape at a
different hour (blue dawn ridges, cairn rocks at noon, a sea of cloud at dusk,
the night sky by the call to action), and the product floats inside those
windows as calm dark-and-white conversation cards. A cairn is a stack of stones
that shows the next walker where the path goes; the mark is four stacked stones.

**Requires `gsap`** (with its bundled `ScrollTrigger`), declared in the root
`package.json`. Nothing else beyond React.

```
http://localhost:5173/#cairn-agents-landing         # fog: an enterprise support line
http://localhost:5173/#cairn-agents-landing/ember   # ember: a clinic network, its own copy, calls and photos
http://localhost:5173/?dark#cairn-agents-landing    # dark
```

```tsx
import CairnAgentsLanding from "@/components/ui/cairn-agents-landing"

export default function Page() {
  return (
    <CairnAgentsLanding
      brand="Harbor"
      palette={{ accent: "#e4572e", agent: "#2a6ee0" }}
      title={"Support that never\nputs anyone on hold."}
      images={{ hero: "/img/ridges.jpg" }}
      onTalk={(data) => fetch("/api/demo", { method: "POST", body: JSON.stringify(data) })}
      onSubscribe={(email) => fetch("/api/lead", { method: "POST", body: JSON.stringify({ email }) })}
    />
  )
}
```

## Play with it

| Do this | And |
|---|---|
| Load the page | The headline rises out of masked lines, the window lifts into place |
| Scroll toward the hero window | It opens from a framed photo to full bleed; the photo settles from a slight zoom |
| Watch the window | An alert lands, the agent's typing pill **morphs** into its answer, a caller's voice pill grows out of a circle. Three scenarios rotate; hover pauses, the chips jump. The live-call counter ticks |
| Move the mouse over it | The landscape and the cards drift at different depths |
| Customer logos | An endless marquee; hover pauses it and brings a logo to colour |
| *Built for the most complex enterprises* | Brightens word by word as it scrolls in |
| **Agent Canvas** | Pins on wide screens and walks through four steps as you scroll. The line above the active step fills with your progress. Click a step to jump there. The card morphs its height between panels |
| 01 Create | Chat / Voice / Multi-modal tabs (arrow keys work). **Drop files** or click to browse: each one indexes, then shows its chunks and size. *Use sample files* if you have none |
| 02 Policies | Switch rules on and off and set hand-off sensitivity |
| 03 Simulate | Pick caller personas, **Run 500 calls**. Results stream in and depend on the policies and sensitivity you just set (seeded, so a run is repeatable) |
| 04 Deploy | Switch channels, **Go live**: numbers, knowledge, voices, routing tick off, then it's live. *Pause* resets |
| *Listen in* | A support call starts when it scrolls into view: karaoke transcript, live waveform in each speaker's colour, memory recalled as it comes up, a sentiment line from frustrated to relieved. Play, pause, scrub, replay. The speaker button reads it aloud with the browser's voices |
| Numbers | Count up on arrival; hold time counts **down** from the industry's 11:42 to 0:00 |
| Testimonials | Advance when their bar fills; hover to pause, click a person to jump |
| Call to action | The night window opens out of a smaller frame. The email is validated; *Book a call* opens the dialog |
| **Talk to us** (nav, hero, CTA) | A modal form with validation, a volume picker, focus trap and Esc. `onTalk` gets the data |

Under 1024 px the canvas stops pinning and becomes an accordion beside its card;
under 860 px the nav folds into a full-screen sheet. With
`prefers-reduced-motion` nothing is hidden or scrubbed, the marquee becomes a
static row, and the hero conversation shows finished.

## Props

| Prop | Default | |
|---|---|---|
| `brand`, `logo` | `"Cairn"`, the cairn mark | |
| `nav`, `login`, `action` | Demo / Product / Customers / Company, Sign in, Talk to us | `#hash` links scroll to `top`, `customers`, `product`, `demo`, `talk`, `company`. An `action` without `href` opens the dialog |
| `announcement` | the rebrand pill | `null` hides it |
| `title`, `subtitle`, `primaryAction` | | `"\n"` breaks the title |
| `scenarios` | Outage, Peak season, After hours | `{ label, alert, reply, replyLink?, voice }[]` |
| `liveCalls` | `1284` | `null` hides the counter |
| `logos`, `logosLabel` | six drawn wordmarks | `{ name, style?: "script" \| "badge" \| "heavy" \| "round" \| "mono" \| "serif", color?, src? }`. Pass `src` for a real logo |
| `canvas` | see source | `{ kicker, heading, title, text, steps, policies, personas, intents, channels, samples }`. Steps map to `"create" \| "policies" \| "simulate" \| "deploy"` panels |
| `call` | card-services call | `{ kicker, title, text, data: { caller, topic, memory, outcome, lines: { who, text, memory?, mood }[] } }` |
| `stats` | | `{ value, from?, clock?, decimals?, prefix?, suffix?, label, note? }[]` |
| `quotes`, `cta`, `footer` | | any of them `null` to drop the section |
| `images` | Unsplash (below) | `{ hero, canvas, call, cta }` |
| `palette` | `"fog"` | `"fog"`, `"ember"` or `{ bg, night, accent, agent, ridges }` |
| `scheme` | `"auto"` | `"auto"` follows a `.dark` ancestor |
| `height` | `"100svh"` | scales the hero window; always a definite length |
| `volumes`, `onTalk`, `onSubscribe`, `className`, `style` | | |

## Photos

All Unsplash, all props. A photo that can't load falls back to drawn, seeded
ridgelines in the palette's tones, so the page still looks finished offline or
in a sandbox that blocks remote images.

- Hero: layered blue ridges — `photo-1500534314209-a25ddb2bd429`
- Agent Canvas: rock pillars at golden hour — `photo-1469474968028-56623f02e42e`
- Listen in: sea of cloud at dusk — `photo-1506905925346-21bda4d32df4`
- Call to action: the Milky Way over peaks — `photo-1519681393784-d120267933ba`
- Avatars: `photo-1494790108377-be9c29b29330`, `photo-1500648767791-00dcc994a43e`, `photo-1534528741775-53994a69daeb`

Customer names and wordmarks are fictional and drawn in the file.

## Notes

- Type is the system stack: a serif (Instrument Serif, Newsreader, Iowan,
  Palatino, Georgia) for display, Inter / system sans for UI, a mono for kickers.
  No web fonts load.
- Every ScrollTrigger lives in a `gsap.context` and is reverted on unmount, so
  it survives strict mode and route changes. Triggers inside the pinned canvas
  declare `pinnedContainer`.
- Speech uses `speechSynthesis` and is off until the visitor turns it on.
