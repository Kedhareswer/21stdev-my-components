# Sealed Invite Waitlist

A waitlist form that posts an envelope. The envelope rests half-way into a dark
glass mail slot over a grid that sinks into a gravity well. Send it and it
drops into the slot; when your request comes back it rises out again, the flap
swings open, and an invitation card slides up with your tagline set beneath.

Two stocks of the same envelope:

- **`steel`**: brushed metal with an engraved seal and a highlight that
  follows the pointer.
- **`onyx`**: black paper with grain, and a warm rim light catching one corner.

**No dependencies.** React is the only import. There's no font, image or
network request: the envelope is CSS and inline SVG, the paper grain is an SVG
noise filter, the grid is a canvas, and the default mark is drawn in the file.

## How it behaves

| Do | What happens |
|---|---|
| Leave it | The envelope floats, tilted, in the slot. The grid drifts toward the throat of the well. |
| Focus the field | The envelope rises a little and straightens. |
| Type | Each keystroke nudges it. Once the address parses, it sits up, the seal lights and the button warms. |
| Submit a bad address | The bar shakes and the message is read out. |
| Submit a good one | The button reads `Sealing…`, the envelope drops into the slot, and `onSubmit` runs. |
| `onSubmit` resolves | The envelope rises clear, the bar falls away, the flap opens, the card lifts out and the well pulses. If it resolved a number, that's printed as `Nº 0427`. |
| `onSubmit` throws | The envelope comes back up and the error's `message` is shown. |
| Hover (mouse/pen) | The envelope tilts toward the pointer and the grid's camera follows a little. |

## Usage

```tsx
import SealedInviteWaitlist from "@/components/ui/sealed-invite-waitlist"

<SealedInviteWaitlist
  onSubmit={async (email) => {
    const res = await fetch("/api/waitlist", { method: "POST", body: JSON.stringify({ email }) })
    if (!res.ok) throw new Error("That didn't go through. Try again.")
    const { position } = await res.json()
    return position // optional: printed on the card
  }}
/>

<SealedInviteWaitlist variant="onyx" glow="#e8b77a" tagline="To a network of freedom" />
<SealedInviteWaitlist height="640px" invitedTitle="A seat is saved for you." mark={<YourLogo />} />
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `variant` | `"steel"` | `steel` \| `onyx`. |
| `onSubmit` | — | `(email) => void \| number \| Promise<void \| number>`. Resolve a number to print a place in line; throw to show an error. Without it the envelope just opens. |
| `onReset` | — | Called when someone uses the reset link. |
| `placeholder` | `"Enter your email"` | |
| `buttonLabel` | `"Join waitlist"` | |
| `pendingLabel` | `"Sealing"` | Shown with animated dots while `onSubmit` is pending. |
| `invitedTitle` | `"You have been invited."` | Printed on the card. |
| `tagline` | `"To a network of freedom"` | Set under the open envelope in chrome. |
| `resetLabel` | `"Use another email"` | `""` hides it. |
| `invalidMessage` | `"That address won't reach anyone."` | |
| `mark` | drawn monogram | Any node; goes on the seal and the card. Use `currentColor`. |
| `glow` | `#c9a46a` | The haze behind the slot, the rim light, the focus ring. Any CSS colour. |
| `grid` | `true` | The warped grid. `false` leaves the haze on black. |
| `lean` | `-7` | Resting angle in the slot, degrees. |
| `tilt` | `8` | Largest pointer tilt, degrees. `0` holds it flat. |
| `digits` | `4` | Zero-padding for the place number. |
| `height` | `100svh` | A definite length. |
| `initialState` | `"idle"` | `"invited"` starts opened (with `initialEmail`), e.g. for a confirmation page. |

`isEmail`, `maskEmail`, `serial`, `wellDepth` and `project` are exported.

## Notes

- The card shows the address masked (`ke•••@gmail.com`) since it's on screen.
- It's a real `<form>`: labelled `type="email"` field, Enter submits, errors
  are `role="alert"` and tied to the field with `aria-describedby`, and the
  invitation is announced through a `role="status"` region. The decorative
  envelope is `aria-hidden`.
- The envelope is clipped to the slot with `clip-path`, so it really goes
  *into* the bar rather than behind it.
- Sized by `height` (a definite length) with `container-type: size`; the
  envelope scales with `cqw`/`cqh` so it fits from a phone up to a full hero.
- `prefers-reduced-motion` removes every transition and animation and stops
  the grid loop. The form still works and opens straight to the invitation.
- The grid's loop pauses off screen and releases its observers on unmount.
