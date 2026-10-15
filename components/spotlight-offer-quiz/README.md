# Spotlight Offer Quiz

The discount popup that asks one good question first. A spotlit studio stage on the right, a
huge offer, one personal question and a stack of answer pills. At rest the stage shows the
line-up: every answer's product side by side in tall columns under one beam. Pointing at an
answer pulls its product out of the line-up and opens it to the full stage while the beam turns
toward it. Picking one locks the light on it (the beam widens and brightens):
the pills give way to your pick for that answer (a name and one line about it), an email field,
and then the code itself with a copy button.

It does the job of a first-order popup and quietly collects the zero-party answer you actually
want (who the gift is for, where the plant goes, how they brew), which `onPick` and `onClaim` hand
you with the email. The default content is a gift finder for an invented general store; the
demos add a plant shop (inline, daylight) and a coffee subscription (no email step).

- **Two layouts:** `variant="modal"` (default) is a full-screen takeover with focus trap, Escape,
  scroll lock and focus return; `"section"` sits inline on a page and takes a definite `height`
  (default `100svh`).
- **Opens itself if you want:** `trigger="manual"` (default; control it with `open` and
  `onOpenChange`), `"delay"` (after `delayMs`) or `"exit-intent"` (the pointer leaves the top of
  the window; touch screens fall back to the delay). `rememberDismissDays` keeps it quiet after a
  close, decline or claim (localStorage, guarded); it defaults to 7 days with a self-opening
  trigger. Uncontrolled, it starts closed (`defaultOpen` is `false`).
- **A real form:** labelled email field, validation, async `onClaim` with pending, inline error
  (`role="alert"`) and success. Resolve `onClaim` with a string to show a code from your server;
  otherwise the option's `code`, then `code`. `collectEmail={false}` skips straight to the code.
  Copy uses the clipboard and falls back to selecting the code where the clipboard is blocked.
- **Personal end state:** each option can carry `pick`, `note`, `image`, `href` and its own
  `code`; the submit label and the "Shop …" link can be functions of the option. Without an
  `href`, the popup ends on "Start shopping" (`continueLabel`), which closes it.
- **Presets:** `graphite` (default, the mid-grey studio), `chalk` (a cool mineral-grey daylight
  studio) and `midnight` (deep blue with a saffron button). `darkPreset` swaps the preset under a
  `.dark` ancestor; `colors` overrides any of `stage`, `deep`, `ink`, `muted`, `accent`,
  `onAccent`, `beam`.
- **Photo grade:** `grade="mono"` (default) turns any product shot into studio monochrome so
  mixed stock photos sit together; `"natural"` and `"warm"` too.
- **Line-up or one hero:** leave `image` out (default) for the line-up; pass `image` to stand one
  product on the stage instead, and answers then wipe their photo up from the floor.
- **Photos or packshots:** `imageFit="cover"` (default) fills the stage with a photo;
  `"contain"` stands a transparent cut-out packshot on the stage floor with a soft shadow, like a
  studio shot. Per option too (`fit`).
- **Never a broken image:** an answer with no photo, or a photo that fails to load, sets the
  pick's name in big lit capitals under the beam instead, measured in the display face and fitted
  to the stage (the default "Impossible to buy for" answer does this on purpose).
- **Motion:** the beam sways slowly at rest; pointing at an answer pulls its product out of the
  line-up in 460 ms (or wipes it up from the floor in 420 ms when there is a hero `image`) while
  the beam dips and turns toward it; picking one brightens the beam and the floor pool; steps
  cross-fade with a 40 ms stagger. Under `prefers-reduced-motion` the beam is still and every
  change is a plain fade.

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
  kicker="Your first gift,"
  offer="15% off"
  question="Who are you shopping for? We'll find the thing they'll actually use."
  image="/shop/hero.jpg"
  brand="Halden & Co."
  options={[
    { label: "Always on a call", tag: "someone always on a call", pick: "Studio over-ears", note: "Closed-back, thirty hours a charge.", image: "/shop/headphones.jpg", href: "/p/studio" },
    { label: "Never on time", tag: "someone never on time", pick: "Field Watch 38", note: "Steel case, sapphire glass.", image: "/shop/watch.png", fit: "contain", href: "/p/field-38" },
    { label: "Impossible to buy for", tag: "the impossible one", pick: "Gift card", note: "Any amount from £20." },
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
| `open` / `defaultOpen` / `onOpenChange` | `false` | modal state |
| `trigger`, `delayMs`, `rememberDismissDays`, `storageKey` | `"manual"`, `6000`, 7 days when self-opening | self-opening |
| `kicker`, `offer`, `question` | gift-finder copy | the offer; `offer` is fitted to the column, `"\n"` for two lines |
| `options` | five kinds of giftee | `{ label, tag?, pick?, note?, image?, imageAlt?, focus?, fit?, href?, code? }[]` |
| `image`, `imageAlt`, `imageFocus`, `imageFit`, `brand` | none (the line-up), `"Halden & Co."` | the product on stage before a pick; `brand` is what the stage spells if that photo fails |
| `grade` | `"mono"` | `"mono"`, `"natural"`, `"warm"` |
| `collectEmail`, `emailLabel`, `placeholder`, `submitLabel`, `pendingLabel`, `finePrint` | | the claim form |
| `code`, `onClaim`, `onPick`, `doneCopy`, `shopLabel`, `continueLabel`, `copyLabel`, `copiedLabel` | | the code step |
| `decline`, `onDecline`, `closeLabel` | a cheeky line | the way out (shown in the modal, or in the section when `onDecline` is set) |
| `preset`, `darkPreset`, `colors`, `displayFont`, `textFont` | `"graphite"` | look |
| `height` | `"100svh"` | section height, a definite length |

## Photos

The defaults and demos use Unsplash photos (Unsplash License) as stand-ins for your product
shots; replace them with your own. Gift finder (studio product shots on plain backdrops, graded
to monochrome): headphones photo-1505740420928, watch photo-1523275335684, instant camera
photo-1526170375885, sunglasses photo-1572635196237. Plants: photo-1485955900006,
photo-1463936575829, photo-1501004318641, photo-1459411552884, photo-1512428813834. The coffee
demo uses no photos and shows the lettered stage.
