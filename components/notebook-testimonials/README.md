# Notebook Testimonials

Quotes on torn-out notebook paper, pinned up at angles. Hover straightens a
sheet and lifts it off the wall.

**No dependencies.** React is the only import, every style is inline, and there
is no CSS file.

## The two bits of CSS that matter

**The holes are really holes.** A solid rectangle minus a column of circles,
composited with `subtract` — so whatever is behind the card shows through them,
rather than them being grey dots painted on top:

```ts
maskImage: "linear-gradient(#000, #000), radial-gradient(circle, #000 40%, transparent 0)",
maskSize:  "100% 100%, 18px 36px",
maskComposite: "subtract",
```

**The writing sits on the rules** because the ruled-line pitch and the text's
`line-height` are the same number — `rowSize`. Any other pairing looks correct
in a screenshot with a two-line quote and drifts apart as soon as someone
writes a longer one, which is the sort of bug that ships.

The drop shadow lives on the *wrapper*, not the sheet: a filter on the masked
element traces every punched hole instead of the outline of the page.

## Usage

```tsx
import NotebookTestimonials from "@/components/ui/notebook-testimonials"

<NotebookTestimonials items={items} />
<NotebookTestimonials items={items} tilt={7} seed={4} cardWidth={300} />
<NotebookTestimonials items={items} tilt={0} punchHoles={false} />  // plain cards
```

```ts
type Testimonial = {
  quote: string
  handle?: string
  rating?: number   // 0-5
  date?: string
  accent?: string
}
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `items` | — | Required. |
| `cardWidth` | `320` | Card width in px. |
| `rowSize` | `36` | Ruled-line pitch **and** the text's line-height. |
| `minRows` | `5` | Minimum ruled lines, so a short quote still looks like paper. |
| `tilt` | `5` | Largest tilt in degrees. `0` lays them flat. |
| `seed` | `1` | Which arrangement of tilts. Change it to reshuffle. |
| `overlap` | `0` | Overlap between neighbours, in px. See below. |
| `punchHoles` | `true` | The mask. |
| `interactive` | `true` | Straighten and lift on hover. |
| `paper`, `ink` | `#f1efeb`, `#222222` | |
| `accents` | five | Cycled across the cards; an item's `accent` wins. |
| `fontFamily` | typewriter stack | See below. |
| `className` | `""` | Appended to the root. |

`shuffle`, `tiltFor` and `accentFor` are exported, so an arrangement can be
reproduced elsewhere.

## Notes

- **The font.** The pen pulled Special Elite off Google Fonts with an
  `@import`. A component cannot do that — loading a font is the host page's
  job — so `fontFamily` defaults to a typewriter stack ending in Courier, and
  uses Special Elite if your app already loads it. That one line is the whole
  difference between this looking hand-typed and looking like Courier.
- **Tilts are deterministic**, hashed from the index and `seed`. `Math.random()`
  here would place the cards differently on the server and in the browser, and
  React would throw the markup away on hydration.
- Signs alternate so the row zig-zags instead of leaning as a block, and no
  card lands within 45% of flat — one upright sheet among tilted ones reads as
  a bug rather than as chance.
- **`overlap` defaults to 0.** The stars and the date sit against the right
  edge of each sheet, and a rotated neighbour sweeping over that corner hides
  them. Turn it up for a tighter pile if your cards carry less in the margins.
- A hovered card rises above its neighbours, so straightening never tucks it
  under the next one.
- `prefers-reduced-motion` drops the hover transition.
- Quotes are `<blockquote>` inside `<figure>`, the attribution is a
  `<figcaption>`, and the stars carry an `aria-label` — they are decoration to
  a screen reader otherwise.
- Cards grow past `minRows` rather than clipping, so a long quote is safe.

## Credit

Ported from **[notebook testimonials](https://codepen.io/vii120/pen/wBgEgQO)**
by [vii120](https://codepen.io/vii120). The mask and the ruled-line trick are
theirs. The port turns the three hard-coded cards into a list with deterministic
tilts, drops the `@import` and the global resets, and adds the quote semantics
and reduced-motion path a page expects.
