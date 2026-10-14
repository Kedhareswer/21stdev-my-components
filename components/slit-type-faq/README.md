# Slit Type FAQ

A frequently-asked-questions section set in one ink on one paper. The display headline is
cut by a hard horizontal slit: its capitals rise into the slit as the section scrolls in and
rest there, cut through, like a stencil pulled before the print is finished. Hovering the
headline lifts the letters clear. The questions sit on full-width ruled rows.

**Opening a question:** ink floods the row from the left, edge to edge, and the question
inverts exactly where the edge passes, because a paper-coloured copy of the row is clipped in
step with the ink. The answer is printed in paper colour, so the flood is what reveals it.
Closing wipes the ink out to the right. The + turns into an x. On a mouse, hovering a closed
question floods the square behind its + (the same flood in miniature) and nudges the question
along.

- A real accordion: each question is a `<button>` inside an `<h3>` with `aria-expanded` and
  `aria-controls`, and each answer is a labelled `region`. ↑ ↓ Home End move between
  questions. Closed answers are out of the tab order.
- `type="single"` (default) or `"multiple"`, `defaultOpen` by index or id, or fully
  controlled with `open` + `onOpenChange`.
- Every question has an id (a slug of the question, or your own `id`). A `#hash` that names
  one opens it and scrolls it into view; open answers carry a **Copy link** button; `syncHash`
  writes the open question into the URL.
- Search across questions and answers, with every word matched in any order and the matches
  marked. When a match is in an answer, a short excerpt around it appears under the question. Esc clears it, ↓ jumps to the first result, and an empty result offers to show
  every question again.
- Optional category chips with live counts, and an optional ticker between rules.
- Light and dark versions of every preset. `theme="auto"` follows a `.dark` class on any
  ancestor (the shadcn / Tailwind convention).
- Under `prefers-reduced-motion` the headline is simply there, the ticker stands still and
  the flood is instant.

No dependencies, no images, no web fonts. Styles are scoped to `.stf` in one inline `<style>`.
The section sizes to its questions (`minHeight` 0); pass `minHeight="100svh"` to make it fill a
screen.

## Props

| Prop | Default | |
|---|---|---|
| `items` | 8 questions for a risograph print shop | `{ question, answer, answerText?, category?, id? }[]`. `answer` is any node; give `answerText` for search when it is not a string (otherwise its text is extracted). |
| `headline` | "Before you\nsend files" | Set in capitals. `\n` breaks the line. Pass `""` to drop it. Screen readers get it as one plain string. |
| `slit` | `0.42` | Share of each capital hidden by the slit at rest, `0` to `0.5`. `0` sets the headline whole. |
| `intro` | one line about riso | Any node, shown beside the search. |
| `preset` | `"signal"` | `signal` (red on white), `cobalt`, `moss`, `carbon`. Each has a designed dark version. |
| `palette` / `darkPalette` | none | Override `paper`, `ink`, `onInk`. Without `onInk`, the text on the flood is picked for 4.5:1 contrast. |
| `theme` | `"auto"` | `"auto"`, `"light"` or `"dark"`. |
| `type` | `"single"` | `"single"` closes the open question when another opens. |
| `defaultOpen` | `0` | Index, id, or a list of both. `[]` for none. |
| `open` | none | Controlled list of open ids. Pair with `onOpenChange`. |
| `idPrefix` | `""` | Prefixed to every id, so two FAQs on one page never share a `#hash`. |
| `search` / `searchLabel` | `true` / "Search the answers" | |
| `categories` | none | Chip labels matched against `item.category`. Omit to hide the chips. |
| `ticker` | none | Short phrases that run between rules under the headline. Pauses on hover. |
| `contact` | "Still have a question?" + mail link | `{ prompt, label, href }` or `null`. |
| `copyLinks` | `true` | Copy-link button in each open answer. |
| `syncHash` | `false` | Write the open question's id into `location.hash`. |
| `minHeight` | `0` | Any CSS length. |
| `displayFont` / `textFont` | Helvetica Neue, Inter, Arial Black / Arial | Pass your own stacks, e.g. `"var(--font-sans)"`. The headline wants a heavy weight (800 to 900). |
| `onOpenChange` | none | Called with the ids of the open questions. |
| `className`, `style`, `ariaLabel` | | |

## Usage

```tsx
import SlitTypeFaq from "@/components/ui/slit-type-faq"

<SlitTypeFaq
  preset="moss"
  headline={"Good to know\nbefore you book"}
  intro="Everything about stays, check-in and the sauna, in one place."
  contact={{ prompt: "Something else?", label: "Message the front desk", href: "/contact" }}
  items={[
    { question: "When is check-in?", answer: "From 3 pm. Early check-in is free when the room is ready." },
    { question: "Is the sauna included?", answer: <p>Yes, every evening from 5 to 10. <a href="/sauna">Book a slot</a>.</p>, answerText: "Yes, every evening from 5 to 10. Book a slot." },
  ]}
/>
```

## Demos

- `demo.tsx`: the default, a riso print shop's "Before you send files" in signal red.
- `demo-cobalt.tsx`: a restaurant rota app's FAQ in cobalt, with category chips, a ticker,
  a rich answer with a link, a question opened by id and `syncHash`.

## Reference

Built from the feel and layout of the table-of-contents section on learntype.eu (signal red on
white, a sliced display headline, ruled rows with thin + toggles). No brand, copy or images
were taken from it.
