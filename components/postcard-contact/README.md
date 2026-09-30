# Postcard Contact

A contact form written on the back of a vintage postcard, set against a sky
seen through palm fronds.

The visitor writes their message on the left, where it says *This space for
writing messages*, and fills the address side on the right: first and last
name, email, address and phone. The stamp is a picker, so tapping it swaps in
another design. Their first name signs the card as they type it.

**Seal & send** runs the post:

1. The stamp is **postmarked** with today's date.
2. The card lifts, shrinks and **slides into a parchment envelope** that rises
   up under it.
3. The flap **folds shut** (it swings from behind the card to in front of it at
   the halfway point) and a **wax seal** stamped with their initial presses on.
4. A note is **handwritten across the back**, `cozy vibes from Sienna` by default.
5. Once `onSend` resolves, the envelope **flies off** and a thank-you card
   drops in with a *Write another postcard* button.

If `onSend` throws, the envelope comes back stamped **RETURN TO SENDER**, with
the error beside it. *Open it back up* takes the card out again with everything
still written on it.

**No dependencies.** React is the only import. There is no image, font or
network request. The paper and parchment are tiled SVG noise, the palms are
generated, and the POSTCARD lettering and the stamps are drawn in the file.

## Usage

```tsx
import PostcardContact from "@/components/ui/postcard-contact"

<PostcardContact
  recipient="Kedhar"
  onSend={async (data) => {
    const res = await fetch("/api/contact", { method: "POST", body: JSON.stringify(data) })
    if (!res.ok) throw new Error("The post office is closed. Try again in a minute?")
  }}
/>
```

`data` is:

```ts
type PostcardData = {
  firstName: string
  lastName: string
  email: string
  address: string
  phone: string
  subject: string
  message: string
  stamp: string   // id of the stamp they picked
}
```

The error's `message` is shown to the visitor next to the returned envelope, so
write it for them.

## Props

| Prop | Default | Notes |
|---|---|---|
| `onSend` | none | `(data) => void \| Promise`. Called as soon as Send is pressed, while the card is being sealed. The flight waits for it. Throw to bounce the envelope. |
| `recipient` | `""` | Your name. Signs the thank-you card. |
| `fields` | `["lastName", "address", "phone"]` | Optional lines on the address side. First name and email are always there. |
| `required` | `["firstName", "email", "message"]` | Checked on send. Email and phone are also checked for shape whenever they're filled in. |
| `showSubject` | `true` | The title line above the message. |
| `defaultValues` | none | Prefill any field. |
| `envelopeNote` | `"cozy vibes from {firstName}"` | Written on the sealed envelope. Any field works as a `{token}`; an empty `{firstName}` reads "a friend". |
| `thanksTitle` / `thanksBody` | see source | The thank-you card. Same tokens. |
| `signoff` | `"One love,"` | Written above their signature. |
| `subjectPlaceholder` / `messagePlaceholder` | see source | |
| `messageLabel` / `addressLabel` | the printed lines | The small caps printed on the card. |
| `imprint` | `"P. C. PAPERWORKS"` | Printed up the divider, like a publisher's imprint. |
| `sendLabel` | `"Seal & send"` | |
| `stamps` | four built-ins | `StampDesign[]`: `{ id, caption, frame?, captionColor?, art? }`. `art` is your own SVG in a 100 × 120 box. The first stamp is the default. |
| `maxLength` | `600` | The writing gets smaller as the card fills up, down to 70%. |
| `scene` | `"tropic"` | `tropic` \| `dusk` \| `none`. `none` leaves your page showing through. |
| `fontFamily` | Homemade Apple → cursive | The handwriting. See **Fonts**. |
| `signatureFamily` | Mrs Saint Delafield → cursive | The signature. |
| `printFamily` | Futura → sans-serif | The printed parts. |
| `ink` | `#1d2230` | Handwriting colour. |
| `printInk` | `#1f4fa0` | Rules, lettering, labels. |
| `paper` / `envelope` | cream / parchment | The stock. The ageing is alpha only, so any colour ages the same way. |
| `seal` | `#9b2d25` | Wax colour. `false` for no seal. |
| `width` | `min(100%, 980px)` | The postcard's width. |
| `height` | `100svh` | Minimum height of the section. A tall form grows it rather than clipping. |

`validate`, `fillTemplate`, `messageScale`, `fitInside`, `envelopeFor`,
`postmarkDate`, `frondPath`, `crownPath`, `noise` and `DEFAULT_STAMPS` are
exported.

## Fonts

A component can't load fonts: an `@import` is stripped on install, and the 21st
capture sandbox blocks other origins. So the handwriting falls back to whatever
cursive face the machine has. It still works, but it looks far better with the
intended faces. Add them once in your app:

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Homemade+Apple&family=Mrs+Saint+Delafield&display=swap" rel="stylesheet" />
```

With `next/font`, pass the generated family names through `fontFamily` and
`signatureFamily`. *Caveat*, *Reenie Beanie* and *Nothing You Could Do* also
suit it.

## Notes

- **It's a real form.** Every line has a label, errors are tied to their inputs
  with `aria-describedby` and read out, and progress goes to a polite live
  region. Autofill works (`given-name`, `email`, `street-address`, `tel`).
  <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Enter</kbd> sends from anywhere on the card.
- **A hidden honeypot field** catches simple bots. If it's filled in, the
  animation plays and `onSend` is never called.
- **The envelope is built around the card, not drawn over it.** The lining, the
  card, the pocket, the bottom flap and the top flap are stacked siblings, so the
  card really goes *behind* the pocket and shows through the open V until the flap
  closes. The flap swaps from behind to in front at 90°.
- The card scales to fit inside the envelope with a margin, so nothing pokes out
  of a sealed envelope on any layout. The test checks this for wide, tall and
  square cards.
- **Below 640px of width** the card stacks: address side first, the divider
  turns horizontal, and everything is sized in container units, so it scales
  with the card and not with the viewport.
- `prefers-reduced-motion` collapses the whole sequence to its end states.
  Sending still works and still shows the thank-you card.
- Sized by `width` and an aspect ratio, and the section by a definite
  `min-height`. There is no percentage height anywhere.
