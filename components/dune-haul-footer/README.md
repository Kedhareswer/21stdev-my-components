# Dune Haul Footer

A soft, sun-baked site footer. A floating white card holds the brand, link
columns and socials. Behind it, a valley of rounded apricot dunes dotted with
tiny wildflowers rolls down to a winding road, and a little articulated truck
hauls along it toward you.

## Storyboard

1. **Arrive.** When a sixth of the footer is on screen, the horizon glow warms
   up and the dunes rise out of the ground in a stagger, back to front.
2. **Shrubs.** Two round shrubs pop up on the far crests with a little
   overshoot.
3. **Pave.** The road lays itself down from the far crest to your feet. It is
   built on a real ground plane and projected, so it narrows true to perspective
   and never folds on the tight far bend.
4. **Card.** The card floats up. The brand, column headings, links, rule,
   copyright and socials settle out of a soft blur one after another.
5. **Haul.** The truck crests the horizon, grows as it winds closer, says hello
   with a "HONK!" bubble a third of the way in, kicks up a little dust and
   slips out behind the near dune. Then it comes round again. The cab always
   faces you while the trailer swings behind it with each bend and foreshortens
   as the truck comes straight at you.
6. **Live.** The dunes sit at five depths. Scrolling the footer into view lifts
   the near ones faster than the far ones, and the pointer shifts them in
   parallax. Click the truck (a real, focusable button) and it honks for real
   through Web Audio, bounces, flashes its lights and puts its foot down.
   Hover the brand and the mark's headlamps blink. Links draw an accent
   underline, and the social buttons lift and fill.

The reveal plays once. It does not replay on resize or theme change.

**No dependencies.** React is the only import. Every shape is SVG drawn in the
file, with no images, fonts or sounds fetched, so it recolours with a palette
and survives installation. The horn is synthesised.

```tsx
import DuneHaulFooter from "@/components/ui/dune-haul-footer"

<DuneHaulFooter />

<DuneHaulFooter
  preset="sage"
  name="Greenlane"
  honk="Toot toot!"
  tripSeconds={14}
  columns={[
    { title: "Farm box", links: [{ label: "This week", href: "/box" }, { label: "Our growers" }] },
    { title: "Help", links: [{ label: "FAQ" }, { label: "Contact", href: "mailto:hello@greenlane.farm" }] },
  ]}
  socials={[{ icon: "instagram", href: "https://instagram.com/…" }, { icon: "github", href: "https://github.com/…" }]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `name` / `brandHref` | `"Dunehaul"` / `"#"` | Brand beside the mark. |
| `logo` | truck mark | Any node to replace the built-in mark. |
| `columns` | Explore · App · Legal Pages | `{ title, links: { label, href? }[] }[]` |
| `socials` | Facebook · X · Instagram · LinkedIn | `{ icon: "facebook" \| "x" \| "instagram" \| "linkedin" \| "github" \| "youtube", href?, label? }[]` |
| `copyright` | `© <year> <name>. All rights reserved.` | |
| `preset` | `"auto"` | `auto` (apricot, or dusk under `.dark`) · `apricot` · `rose` · `sage` · `dusk` |
| `palette` | — | Overrides merged over the preset: `sky`, `glow`, the five dune layers `far` → `near` (each `[light, mid, shadow]`), `shrub`, `specks`, `road`, `roadEdge`, `roadShade`, `truck` (partial), `card`, `ink`, `muted`, `line`, `accent`, `accentInk`, `night`. |
| `seed` | `11` | Which scatter of wildflowers (and stars) to grow. |
| `tripSeconds` | `11` | Horizon to your feet. |
| `honk` | `"HONK!"` | The word in the bubble. |
| `greet` | `true` | One unprompted honk on the first trip (visual only, no sound). |
| `sound` | `true` | Play the horn when the truck is clicked. Never plays unprompted. |
| `parallax` | `true` | Scroll and pointer parallax on the dunes. |
| `maxWidth` | `"1040px"` | Widest the card gets. |
| `fontFamily` | Inter → system | Faces come from the host page. |
| `height` | `"780px"` | A definite length. The footer grows past it when the card needs more room. |
| `sceneMinHeight` | `"300px"` | Landscape always kept clear under the card, e.g. on phones. |

## Notes

- **Performance.** Each dune layer is its own SVG, painted once and moved with
  a composited `transform`. Per frame, only the truck's few paths and the dust
  change. The loop sleeps off-screen.
- **Accessibility.** The scene is `aria-hidden`. Every link is a real anchor
  with a visible focus ring. The icon-only social links carry names, and the
  truck is a named `<button>` that follows it, so keyboard users can honk too.
- **Reduced motion.** Everything appears at once, the truck parks mid-valley,
  and parallax and dust are off. Clicking still honks, with a plain fade on
  the bubble.
