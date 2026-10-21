# Ridgeline Dither Footer

A quiet site footer over a range of mountains printed in ordered dither. Six
ridges, each grown from ridged noise, recede into valley mist that drifts slowly
across them, and the whole range dissolves upward into the paper behind the
copyright line. Above it: the brand, a tagline, social icons and tracked link
columns inside a hairline frame.

## Storyboard

1. **Arrive.** When a fifth of the footer is on screen, the frame's two hairline
   guides draw down.
2. **Type.** The brand, tagline and socials, then each column's heading and
   links, rise out of a soft blur in a stagger.
3. **Develop.** The range comes up back to front. Each ridge climbs a few
   pixels while its dither threshold sweeps from paper to full tone, so the dots
   arrive in their ordered pattern like a print coming up in the tray.
4. **Lift.** The whiteout of mist thins away and the copyright line settles in.
5. **Live.** The mist keeps drifting. Move over the range and the pointer parts
   the mist like a lantern, the ridges shift in parallax by depth, and an
   altimeter reads off the crest beneath you. Click and a gust sweeps the mist
   sideways. Hover the credit and its heart beats; hover the logo and its mist
   bands slide apart.

The reveal plays once. It does not replay on resize or theme change.

**No dependencies.** React is the only import. One pixel-scaled 2D canvas for the
range, real anchors for every link, nothing fetched.

```tsx
import RidgelineDitherFooter from "@/components/ui/ridgeline-dither-footer"

<RidgelineDitherFooter />

<RidgelineDitherFooter
  preset="glacier"
  seed={23}
  name="Northwall"
  tagline="Expedition planning for teams who go further."
  columns={[
    { title: "Plan", links: [{ label: "Routes", href: "/routes" }, { label: "Forecasts", badge: "New" }] },
    { title: "Company", links: [{ label: "About" }, { label: "Contact", href: "mailto:hi@northwall.co" }] },
  ]}
  socials={[{ icon: "instagram", href: "https://instagram.com/…" }, { icon: "github", href: "https://github.com/…" }]}
  credit={{ label: "Basecamp Studio", href: "https://…" }}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `name` / `brandHref` | `"Larchwood Labs"` / `"#"` | Brand beside the mark. |
| `logo` | ridge mark | Any node to replace the built-in mark. |
| `tagline` | "Join thousands of teams…" | `""` hides it. |
| `columns` | Product · Company · Legal | `{ title, links: { label, href?, badge? }[] }[]` |
| `socials` | X · Instagram · LinkedIn | `{ icon: "x" \| "instagram" \| "linkedin" \| "github" \| "youtube", href?, label? }[]` |
| `copyright` | `© <year> <name>, Inc. All rights reserved.` | |
| `credit` | `{ label: "Makora Studio" }` | "Made with ♥ by …". `null` hides it. |
| `preset` | `"auto"` | `auto` (evergreen, or night under `.dark`) · `evergreen` · `glacier` · `dusk` · `sepia` · `night` |
| `palette` | — | `{ paper, ink, muted, line, heart, tones }` overrides. `tones` runs mist → deepest ridge, first one the paper. 5–8 tones dither best. |
| `seed` | `7` | Which range to generate. |
| `ridges` | `6` | Ridges receding into the mist, 2–9. |
| `pixel` | `2` | One dither pixel in CSS px. `3` reads chunkier and more printed. |
| `mist` | `0.8` | Thickness of the drifting mist, 0–1. |
| `drift` | `1` | Mist speed. `0` holds it still and lets the canvas sleep. |
| `radius` | `130` | Size of the pointer's clearing, in CSS px. |
| `interactive` | `true` | Parallax, mist clearing and the click gust. |
| `altimeter` | `true` | Crest altitude readout under the pointer. |
| `maxWidth` | `"1120px"` | Widest the framed content gets. |
| `fontFamily` / `monoFamily` | Inter → system / JetBrains Mono → system | Faces come from the host page. |
| `height` | `"680px"` | A definite length. The footer grows past it when its content needs more room. |
| `sceneMinHeight` | `"260px"` | The least height the range itself gets, e.g. on phones. |

## Notes

- **Performance.** The range is drawn at one canvas pixel per dither pixel and
  scaled up crisp, so a 1200 × 430 footer is about 130k pixels a frame. It runs
  at full rate while revealing or under the pointer, at half rate while the
  mist drifts, stops entirely when nothing moves (`drift={0}`), and sleeps
  off-screen.
- **Accessibility.** The canvas and altimeter are hidden from screen readers.
  Every link is a real, focusable anchor with a visible focus ring, and the
  icon-only social links carry names.
- **Reduced motion.** Everything appears at once, the mist holds still, and
  parallax and the gust are off. The clearing and the altimeter still follow the
  pointer, since they only move when you do.
