# Bubble Graffiti Landing

A full-bleed landing page in bubble graffiti. Blue balloon letters sit over a
black slab on a cream grid. Around them: inflatable white blobs down both edges,
a ribbon, a cloud puff, hard black pixel blocks, a starburst, a crowned black
wordmark, thin service lines, and a big `20²⁴ until ₂₆` year range whose digits
roll in like a slot machine. On top sits a pill nav with a search field and a
menu.

It opens with the **bubble-graffiti preloader**. Dozens of letters swirl into
the word, a counter runs to 100, then a pixel wipe cuts to the page. The
page's first frame is the same drawing as the preloader's last, because both
components share one drawing engine.

| Do this | And |
|---|---|
| Tap a balloon letter | It squishes and throws sparkles |
| Drag a letter | It follows you, then springs back |
| Tap the starburst or the wordmark | The whole word hops, letter by letter |
| Hover a pixel block / the cloud | It jumps / puffs |
| Move the mouse | The slab, the blobs and the pixels drift at different depths |
| Hover a service line | A balloon-blue marker swipes under it |
| Menu button | Opens a sheet with every link; Esc or a click outside closes it |

No image, font file or npm dependency beyond React. Every letter is drawn.

## Usage

```tsx
import BubbleGraffitiLanding from "@/components/ui/bubble-graffiti-landing"

<BubbleGraffitiLanding />

<BubbleGraffitiLanding
  intro={false}
  word="pop!"
  brand="nocturne"
  tagline="drawn in code, lit at night"
  nav={[{ label: "Work", href: "/work" }, { label: "About", href: "/about" }]}
  menu={[{ label: "Contact", href: "mailto:hi@you.dev" }]}
  servicesTop={["Motion", "Type Design"]}
  servicesBottom={["Brand Systems", "Art Direction"]}
  from="2019"
  to="2026"
  studio="/ after hours studio"
  palette={{ paper: "#121216", ink: "#f3efe3", balloon: "#ff6fae", shine: "#fff7fb" }}
  onNavigate={(label) => console.log(label)}
  onSearch={(q) => console.log(q)}
/>
```

## Props

| Prop | Default | What it does |
|---|---|---|
| `word` | `"hello"` | The big balloon word. Four to seven characters fill the slab best. A–Z, 0–9 and `! ? . -` are drawn; anything else becomes a space. |
| `brand` | `"kedhar"` | The crowned black wordmark. Clicking it makes the word hop. |
| `tagline` | `"made with no asset"` | Mono line under the brand. |
| `nav` | Home, About me, Project | `{ label, href? }[]`. With no `href` a link only sets the active pill and fires `onNavigate`. Narrow screens move these into the menu. |
| `menu` | Playground, Contact | Extra entries that only appear in the menu. |
| `servicesTop` / `servicesBottom` | Photo Graph, Video Edit / Graphic Design, Illustration | The thin lines on the right and the lower left. |
| `from` / `to` / `until` | `"2024"` / `"2026"` / `"until"` | The year range. Shared leading digits are set once, big (at most all but two). |
| `studio` | `"/ playmode creative"` | Mono credit under the years. |
| `searchPlaceholder` | `"search here"` | |
| `intro` | `true` | Play the preloader first. |
| `introDuration` | `4200` | Its length in ms. |
| `palette` | cream / ink / blue | `{ paper, ink, balloon, shine, grid }`, shared with the intro. |
| `height` | `"100svh"` | Must be a definite length. |
| `minHeight` | `"600px"` | |
| `onNavigate` | — | `(label, index)` on every nav or menu click. |
| `onSearch` | — | Called with the trimmed query on Enter. |
| `onReady` | — | Fires once the intro has cleared, or on mount when `intro={false}`. |
| `className` | — | On the root `<section>`. |

## Notes

- The layout is sized with container query units off the root, not the
  viewport, so it holds up at any size. Below 700px wide the pills fold into
  the menu, the search shrinks to an icon until focused, and the drawing
  recomposes for a tall screen.
- Styles are in two scoped `<style>` blocks (`.bgk-*` for the shared engine,
  `.bgl-*` for the page). There are no global resets, and the root sets
  `max-width: none` on its SVGs, so Tailwind Preflight can't shrink them.
- `touch-action: none` is set on the balloon letters only, so a phone can
  still scroll past the hero.
- `prefers-reduced-motion` drops the storm, marquee, parallax and edge
  morphing. Every entrance jumps to its final frame.
- The word is an `role="img"` SVG labelled with the word, and the page has a
  visually hidden `<h1>`. Letters and the star are keyboard-reachable buttons
  (Enter/Space).
