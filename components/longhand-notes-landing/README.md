# Longhand Notes Landing

A complete landing page for a handwritten-notes service, where robots write
your cards with real pens. It is drawn in one line-art language: ribbed
tubes, coral motor housings, teal joints and coral dashed flight paths, on
grey paper and white card.

**The robots really write.** Every piece of handwriting on the page is set in
a single-stroke plotter hand and drawn stroke by stroke by a two-link arm
solved with inverse kinematics. The pen tip follows the exact path a pen
plotter would take, and lifts between strokes.

- **Hero.** *Typed by you. Penned + posted.* The plus is drawn in coral. An
  arm comes down from the ceiling, elbow up and to the right like a writing
  hand, and writes a letter in an open envelope. It waits, then writes the
  next one. Addressed and stamped envelopes are stacked beside it, a kraft
  card is propped in front, and an ink bottle feeds a spare pen arm.
- **Keys in, ink out.** An arm writes *ink out.* as you scroll in. Below it
  is a working composer: type in the phone and the arm writes as you type. It
  keeps what is already on the card and writes only what changed. Choose
  from three hands (script, casual, playful), three inks, eight cards and
  three pen paces (chalk cards switch to white gel pen). The meter shows
  progress and how long a person would take. *Send this note* calls
  `onSend`.
- **How it works.** Three line drawings joined by a dashed flight path that
  draws itself as you scroll, with an envelope riding it.
- **Cards.** A shop with category tabs (arrow keys work). Hover or tap a
  card (each one is a toggle button) and it turns over in place to show a
  handwritten inside. *Write on this
  card* loads it into the composer.
- **Integrations.** Five triggers (CRM, storefront, reviews, spreadsheet,
  API) as a vertical tablist. Each one shows its flow and a note with the
  merge fields filled in coral.
- **Pricing.** A volume estimator with the card type, a log-scale quantity
  slider that syncs with a number field, discount tiers, and a postage
  switch. A receipt shows the per-card price, the total and what the next
  tier would save, and the arm scrawls the discount in the margin. The
  hero's *from $2.55* is computed from the same data.
- **Customer notes, questions and samples.** Taped notes written in the
  casual hand as you swipe to them. Then an accordion with a handwritten
  sticky note pointing to the samples, and a dark samples
  band with *Thank you* written in chalk, a fan of sample cards and a
  validated form.

The nav is sticky. *Integrations* and *About* open dropdowns, and the
integration items open their recipe. There is a theme switch and a
focus-trapped phone menu.

```tsx
import LonghandNotesLanding from "@/components/ui/longhand-notes-landing"

<LonghandNotesLanding
  brand="penpal"
  palette="fountain"
  hero={{ title: "Close the deal.\nThen + write.", letterhead: "HOLLIS REALTY", card: "welcome", hand: "script", ink: "black" }}
  composer={{ hand: "casual", ink: "black" }}
  onSend={(note) => fetch("/api/notes", { method: "POST", body: JSON.stringify(note) }).then((r) => r.ok)}
  onRequestSamples={(email, company) => api.samples(email, company)}
/>
```

## Play with it

- `demo.tsx`: Longhand in the studio palette (coral and teal).
- `demo-fountain.tsx`: Penpal, thank-you cards for estate agents, in the
  fountain palette (cobalt and apricot). It has its own letters, composer
  defaults, products and samples copy.

Open `?dark` before the hash in the workshop for the night theme.

## Props

