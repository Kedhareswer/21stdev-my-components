# card-flight-header

A floating pill nav whose menus open as cards that fly out of the nav item. Hover or focus
**Studio** and the item turns into a black pill, a pale wash wipes down behind the nav, and
three pastel link cards leave the pill as small translucent ghosts, arc over the nav and
land one after another in a row: art on top, an arrow button, title and a short line under
it. Moving to another item re-launches its own cards from that item. Leaving the header,
clicking the open item again or pressing Escape closes it.

## Props

| Prop | Default | Notes |
|---|---|---|
| `brand` | `{ mark: "K", name: "Kedhar", href: "#" }` | Square mark plus name. Below 560 px only the mark shows. |
| `menus` | Work / Journal / Studio | Up to three menus of up to three cards: `{ title, sub, href?, art }`. `art` is one of `circles`, `frame`, `grid`, `arch`, `stripes`, `dots`, `lines`, `wave`, `ring`. |
| `autoPlay` | `false` | Opens Studio, Work and Journal in turn until someone interacts. The demo turns it on. |
| `defaultOpen` | `-1` | Index of a menu open on mount. |
| `panelHeight` | `"min(560px, 78svh)"` | Minimum height of the drop-down wash. |
| `className`, `style` | – | |

Placeholder copy describes Kedhareswer: Client 1/2/3 under Work, and Contact mails
kedhareswer.12110626@gmail.com.

## Notes

- No dependencies beyond React; the flight is CSS only. Nav items have fixed widths, so each
  card knows where its item sits from container units (`cqw`) alone, with no measuring.
- The header is `width: 100%` and the panel overlays whatever sits below it. The nav, wash and
  cards carry their own light palette, so it reads on dark and light pages.
- Real buttons with `aria-expanded`, cards are links, visible focus rings, Escape closes.
- Below 560 px the cards stack as rows with a small art tile.
- `prefers-reduced-motion`: no wipe or flight; the cards fade in.
