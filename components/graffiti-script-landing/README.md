# Graffiti Script Landing

A poster-style landing hero with graffiti-calligraphy lettering. The headline is
hand-lettered in electric-blue sticker ink, with an orbit ring threaded through
it, sparkles, halftone corner blobs, a three-line masthead, outlined badges, side
labels on hairline stems and a credits block.

It opens with the [Graffiti Script Preloader](../graffiti-script-preloader):
alphabet rows roll, the counter hits 100, your word slams in, and the iris
closes onto the page while the headline inks itself in stroke by stroke. The
preloader and the lettering engine are included in this file, so it installs on
its own.

```tsx
import GraffitiScriptLanding from "@/components/ui/graffiti-script-landing"

<GraffitiScriptLanding
  title={["Nova", "Legends"]}
  date="20260924"
  event="STAR SCRIPT CUP · GRAFFITI"
  volume="VOL.01"
  sideLabel="HALO CREW"
  credits="KAI VANTA / REN / MIRA SOL"
  handle="@you"
/>
```

**No dependencies beyond React.** Nothing loads at runtime.

## Play with it

| Do this | And |
|---|---|
| Move the pointer | The headline tilts toward it and the blobs drift the other way |
| Hover a letter | It hops |
| Click the headline | Type new words (a `/` forces a line break), then press Enter and they ink themselves in. Escape cancels. |
| Click a planet, top right | The whole poster changes ink |
| Click the top-right badge | Re-inks the headline (or follows `badgeHref`) |
| Click **REPLAY** | Runs the preloader again |
| Click the paper | Throws a burst of sparkles |

## Props

| Prop | Default | Description |
|---|---|---|
| `title` | `["Nova", "Legends"]` | Headline, one string per line. A–Z are drawn; anything else becomes a space. |
| `date` / `event` / `volume` | `"20260924"` / `"STAR SCRIPT CUP · GRAFFITI"` / `"VOL.01"` | Masthead lines. |
| `sideLabel` | `"HALO CREW"` | Stacked label on both sides, one word per line. |
| `badge` / `badgeHref` | `"TEAM"` / — | Top-right badge; a link when `badgeHref` is set. |
| `replayLabel` | `"REPLAY"` | Bottom-left badge. |
| `creditsHeading` / `credits` / `handle` | `"MEMBER"` / `"KAI VANTA / REN / MIRA SOL"` / `"@KEDHARESWER"` | Credits block. |
| `ink` | `"#2f1ced"` | Starting ink. |
| `paper` | `"#f8f4ea"` | Paper colour. |
| `palette` | `["#2f1ced", "#e3262e", "#161616"]` | The three inks behind the planet buttons. |
| `intro` | `true` | Play the preloader first. |
| `introWord` | last title line | Word the preloader slams in. |
| `introDurationMs` | `5200` | Preloader length. |
| `editable` | `true` | Allow retyping the headline. |
| `height` | `"100svh"` | Root height. Always a definite length. |
| `className` | `""` | Extra classes on the root. |

## Notes

- The page sizes to its own box through container queries. Below 720px wide
  it re-flows for phones: the side labels drop out and the badges move to the
  bottom.
- The drawn headline is `aria-hidden`; a visually hidden `<h1>` carries the words.
  The swatches are toggle buttons (`aria-pressed`), and every control can be
  reached with the keyboard.
- `prefers-reduced-motion`: no tilt, drift, draw-in or sparkle bursts. The
  headline appears fully inked.
