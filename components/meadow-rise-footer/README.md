# Meadow Rise Footer

A closing call-to-action and site footer set in soft green hills. A
serif-italic headline floats in a pale sky. Below it, six ridges of grass roll
away into haze, and the nearest hill darkens into the ground the links sit on.
The hills are painted live, not loaded from a photo: lit slopes, shaded
creases, mottled grass and aerial haze. Because they are real layers, they can
rise, drift and shift with depth.

## Storyboard

1. **Fog.** Before it is seen, the footer is pale fog over dark ground. The
   ridges paint quietly in the background, a slice per frame, so the page
   never stalls.
2. **Horizon.** When an eighth of the footer is on screen, a pencil-thin
   horizon draws out from the centre. It doubles as the loading bar.
3. **Rise.** The hills rise through the line back to front, each on its own
   long ease-out, while the fog lifts and the light comes up.
4. **Headline.** The words rise out of a mask one after another. The accent
   phrase is then written in: a skewed, blurred italic that wipes into focus.
   The supporting line and the pill follow.
5. **Ground.** The brand mark draws its eight petals. The link columns and
   socials step up, wildflowers sketch themselves into the ground behind them,
   and the bottom rule runs out to the copyright line.
6. **Live.** Mist drifts between the ridges. The sun (or the moon, after dark)
   follows the pointer and pools light on the grass, and the hills shift in
   parallax by depth. The stems sway. Scrolling down to the footer, the range
   settles into place and the headline floats up into position.

The reveal plays once. It does not replay on resize or theme change.

**No dependencies.** React is the only import. One 2D canvas, hills painted
into offscreen canvases once per size, real anchors and a real form, and
nothing fetched.

```tsx
import MeadowRiseFooter from "@/components/ui/meadow-rise-footer"

<MeadowRiseFooter />

<MeadowRiseFooter
  preset="golden"
  seed={11}
  name="Hearthfield"
  heading={"Slow mornings,\n*well-kept* evenings."}
  subheading="A small guesthouse on the edge of the downs."
  cta={{ label: "Plan a stay", href: "/stay" }}
  onSubscribe={async (email) => {
    await fetch("/api/subscribe", { method: "POST", body: JSON.stringify({ email }) })
  }}
  columns={[
    { title: "Stay", links: [{ label: "Rooms", href: "/rooms" }, { label: "Suppers" }] },
    { title: "Visit", links: [{ label: "Getting here" }, { label: "Contact", href: "mailto:hi@hearthfield.co" }] },
  ]}
  socials={[{ icon: "instagram", href: "https://instagram.com/…" }]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `name` / `brandHref` | `"Serenica"` / `"#"` | Brand beside the mark. Also used in the default headline and copyright. |
| `logo` | petal mark | Any node to replace the built-in mark. |
| `heading` | `"Take the *first step*\nwith <name> today."` | Words wrapped in `*asterisks*` set in the serif italic accent. `\n` breaks the line. |
| `subheading` | "Confidential, compassionate support…" | `""` hides it. |
| `cta` | `{ label: "Contact Support", href: "#" }` | `null` hides the pill. |
| `tagline` | "Join our community…" | `""` hides it. |
| `newsletter` | `true` | Email signup with validation, a sending state and a success state. |
| `onSubscribe` | — | `(email) => void \| Promise`. Return a promise to hold the sending state; throw to show an error. Without it, the form simulates a short send. |
| `placeholder` / `successMessage` | "Enter your email" / "Welcome in…" | |
| `columns` | Navigate · Company · Support | `{ title, links: { label, href? }[] }[]` |
| `socials` / `socialTitle` | LinkedIn · Instagram · Facebook · X / `"Social"` | `icon`: `linkedin` `instagram` `facebook` `x` `youtube`. `[]` hides the column. |
| `copyright` | `© <year> <name>. All rights reserved.` | |
| `legal` | Privacy Policy · Terms of Use | Bottom-right links. |
| `preset` | `"auto"` | `auto` (meadow, or moonlit under `.dark`) · `meadow` · `golden` · `moonlit` |
| `palette` | — | Overrides merged over the preset: `sky [top, horizon]`, `haze`, `glow`, `hills [lit, shadow][]` (far → near), `ground`, `ink`, `sub`, `pill`, `pillInk`, `text`, `muted`, `line`, `night`. Hex colours for the scene. |
| `seed` | `3` | Which range of hills to grow. |
| `mist` | `0.55` | Thickness of the drifting mist, 0–1. |
| `drift` | `1` | Mist speed. `0` holds it still and lets the canvas sleep. |
| `interactive` | `true` | Pointer parallax, the following light, the leaning pill. |
| `scrollParallax` | `true` | The range settles into place as the page scrolls to it. |
| `botanicals` | `true` | Wildflower line drawings in the ground. |
| `height` | `"1040px"` | Least height of the whole footer. A definite length; content can push past it. |
| `heroHeight` | `"clamp(460px, 64svh, 680px)"` | The sky-and-hills band. A definite length. |
| `maxWidth` | `"1240px"` | Widest the footer content gets. |
| `fontFamily` / `serifFamily` | Inter Tight → system / Instrument Serif → Georgia | Faces come from the host page; load Instrument Serif for the intended accent. |

## Notes

- **Performance.** Each ridge is painted once per size in a per-pixel pass,
  sliced into column chunks that fit a frame budget. It renders at 1× for the
  far hazy ridges and up to 1.25× for the near ones. Below the next ridge's
  lowest crest it gets a flat fill, since that area is never seen in detail.
  After that, a frame is a handful of `drawImage` calls. The canvas runs while
  revealing, easing or drifting, sleeps off-screen, and stops entirely with
  `drift={0}` once the pointer is still.
- **Accessibility.** The headline is a real `h2`. The canvas and line art are
  hidden from screen readers. Every link is a focusable anchor with a visible
  focus ring, icon-only social links carry names, and the email field is
  labelled. Its errors and confirmation are announced through a polite live
  region.
- **Reduced motion.** Everything appears at once. The hills stand still: no
  rise, no drift, no parallax, no sway. Links and the form still respond to
  hover and focus.