| Prop | Type | Default |
|---|---|---|
| `brand` | `string` | `"longhand"`. Written in the script hand as the logo. |
| `links` | `LnhLink[]` | Business, Features, Integrations ▾, Cards, Pricing, About ▾. `#write`, `#how`, `#cards`, `#integrations`, `#pricing`, `#stories`, `#faq` and `#samples` scroll within the page. |
| `signIn` / `signUp` | `{ label, href }` | `signIn: null` hides it. |
| `hero` | `{ title, cta, ctaHref, note, letterhead, address, envelopes, card, hand, ink, letters }` | In `title`, `"\n"` breaks the line and `" + "` becomes the drawn plus. In `note`, `"{price}"` becomes the lowest card price. `envelopes` are up to three addresses (`"\n"` between lines). `card` is the design propped in front (`"kraft"`). `hand` and `ink` are what the arm writes with (`"casual"`, `"blue"`). `letters` are `{ greeting, body, sign }`, and the arm writes them in turn. |
| `composer` | `{ eyebrow, title, text, greeting, message, signoff, hand, ink, maxLength, send } \| null` | `title` is what the arm writes. `null` hides the section. |
| `steps` | `{ title, items: { title, text }[] } \| null` | Three steps. |
| `cards` | `{ title, text, items: LnhCard[] } \| null` | Eight built-in covers. |
| `integrations` | `{ title, text, items: LnhRecipe[] } \| null` | Five recipes. |
| `pricing` | `{ title, text, products, tiers, postage } \| null` | Flat $3.40, folded $4.10, letter $4.90. Tiers at 50 (-10%), 250 (-18%) and 1,000 (-25%) cards. Postage $0.73. |
| `quotes` | `{ title, items: { quote, name, role }[] } \| null` | Four customer notes. |
| `faq` | `{ title, items: { q, a }[] } \| null` | Six questions. |
| `samples` | `{ title, script, text, button, done } \| null` | `script` is written in chalk. |
| `footer` | `{ columns, note } \| null` | |
| `currency` | `string` | `"$"` |
| `palette` | `"studio" \| "postal" \| "fountain" \| { accent, second, onAccent? }` | `"studio"` |
| `theme` | `"system" \| "light" \| "dark"` | `"system"` follows the host's `.dark` class, then the OS. |
| `themeToggle` | `boolean` | `true` |
| `onSend` | `(note: LnhNote) => unknown` | Return or resolve `false`, or throw, to show an error. Without it, sending is simulated. |
| `onRequestSamples` | `(email, company) => unknown` | Same contract. |
| `onStart` | `() => void` | Called by the *Start writing* buttons. |
| `height` | `string` | `"100svh"`: a definite floor for the hero, so it survives any host layout. |
| `className` | `string` | |

Types:

- `LnhCard { id, name, category, design?, image?, stock, price?, inside? }`.
  `design` is one of `hello`, `bloom`, `coast`, `kraft`, `congrats`,
  `birthday`, `sympathy`, `welcome`. `image` is your own cover URL.
  `stock` is `ivory`, `kraft` or `chalk`.
- `LnhRecipe { id, icon, source, trigger, detail, note, sample, sign }`. Put
  merge fields in braces in `note` (`{first_name}`), and give each field a
  value in `sample`.
- `LnhNote { greeting, message, signoff, hand, ink, card }`.
- Also `LnhProduct { id, name, size, base }` and `LnhTier { min, off }`.

## Notes

- **No dependencies, nothing loaded.** React only. The arms, cards and
  drawings are SVG. The hands are embedded stroke data (about 15 KB for
  all three). The type is the system serif (Iowan Old Style, Charter,
  Palatino, Georgia) and sans. There are no images, fonts or URLs, so it
  renders in 21st's capture sandbox. A card's `image` prop is the only way
  to add a remote asset.
- **How the writing works.** A layout step wraps and aligns the text and
  adds small baseline and size variations, like a real hand. They are seeded
  by character, so an unchanged prefix always lays out the same. Each frame,
  the arm draws its current stroke and travels pen-up to the next.
  Unwritten strokes stay hidden, so nothing is ever half-shown. Each arm
  runs only while it is on screen and sleeps once it has finished.
- **Reduced motion.** The notes appear already written, the arms rest, and
  the flight path is drawn in full. There are no reveals, no scroll smoothing
  and no marching dashes.
- **Accessibility.** A skip link and one `h1`. Every drawn note has a text
  equivalent (`aria-label` or visually hidden text). Radio groups for hand,
  ink, card, pace and product; tablists for the card categories and
  triggers; disclosure buttons for the questions; a modal phone menu;
  labelled form errors; and visible focus in the accent colour.
- **Copy and data are placeholders.** Longhand, Oak & Orris, the addresses,
  prices, customers and quotes are invented. Replace them through props.
- **Seeded once.** The composer fields and the pricing selection start from
  their props on mount, then belong to the visitor. To reset them from new
  props, change the component's `key`.
- **Hands:** EMS Allure, EMS Felix and EMS Elfin single-line fonts by Sheldon
  B. Michaels, SVG conversion by Windell H. Oskay (Evil Mad Scientist), SIL
  Open Font License 1.1, via the `hersheytext` package. They are
  re-encoded as compact strokes. One stray subpath in Elfin's `;` is
  dropped.
- Reference: the owner's screenshot of a handwritten-notes service, used for
  feel and layout only. No copy, brand or motifs are taken from it. See
  `media/longhand-notes-landing/`.
