# Wordmark Newsletter Signup

A newsletter signup for a brand that is loud about its name. Your wordmark fills the field
edge to edge in heavy condensed capitals, cropped by the section like a shop sign, and a
hard-bordered card sits on top with the form. When someone signs up, the wordmark letters
drop out one by one and your confirmation word drops in, letter by letter, where your name was.

- **Three layouts:** `variant="section"` (full field, card on top), `"modal"` (a popup with
  focus trap, Escape, scroll lock and focus return; the same letter drop plays as it opens) and
  `"band"` (a compact strip with a one-line form that sits above a footer).
- **A real form:** a labelled email field set in display type that shrinks as the address
  grows, optional topic chips, a consent box that can be required, async `onSubscribe` with
  pending, inline error (`aria-live`) and success states.
- **No web fonts.** The wordmark is SVG text in system fonts (Arial Black, Helvetica Neue,
  Inter, Liberation Sans). Each line is measured, scaled to the full width and stretched upright
  a little (at most 1.35x), so a heavy face reads as a display cut without looking distorted. If
  your site already loads a condensed display face, pass it as `displayFont`; that is the intended
  upgrade.
- **Readable around the card.** On wide screens the name frames the card: the first line on top,
  the last dropped just past the bottom edge like a sign. A phone stacks shorter lines above
  the card. The split is measured, never guessed, and keeps an even word break.
- **Presets:** `sauce` (default), `pickle`, `mustard`, `blueberry`, each with a designed dark
  version. `theme="auto"` follows a `.dark` class on any ancestor.

No dependencies beyond React and React DOM (the modal renders through a portal).

## Usage

```tsx
import WordmarkNewsletterSignup from "@/components/ui/wordmark-newsletter-signup"

<WordmarkNewsletterSignup
  brand="Big Sunday Sauce Co."
  successWord="See you Sunday"
  headline="One recipe every Sunday, straight to your inbox"
  topics={["Recipes", "New sauces", "Pop-ups"]}
  proof="Read by 18,240 home cooks"
  onSubscribe={async ({ email, topics, consent }) => {
    const res = await fetch("/api/subscribe", { method: "POST", body: JSON.stringify({ email, topics, consent }) })
    if (!res.ok) throw new Error("We couldn't sign you up just now. Try again in a moment.")
  }}
/>
```

Popup:

```tsx
const [open, setOpen] = React.useState(false)
<WordmarkNewsletterSignup variant="modal" open={open} onOpenChange={setOpen} preset="pickle" brand="Brine House" />
```

## Props

| Prop | Default | |
|---|---|---|
| `brand` | `"Big Sunday Sauce Co."` | The wordmark. `"\n"` or an array fixes the lines; otherwise the words are split to fill the box. |
| `successWord` | `"See you Sunday"` | What the wordmark becomes after a signup. |
| `headline`, `description` | | Card copy. The headline is set in capitals. |
| `emailLabel`, `placeholder`, `buttonLabel`, `pendingLabel` | | Field and button text. |
| `topics`, `defaultTopics`, `topicsLabel` | none | Optional toggle chips, passed to `onSubscribe`. |
| `consent` | a one-line agreement | Text beside the checkbox. `null` hides it. |
| `requireConsent` | `true` when there is a checkbox | Refuse to send until it is ticked. |
| `proof` | none | Small social proof under the button. |
| `successTitle`, `successCopy`, `resetLabel` | | Success state. `successCopy` may be a function of the email. |
| `onSubscribe` | waits 900 ms | `({ email, topics, consent }) => void \| Promise`. Throw an `Error` to show its message. |
| `variant` | `"section"` | `"section" \| "modal" \| "band"`. |
| `backdrop` | `"wordmark"` | Modal: `"wordmark"` fills the screen with the brand, `"dim"` darkens the page behind the card. |
| `open`, `defaultOpen`, `onOpenChange` | | Modal state. |
| `preset` | `"sauce"` | `"sauce" \| "pickle" \| "mustard" \| "blueberry"`. |
| `palette`, `darkPalette` | | Override `ground`, `mark`, `paper`, `ink`, `accent`, `onAccent`, `headline`. |
| `theme` | `"auto"` | `"auto" \| "light" \| "dark"`. |
| `height` | `"min(100svh, 880px)"` | Section minimum height. Any definite length. |
| `maxLines` | `4` | Most lines the wordmark may break into (wide screens frame the card with two). |
| `crop` | `0.14` | How far the last line drops past the bottom edge, as a fraction of its height. |
| `image` | none | `{ src, alt }`: an optional photo tile beside the card on wide screens. It hides itself if it fails to load. |
| `displayFont`, `textFont` | system stacks | Your own stacks, e.g. `"var(--font-display)"`. |

The typed address keeps its case (only the placeholder is set in capitals), the field shrinks
so long addresses and the placeholder never clip, and the form keeps focus while it sends and
after an error. On touch screens the popup focuses the dialog, not the field, so the keyboard
does not cover it on open. Reduced motion swaps the wordmark instantly and keeps every state
readable.
