# Concierge Morph Chat

A shop assistant in a floating launcher. The launcher is a round portrait in the
corner with a green presence dot, a slow halo and a greeting bubble. Press it and
the circle **morphs** into the chat panel. The panel has a header (portrait, name,
role, *New session*, `…`, ×), a large serif greeting, three suggestion chips, a
pill input and a "Powered by" line. Closing it morphs the panel back into the circle.

```
http://localhost:5173/#concierge-morph-chat          # storefront, closed — press the portrait
http://localhost:5173/#concierge-morph-chat/open     # open on load, re-dressed as a bookshop with its own onSend
http://localhost:5173/?dark#concierge-morph-chat     # the dark check
```

## The morph

Every moving part is a `transform`:

- **Surface**: the white panel scales out of the bottom-right corner on a spring.
  Height trails width a little, so the corner sweeps out on a curve. Its
  `border-radius` is divided by the current scale on every frame, so the corner
  always reads as a true circle and never smears into an ellipse. At rest that is
  exactly the 60px launcher circle.
- **Content**: the content is counter-scaled by the inverse of the surface scale,
  so text is never squashed. The surface clips it, so the panel looks *revealed*
  rather than stretched.
- **Portrait**: one element, outside the clip. It travels on a curved path from
  the centre of the launcher (48px) to the header slot (36px) and back.
- **Stages**: input, chips, greeting and header rise into place from the bottom
  up. Each stage finishes exactly as the surface lands.

The spring settles without bounce on close. `prefers-reduced-motion` jumps
straight to the end state and turns off every keyframe.

## Interaction

- **Chips / send**: send a message. Pressing send with an empty input sends the
  placeholder line currently shown, so the placeholder doubles as an example prompt.
- **Placeholder**: rolls through `placeholders` while the input is empty.
- **Replies**: a typing indicator, then the answer fades in word by word. A reply
  can carry `products`, shown as a swipeable shelf of cards (pressing a card asks
  about it), and `suggestions`, which replace the chips.
- **New session**: clears the thread, drops any in-flight reply, restores the chips.
- **`…` menu**: *Copy transcript*, plus any items you pass; an item can `send` a
  message or run `onSelect`.
- **Closing**: the × button or `Escape`. Focus goes back to the launcher. While
  the panel is closed it is `inert`. The launcher reports `aria-expanded`.

Without `onSend`, a built-in concierge answers. It handles greetings, new
arrivals, linen/summer, dresses, under-$80, sizing, shipping & returns, try-on
and "talk to a person", with a small drawn catalogue. Pass `onSend` to connect
your own backend or LLM.

## Props

| Prop | Default | Notes |
|---|---|---|
| `name` / `role` | `Lana` / `Assistant manager` | The role truncates with an ellipsis. |
| `avatar` | drawn portrait | Image URL or any node (rendered at 36px). |
| `online` | `true` | Green presence dot. |
| `greeting` | `Hi, I'm Lana — …` | Bubble beside the closed launcher; `null` turns it off. |
| `title` / `intro` | "I can help you / find what you need." + 3 lines | Empty-state copy. |
| `suggestions` | Let me explore · What's new? · Try on live | Up to three chips. |
| `placeholders` | 4 lines | Roll through the empty input. |
| `onSend` | built-in concierge | `(text, history) => reply \| string \| Promise<…>`; reply is `{ text, products?, suggestions? }`. |
| `onNewSession` | — | Called after the thread clears. |
| `menuItems` | Copy transcript · Shipping & returns · Talk to a person | `{ label, send?, onSelect? }[]` |
| `brand` | `{ name: "atelier" }` | Footer; `mark` replaces the knot. `null` drops it. |
| `mark` | knot | Small mark above the headline. |
| `open` / `defaultOpen` / `onOpenChange` | uncontrolled, closed | Controlled or uncontrolled. |
| `placement` | `fixed` | `absolute` sits in the nearest positioned parent. |
| `offset` | `24` | Gap to the right and bottom edges, px. |
| `width` / `height` | `min(420px, 100vw - 32px)` / `min(680px, 100svh - 48px)` | Any definite CSS length. |
| `accent` / `accentInk` | `--color-primary` / `--color-background` | Send button and your own bubbles. |
| `surface` | `--color-background` | Panel colour. |
| `serif` | Tiempos / Newsreader / … / Georgia | Headline font stack. |

`ConciergeProduct` is `{ name, price?, color?, kind?: "shirt" | "trousers" | "dress" | "tote", image? }`.
Without an `image`, the garment is drawn in SVG over a wash of `color`.

## Install notes

Self-contained: React is the only import, and there are no remote assets. The
portrait, the knot mark, the garments and the icons are all inline SVG, and all
CSS is scoped under `.cmc-`. Colours come from the semantic tokens
(`--color-background`, `--color-foreground`, `--color-muted-foreground`,
`--color-border`, `--color-primary`), with fallbacks, so it follows the host's
light/dark theme.

The fonts are named, not imported. Without them the headline falls back to
Georgia and the UI to the system sans, and the layout stays the same. Below 350px
of panel width (a container query) *New session* collapses to its icon.
