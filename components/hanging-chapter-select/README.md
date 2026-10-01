# Hanging Chapter Select

A dreamy, game-style chapter picker. Poster cards **hang on pink strings** over a
cream lattice wall, swaying in an idle breeze. Drag, flick or scroll the line and
every card **swings like a pendulum** before it settles. Click the card in front
and it lifts off its string into a **reading letter** with an airmail border. A
bottom tab bar swaps the whole line, and the new cards drop in on their strings.
A bag keeps the cards you save, and a credits strip closes the page.

```tsx
import HangingChapterSelect from "@/components/ui/hanging-chapter-select"

<HangingChapterSelect
  title="SUMMER READING"
  script="one page at a time"
  tabs={[
    {
      label: "Books",
      sub: "Shelf",
      icon: "bloom",
      cards: [
        { title: "Tide", subtitle: "Stories from the coast", tag: "June", tagSub: "Week 1", art: "bouquet", progress: 1 },
        { title: "Glass", subtitle: "A novel in windows", tag: "June", tagSub: "Week 3", art: "window", progress: 0.35 },
        { title: "North", subtitle: "Letters from the ice", art: "frost", locked: true, lockHint: "Opens on 15 July" },
      ],
    },
  ]}
  palette={{ paper: "#eef4f1", pink: "#f08a74", leaf: "#5f9e7a" }}
  onOpen={(card) => router.push("/read/" + card.title)}
/>
```

**No dependencies beyond React.** All eight poster styles, the palm fronds,
vine, light leak, airmail stripes and stamps are SVG and CSS built from seeded
numbers, so the server and the client draw the same thing. No fonts, images or
stylesheets are loaded. Pass `image` on a card to use your own picture.

## Play with it

| Do this | And |
|---|---|
| Drag or flick the line | It follows your finger and resists past either end. Release and it settles on a card, with every card swinging from the push |
| Mouse wheel / trackpad | Scrolls the line. At either end the page scrolls again, so it never traps you |
| Brush the mouse across the strings | The cards under the pointer get a nudge |
| Click a card at the side | It comes to the front |
| Click the front card | It lifts off its string and opens as a letter: synopsis, chips, progress, *Begin reading* / *Continue*, *♡ Keep* |
| Click a locked card | It shakes on its string and a toast says why it's locked |
| Hover a card | It tilts toward the pointer and a sheen follows |
| Tabs at the bottom | The line swaps, and the new cards drop in and bounce on their strings |
| The bag, top left | Shows only the cards you kept. Its badge counts them |
| `←` `→` `Home` `End` | Move along the line (roving focus). `Enter` opens, `Esc` closes |

## Props

| Prop | Default | Description |
|---|---|---|
| `title` | `"BOOKS AND FILMS"` | The huge outlined word across the top of the wall. |
| `script` | `"This is a girl"` | The handwritten line in the corner. |
| `tabs` | 5 tabs (篇章 Chapters, 随笔 Essays, 资源 Library, 挑战 Challenges, 周常 Weekly) | `{ label, sub?, icon?, cards }[]`. `sub` is also the big ghost word behind the cards. `icon` is `"bloom" \| "quill" \| "swirl" \| "badge" \| "camera" \| "star"`. |
| `tabs[].cards` | | `{ title, subtitle?, tag?, tagSub?, art?, colors?, image?, description?, meta?, progress?, locked?, lockHint?, href? }[]`. See below. |
| `initialTab` | `0` | Section shown first. |
| `initialIndex` | middle card | Card in front on first paint. |
| `credits` | 3 items | `{ label, sub?, value, href? }[]` in the bottom strip, or `false` to hide the strip. |
| `brand` / `brandSub` / `site` | Kedhar, … | Left and right of the credits strip. |
| `qrImage` | decorative | A real QR code image (any URL). Without it a decorative, **non-scannable** code is drawn. `false` hides it. |
| `palette` | cream & pink | `{ paper, ink, pink, blue, leaf }`: wall, text, strings and ribbons, airmail stripes, leaves. |
| `leaves` | `true` | Palm fronds and the vine in the corners. |
| `breeze` | `true` | Idle sway. Cards still swing when you move them. |
| `animateIn` | `true` | Cards drop in on first paint and on every tab change. |
| `onBack` | | The back arrow. Without it, the arrow leaves the bag view or returns to the first card. |
| `onOpen` | | `(card, tabIndex, cardIndex)`, called by the letter's main button. Without it (and without `href`) a toast wishes you happy reading. |
| `onKeepChange` | | `(keys)` with `"tab:index"` keys, whenever a card is kept or removed. |
| `height` | `"100svh"` | Always a definite length. |
| `className` | `""` | Extra classes on the root. |

### Cards

| Field | Description |
|---|---|
| `title` | Big text on the poster. Chinese, Japanese and Korean titles stack two characters to a row (or run vertically); Latin titles keep their words, or run down the poster like a book spine. |
| `subtitle` | Small line on the poster, and the italic line in the letter. |
| `tag` / `tagSub` | The ribbon label under the card, e.g. `第一章` / `Chapter I`. Leave out for no ribbon. |
| `art` | `"brush"` calligraphy · `"bouquet"` spring flowers · `"window"` summer sky · `"silhouette"` autumn profile with ginkgo · `"frost"` winter tiles and stars · `"figure"` a girl in the distance · `"notes"` lined paper · `"film"` a film strip. Cycles through them if omitted. |
| `colors` | `{ bg, ink, accent }`. Whatever you leave out comes from that poster style's own colours. |
| `image` | Your own picture, cropped to the poster (replaces `art`). |
| `description`, `meta` | The letter's body and chips. The silhouette and frost posters also print the first words of `description` as small print. |
| `progress` | 0–1. A thin bar on the card, a bar and "60% read" in the letter, and the button reads *Continue*. |
| `locked`, `lockHint` | Frosted with a lock. Clicking shakes it and shows `lockHint`. |
| `href` | The letter's main button becomes a link. |

## Notes

- **Placement.** A full-bleed stage, `height` tall and as wide as its parent.
  It's a size container (`container: hc / size`), so cards, type and the
  drop-in are all sized in `cq` units against the stage, not the viewport.
- **Small screens.** Under 760px wide, the cards get bigger and closer together,
  the arrows hide (swipe instead), tab labels lose their English line, and the
  credits strip keeps only the first item. Under 460px it keeps only the brand
  and the code. The open letter stacks under its poster.
- **Fonts.** It uses the system stack: Songti / Noto Serif CJK for titles, and a
  script face (Snell Roundhand, Segoe Script, Brush Script) for the handwritten
  lines. A CJK font is on every modern OS, and missing faces fall back to serif.
- **Theming.** It's art-directed, so the palette is its own. The wall is mixed
  10% toward `--color-background`, so in dark mode it sits dimmer instead of
  glaring.
- **Accessibility.** The line is a labelled carousel with roving focus. Tabs are
  a real `tablist`. The letter is a modal dialog that takes focus, leaves the
  page behind `inert`, closes on `Esc` and gives focus back to its card. Toasts
  are announced through a `status` region.
- **`prefers-reduced-motion`.** No sway, swing, drop-in, light-leak drift or leaf
  sway. The line jumps straight to the chosen card and the letter opens without
  flying.
