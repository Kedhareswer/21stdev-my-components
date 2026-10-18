# Blossom Dusk Template

A complete landing page for an integrations product, opening under cherry
boughs against a periwinkle dusk sky. Big quiet type bottom-left, a glass nav
with frosted dropdowns, and the brand mark — eight spokes, two of them joined
through the middle — hanging faintly in the sky behind it all.

The boughs are grown and painted on canvas from a seed: tapered limbs with rim
light, five-petal notched blossoms tilted in space, buds, leaves and stamens,
in three depths of focus (a hazy back layer, a crisp middle, and a few huge
out-of-focus blossoms in front). They sway, rustle when the pointer moves
through them, shed petals when you click the sky, and lift away as you scroll.

Below the hero:

- **Integrations hub**: the brand mark's own spokes become the wheel. Eight
  systems, each a node you can inspect and connect or pause, with packets
  flowing along live spokes and an event log streaming in.
- **Busywork board**: a list of manual chores you tick off for automation; the
  hours-back number and per-team bars ease to match.
- **Numbers** that count up, **case studies** in a snap carousel, **pricing**
  with a billing toggle and a connections slider, **questions**, and a closing
  band back under the boughs with a sign-up form and footer.

```tsx
import BlossomDuskTemplate from "@/components/ui/blossom-dusk-template"

<BlossomDuskTemplate
  brand="tendril"
  palette="dawn"
  seed={23}
  onGetStarted={(email) => fetch("/api/signup", { method: "POST", body: JSON.stringify({ email }) })}
/>
```

**No dependencies beyond React.** The blossoms, the petals, the mark, the
icons and the demo walkthrough are canvas, SVG and CSS drawn in the file, and
the type is the system stack (Inter Tight or Inter when installed). Nothing
loads at runtime, so it renders inside the 21st capture sandbox. Every brand,
person and number in the defaults is made up.

## Play with it

| Do this | And |
|---|---|
| Move the pointer through the boughs | They rustle in the direction you moved, and nearby petals get swept along |
| Click the sky | That side's bough shakes and lets go of a flurry of petals; petals near the click scatter |
| Scroll | The boughs lift and part, the mark turns and fades, the headline drifts up |
| Hover or focus *Features*, *Resources*, *Company* | Frosted glass menus. ↓ / ↑ move through them, Escape closes and returns focus |
| *Watch demo* | A drawn 18-second walkthrough in a player: play/pause (Space), seek by clicking or dragging the bar (← →), Escape to close. Pass `demoVideo` to play your own video instead |
| Pick a node on the wheel | Its card shows today's count, status, latency and its events. ← → move around the wheel |
| Flip a node's switch, or double-click it | The spoke draws itself in and packets start flowing, or it goes quiet. *Connect all* / *Pause all* does the lot |
| Tick a chore on the busywork board | It strikes through, the hours-back number counts to its new value, and its team's bar shifts from manual to automated |
| Toggle *Monthly / Yearly*, drag *Connections* | Every price eases to its new value; extra connections are spelled out |
| *Get started* anywhere | Scrolls to the closing form and puts the cursor in the email field. Inline validation, a sending state, then a confirmation |

## Props

| Prop | Default | Description |
|---|---|---|
| `brand` | `"runcycle"` | Wordmark in the nav and footer, and in the default copy (capitalised). |
| `logo` | drawn mark | Replaces the mark beside the wordmark. |
| `nav` | Features, Resources, Company menus and Pricing | `{ items?, login?, cta? }`. An item with `items` is a menu of `{ label, href?, text? }` (`text` is a second line, which widens the menu). An `href` of `#connect`, `#automate`, `#stories`, `#pricing`, `#faq` or `#start` scrolls within the page; `#demo` opens the walkthrough. `null` hides it. |
| `hero` | *Connect the dots. Skip the busywork.* | `{ title?, accent?, text?, primary?, secondary? }`. `accent` is the muted second half of the headline. `null` hides the hero. |
| `image` | — | A photo for the hero sky in place of the painted boughs. Petals still fall over it. |
| `seed` | `7` | Seed for the painted boughs. Every seed grows a different canopy; the closing band uses `seed + 11`. |
| `logos` / `logosTitle` | 6 made-up clinics / *Trusted by care teams at* | The marquee under the hero. `logos={null}` hides it. |
| `hub` | 8 health integrations | `{ eyebrow?, title?, text?, integrations? }`. Each integration is `{ name, vendors, icon, events, connected? }`; `icon` is `"record" \| "lab" \| "heart" \| "pill" \| "receipt" \| "shield" \| "video" \| "calendar"`, and `#` in an event becomes a record number. Up to eight, one per spoke. `null` hides it. |
| `busywork` | 6 chores | `{ eyebrow?, title?, text?, tasks? }` of `{ title, team, hours }`. `null` hides it (and the numbers). |
| `stats` | 4 numbers | `{ value, label, prefix?, suffix?, decimals? }[]`, shown under the busywork board. `null` hides them. |
| `stories` | 3 case studies | `{ eyebrow?, title?, quotes? }` of `{ quote, name, role, org, metric: { value, label } }`. `null` hides it. |
| `pricing` | Starter, Growth, Health system | `{ eyebrow?, title?, text?, tiers? }`. A tier is `{ name, text, base, included, perConnection, features, featured?, button? }`; its monthly price is `base` plus `perConnection` for each connection over `included`, 20% off yearly. `base: null` shows *Custom*. `null` hides it. |
| `faq` | 4 questions | `{ title?, items? }` of `{ q, a }`. `null` hides it. |
| `cta` | *Your stack, finally in sync.* | `{ title?, text?, button?, placeholder? }`. `null` hides the form; the band stays if there's a footer. |
| `footer` | 3 columns | `{ tagline?, columns?, note?, legal? }`. `null` hides it. |
| `palette` | `"dusk"` | `"dusk"`, `"dawn"`, `"night"`, or any subset of the palette laid over dusk: `sky` (three stops), `glow`, `heroInk`, `heroMuted`, `night`, `nightSoft`, `nightInk`, `paper`, `paperSoft`, `paperInk`, `paperMuted`, `rule`, `accent`, `petal` (tip, body, throat), `eye`, `anther`, `stamen`, `bark`, `rim`, `leaf`. All hex — the painter blends them. |
| `demoVideo` | — | A video URL for *Watch demo*. Without it the modal plays the drawn walkthrough. |
| `onGetStarted` | — | Called with the email. Return (or resolve to) `false`, or throw, to show an error. Without it the form fakes a 0.9 s send. |
| `height` | `"100svh"` | Minimum height of the hero. |

## Notes

- The page keeps its own colours in both host themes. It's a brand page, not a
  themed widget. Colours are CSS variables on the root, so `palette` reaches
  the sky, the canvas painting, the wheel and the buttons alike.
- The canopy loop runs only while its section is on screen and the tab is
  visible. Each side is three stacked canvases, so swaying is a CSS transform
  and the flowers are painted once (again only when the width changes).
- Under `prefers-reduced-motion` the boughs are painted at rest with a few
  petals caught mid-fall, nothing sways or follows the pointer, numbers land
  without counting, the mark is drawn in full, and in-page links jump.
- The nav turns to paper over the light sections and to dusk glass over the
  dark ones, so it never sits grey on cream.
- The root clips sideways with `overflow-x: clip` rather than
  `overflow: hidden`, which would break the sticky nav.
- The hub's counts and event log are a simulation for the page. Feed real data
  by swapping the integrations' `events` or forking the `Hub` section.
