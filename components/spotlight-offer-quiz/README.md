# Spotlight Offer Quiz

The discount popup that asks one good question first. A spotlit studio stage with your product
photo bleeding off the right, a huge offer, one personal question and a stack of answer pills.
Pointing at an answer brings its product up under the light. Picking one locks the light on it:
the pills give way to your pick for that answer (a name and one line about it), an email field,
and then the code itself with a copy button.

It does the job of a first-order popup and quietly collects the zero-party answer you actually
want (how they brew, where the plant goes, what the dog needs), which `onPick` and `onClaim` hand
you with the email.

- **Two layouts:** `variant="modal"` (default) is a full-screen takeover with focus trap, Escape,
  scroll lock and focus return; `"section"` sits inline on a page and takes a definite `height`
  (default `100svh`).
- **Opens itself if you want:** `trigger="manual"` (default; control it with `open` and
  `onOpenChange`), `"delay"` (after `delayMs`) or `"exit-intent"` (the pointer leaves the top of
  the window; touch screens fall back to the delay). `rememberDismissDays` keeps it quiet after a
  close, decline or claim (localStorage, guarded).
- **A real form:** labelled email field, validation, async `onClaim` with pending, inline error
  (`role="alert"`) and success. Resolve `onClaim` with a string to show a code from your server;
  otherwise the option's `code`, then `code`. `collectEmail={false}` skips straight to the code.
  Copy uses the clipboard and falls back to selecting the code where the clipboard is blocked.
- **Personal end state:** each option can carry `pick`, `note`, `image`, `href` and its own
  `code`; the submit label and "Shop …" link can be functions of the option.
- **Presets:** `graphite` (default, the dark studio), `chalk` (a cool mineral-grey daylight
  studio) and `midnight` (deep blue with a saffron button). `darkPreset` swaps the preset under a
  `.dark` ancestor; `colors` overrides any of `stage`, `deep`, `ink`, `muted`, `accent`,
  `onAccent`, `beam`.
- **Photo grade:** `grade="mono"` (default) turns any product shot into studio monochrome so
  mixed stock photos sit together; `"natural"` and `"warm"` too.
- **Never a broken image:** with no photo, or one that fails to load, the stage sets the pick's
  name in giant lit capitals under the beam instead.
- **Motion:** the beam sways slowly at rest; a swap wipes the new photo up from the floor while
  the beam dips; step changes cross-fade with a 40 ms stagger. Under `prefers-reduced-motion` the
  beam is still and every change is a plain fade.

No dependencies beyond React and React DOM (the modal renders through a portal). No web fonts:
the display face is a system stack (Helvetica Neue, Inter Display, Inter, Arial); pass your own
as `displayFont`.

## Usage

```tsx
import SpotlightOfferQuiz from "@/components/ui/spotlight-offer-quiz"

const [open, setOpen] = React.useState(false)

<SpotlightOfferQuiz
  open={open}
  onOpenChange={setOpen}
  kicker="Your first bag, up to"
  offer="30% off"
  question="Tell us how you brew at home and we'll pick the roast to start with."
  image="/shop/hero-bag.jpg"
  brand="Kettle & Crow"
  options={[
    { label: "Espresso, most mornings", tag: "espresso", pick: "Night Shift", note: "Dark chocolate, cherry, a thick crema.", image: "/shop/night-shift.jpg", href: "/roasts/night-shift" },
    { label: "Pour-over, slow and fussy", tag: "pour-over", pick: "Kiboko Highlands", note: "Blackcurrant, cane sugar, a bright clean finish.", image: "/shop/kiboko.jpg", href: "/roasts/kiboko" },
  ]}
  onClaim={async ({ email, option }) => {
    const res = await fetch("/api/offer", { method: "POST", body: JSON.stringify({ email, answer: option.tag }) })
    if (!res.ok) throw new Error("That didn't go through. Try again in a moment.")
    return (await res.json()).code
  }}
/>
```

Opening by itself after 8 seconds, once a fortnight at most:

```tsx
<SpotlightOfferQuiz trigger="delay" delayMs={8000} rememberDismissDays={14} />
```

Inline section in daylight:

```tsx
<SpotlightOfferQuiz variant="section" preset="chalk" darkPreset="graphite" grade="natural" offer="£10 off" />
```

## Props (main)

| Prop | Default | |
|---|---|---|
| `variant` | `"modal"` | `"modal"` or `"section"` |
| `open` / `defaultOpen` / `onOpenChange` | `true` when uncontrolled and manual | modal state |
| `trigger`, `delayMs`, `rememberDismissDays`, `storageKey` | `"manual"`, `6000`, `0` | self-opening |
| `kicker`, `offer`, `question` | coffee roaster copy | the offer; `offer` is fitted to the column, `"\n"` for two lines |
| `options` | five brew methods | `{ label, tag?, pick?, note?, image?, imageAlt?, focus?, href?, code? }[]` |
| `image`, `imageAlt`, `imageFocus`, `brand` | a coffee photo, `"Kettle & Crow"` | the product on stage before a pick; `brand` is what the empty stage spells |
| `grade` | `"mono"` | `"mono"`, `"natural"`, `"warm"` |
| `collectEmail`, `emailLabel`, `placeholder`, `submitLabel`, `pendingLabel`, `finePrint` | | the claim form |
| `code`, `onClaim`, `onPick`, `doneCopy`, `shopLabel`, `copyLabel`, `copiedLabel` | | the code step |
| `decline`, `onDecline`, `closeLabel` | a cheeky line | the way out (shown in the modal, or in the section when `onDecline` is set) |
| `preset`, `darkPreset`, `colors`, `displayFont`, `textFont` | `"graphite"` | look |
| `height` | `"100svh"` | section height, a definite length |

## Photos

The demos use Unsplash photos (Unsplash License) as stand-ins for your product shots; replace
them with your own. Coffee: photo-1509042239860, photo-1495474472287, photo-1447933601403,
photo-1511920170033, photo-1514432324607, photo-1497935586351. Plants: photo-1485955900006,
photo-1463936575829, photo-1501004318641, photo-1459411552884, photo-1512428813834.
