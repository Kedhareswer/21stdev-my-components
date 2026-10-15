# Wirebound Inquiry

A contact section for a studio, agency or freelancer, built as a wire-bound notebook. Closed, the
kraft cover is already a contact card: your name printed big, a highlighter band that opens the
brief, your email and socials written on the cover lines. Open it and the project inquiry is one
question per page. Each answer turns a page over the wire, and the back of every turned page is
the brief so far, so on a wide screen the left page always shows what the visitor has said.

- **A real form.** Chips are radios or checkboxes (`multiple`), questions can be `optional`,
  required ones show an inline error and block the next page. The last page takes a name, an
  email and an optional note (`requireMessage` makes it required). `onSubmit` is async with
  pending and error states; resolve with a string to print a reference on the receipt.
- **Easy to move around.** Index tabs on the page edge jump to any page you can reach, lines on
  the summary page jump back to that question, Enter goes to the next page, focus moves to each
  new page and an `aria-live` region announces it. Pages that are not on top are `inert`.
- **Three arrangements, chosen by the section width, not the viewport:** a spread beside the copy
  (wide), a spread under the copy (tablet), and a single page on a phone where turned pages fold
  away behind the wire.
- **Drawn, not pictured.** The coil is SVG in two halves, behind the pages and in front of them
  through punched holes. The kraft fibre and paper tooth are a small canvas texture made once on
  the client. The cover title is SVG text in system fonts, measured and condensed to fit the cover.
  No images, no web fonts, no dependencies beyond React.
- **Motion:** pages turn around the binding with CSS 3D transforms (580 ms forward, 420 ms back,
  45 ms between pages when several turn at once), the circled answer draws in like a pen stroke,
  the cover lifts a little on hover, the receipt is stamped. Reduced motion swaps pages with a
  short fade and nothing turns.
- **Presets:** `kraft` (default, kraft on cobalt), `ink` (black board on signal orange), `cobalt`
  (blue board on mustard), `olive` (olive board on lilac). Each has a designed dark version;
  `theme="auto"` follows a `.dark` class on any ancestor. Override any colour with `palette` /
  `darkPalette`.

## Usage

```tsx
import WireboundInquiry from "@/components/ui/wirebound-inquiry"

<WireboundInquiry
  studio="Marlowe & Pike"
  email="hello@marlowepike.studio"
  socials={[{ label: "Instagram", href: "https://instagram.com/marlowepike" }]}
  reader="Ines Marlowe"
  replyTime="two working days"
  questions={[
    { id: "project", tab: "Project", title: "What are we making?", options: ["Brand identity", "Website", "Packaging"], multiple: true },
    { id: "budget", tab: "Budget", title: "Roughly what budget?", options: ["Under $10k", "$10k to $25k", "$25k and up"], optional: true },
  ]}
  onSubmit={async (brief) => {
    const res = await fetch("/api/brief", { method: "POST", body: JSON.stringify(brief) })
    if (!res.ok) throw new Error("That didn't send. Try again, or email us directly.")
    return (await res.json()).reference // optional, printed on the receipt
  }}
/>
```

`brief` is `{ answers: { [questionId]: string[] }, name, email, message }`.

## Props

| Prop | Default | Notes |
|---|---|---|
| `studio` | `"Marlowe & Pike"` | Used in the copy and, uppercased, on the cover. |
| `coverTitle` | the studio | A string (`"\n"` fixes the breaks) or an array of up to 3 lines. |
| `kicker`, `headline`, `intro` | sample copy | The column beside the notebook. `kicker={null}` hides it. |
| `email`, `emailLabel` | sample | Shown beside the notebook and on the cover. |
| `socials`, `socialsLabel` | Instagram, LinkedIn, Are.na | `{ label, href }[]`. On the cover always; beside it on wide screens. |
| `availability` | `"Booking projects from January 2027"` | `null` hides it. |
| `reader`, `replyTime` | `"Ines Marlowe"`, `"two working days"` | Inside cover and receipt copy. |
| `questions` | Project, Budget, Timing | `{ id, tab, title, hint?, options, multiple?, optional? }[]`. One page each. |
| `detailsTab`, `detailsTitle`, `detailsHint` | `"You"`, … | The last page. |
| `nameLabel`, `namePlaceholder`, `emailFieldLabel`, `emailPlaceholder`, `messageLabel`, `messagePlaceholder`, `requireMessage` | | Field copy. |
| `openLabel`, `nextLabel`, `backLabel`, `submitLabel`, `pendingLabel`, `closeLabel`, `stampLabel`, `resetLabel` | | Button and stamp copy. |
| `insideNote` | generated | Inside-cover note. A function gets the page count. |
| `nextSteps` | three short lines | Listed on the receipt. `[]` hides it. |
| `receipt` | generated | Receipt copy. A function gets the brief. |
| `onSubmit` | fake 900 ms success | Resolve (optionally with a reference string) or throw an `Error`. |
| `preset` | `"kraft"` | `kraft`, `ink`, `cobalt`, `olive`. |
| `palette`, `darkPalette` | | Override any of `field`, `text`, `muted`, `cover`, `coverPrint`, `coverEmboss`, `coverText`, `paper`, `ink`, `rule`, `margin`, `highlight`, `onHighlight`, `pen`, `stamp`, `wire`. |
| `theme` | `"auto"` | `"auto"` follows `.dark` on an ancestor; or force `"light"` / `"dark"`. |
| `height` | `"100svh"` | Section minimum height. Any definite CSS length. |
| `defaultOpen` | `false` | Start on the first question. |
| `displayFont`, `textFont`, `monoFont` | system stacks | Pass `var(--font-…)` to use your site's fonts. A heavy display face suits the cover. |
| `id`, `className`, `style`, `ariaLabel` | | Passed to the `<section>`. |

## Notes

- Fonts: the display stack starts with Arial Black and Inter; the cover title is condensed by
  scaling, so any heavy sans works. If your site loads a condensed display face, pass it as
  `displayFont`.
- The section sets its own background (the preset's `field`). Put it on a page section of its own.
- Needs `color-mix()` (all evergreen browsers since 2023).
