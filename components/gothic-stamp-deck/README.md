# Gothic Stamp Deck

A sheet of perforated crimson-and-gold stamps. Pick one and the sheet clears:
that stamp comes forward to the middle of the component, its neighbours step
back to either side, and the rest leave. From there it is a horizontal deck —
arrows, swipe, wheel or trackpad move it along, and clicking the stamp turns it
over to read the back.

Every stamp is a holo card. It leans toward the pointer, a foil band and a
scatter of glitter run across the gold as it moves, and the focused stamp keeps
a faint sheen even at rest.

**No dependencies, no assets.** React is the only import. The nine
illustrations are drawn in code from a handful of path generators (tapered
ribbons, recursive trees, spires, arches, bat wings), so nothing is fetched.

## Usage

```tsx
import GothicStampDeck from "@/components/ui/gothic-stamp-deck"

<GothicStampDeck />

<GothicStampDeck
  title="Nocturne"
  script="for you"
  palette={{ ink: "#02060f", deep: "#0a1c3d", paper: "#173a78", bright: "#4d8dff", gold: "#e4dcc4" }}
  cards={[
    { title: "The Vow", scene: "oath", verse: "Said once,\nmeant always.", note: "First door" },
    { title: "Us", image: "/photos/us.jpg", verse: "Summer, 2024" },
  ]}
/>
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `cards` | nine stamps | `{ title, scene?, image?, verse?, note?, numeral? }`. Any count — the sheet re-grids itself. |
| `title` | `"Love Song"` | Set in gold over the sheet, and around the postmark on every back. |
| `script` | `"commission"` | Script word over the title and in the corner. `""` hides it. |
| `epigraph` | Sonnet I | Small italic line under the title. `\n` breaks. |
| `palette` | crimson | `{ ink, deep, paper, bright, gold }`. Every other colour is mixed from these. |
| `height` | `"100svh"` | Must be a definite length. |
| `tilt` | `14` | Largest lean toward the pointer, in degrees. |
| `foil` | `1` | Foil and glitter strength. `0` is a flat print. |
| `defaultIndex` | `null` | Open on this card instead of the sheet. |
| `onSelect` | — | Called with the focused index, or `null` when the sheet returns. |

### Cards

- `scene` — `murder`, `oath`, `wyrm`, `banquet`, `hour`, `heart`, `covenant`,
  `portrait`, `gambit`. Defaults to the scene at the card's position.
- `image` — your own picture instead of a scene. It is cropped to cover, tinted
  slightly toward the paper and vignetted so it sits on the sheet.
- `verse`, `note` — the back. `numeral` overrides the roman numeral.

## Controls

| | Sheet | Deck |
|---|---|---|
| Click / tap | open that stamp | the front stamp turns over; a side stamp comes forward |
| ← → | — | previous / next (wraps) |
| Wheel, trackpad, swipe | page scrolls normally | previous / next |
| Enter / Space | open | turn over |
| F | — | turn over |
| Esc | — | back to the sheet |

## Notes

- **One set of elements, two layouts.** The sheet and the deck are the same
  nine elements with different transforms, so opening a stamp is a single
  transition out of the grid rather than a second view fading in.
- **The deck goes the short way round.** Offsets are circular, and only a stamp's
  immediate neighbours are visible. The stamp that wraps from one end to the other
  crosses the whole width, and it is invisible at both ends, so it never streaks
  across the deck.
- **The perforation is a CSS mask on each face**, never on the element that
  flips: a mask flattens 3D on its own element, which would make the back
  unreachable. The hole spacing is stretched to divide each edge exactly, so
  every corner is punched and the pattern stays symmetric.
- **The wheel is only taken while a stamp is open.** On the sheet the page scrolls
  past normally.
- Sized by the stage's own box through a `ResizeObserver`, never the window, and
  never a percentage height.
- Every SVG id is scoped with `useId`, so two decks on a page do not paint each
  other's gold.
- `prefers-reduced-motion` stops the float and collapses the travel and the flip
  to a cut. Pointer tilt stays, because that motion is the reader's own.
- The verses are from Shakespeare's sonnets (public domain), which is also
  where the reference's "From fairest creatures…" comes from.

## Credit

Visual reference: the *Love Song* stamp commission by **AISHIGE** (Xiaohongshu).
The illustrations here are original drawings made in code after its motifs,
not copies of the artwork.
