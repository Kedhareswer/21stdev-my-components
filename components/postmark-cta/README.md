# Postmark CTA

The closing call to action of a landing page: the last block before the footer. A heavy two-line headline, one primary button and a quiet secondary link sit on a halftone field, with a loose collection of postage stamps scattered around them.

- **The stamps are printed, not painted.** Each one is a two-ink line engraving drawn on a canvas at the size it is shown: horizontal lines that swell in the shadows and bend round the form, a 45° hatch over the deepest darks, contour edges, and a flat second ink a hair out of register. Perforations are real geometry, so the teeth stay even at any size.
- **Pick them up.** Every stamp lifts when grabbed, tilts with the speed of the drag, keeps its momentum when thrown, rubber-bands at the edges and settles on a spring. A stamp never comes to rest on the copy: it slides to the nearest clear spot. Double-click sends it home.
- **Posting.** Hovering the button hovers a postmark over the offer stamp. Pressing it brings the postmark down (a circular date die and wavy cancellation bars, inked with a skip texture). The animation starts on pointer-down and never holds up the click or the navigation.
- **Never on the copy.** On every resize the stamps are nudged clear of the headline, description, buttons and note, so a longer headline in your language does not end up under a stamp.
- **Phones get their own layout.** Below 720 px the first four stamps sit in a band above and a band below the copy, and the section sizes to its content.
- Three presets with their own stamps, inks and copy: `voyage` (travel booking), `pantry` (produce box), `atelier` (design studio). Each has a designed dark version; `theme="auto"` follows a `.dark` class on any ancestor.

No dependencies beyond React. One file, styles scoped under `.pm`.

## Usage

```tsx
import PostmarkCta from "@/components/ui/postmark-cta"

export default function Closing() {
  return (
    <PostmarkCta
      preset="voyage"
      headline={"Your passport is\n*getting bored.*"}
      description="Flights, stays and trains in one booking, and a real person on call if anything moves."
      ctaLabel="Plan a trip"
      ctaHref="/plan"
      secondaryLabel="Browse 1,200 places"
      secondaryHref="/places"
      postmark={{ top: "BON VOYAGE", bottom: "POSTED TODAY" }}
    />
  )
}
```

Your own stamps, with your own photos printed as two-ink duotones:

```tsx
<PostmarkCta
  preset="pantry"
  stamps={[
    { art: "olives", shape: "round", label: "OLIO NUOVO", caption: "PUGLIA" },
    { image: "https://images.unsplash.com/photo-…?w=600&q=80", label: "SICILIA", value: "2.40", caption: "Blood oranges", cancelled: true },
    { art: "tomato", label: "WEEK ONE", value: "half price", caption: "Heirloom tomato" },
    { art: "pear", label: "ANJOU", value: "1.10", caption: "Winter pears", ink: "#7e2a1d", tint: "#d8b13c" },
  ]}
  postOn={2}
/>
```

## Props

| Prop | Type | Default | |
|---|---|---|---|
| `headline` | `string` | preset | `*stars*` set words in the highlight colour, `\n` breaks the line |
| `description` | `ReactNode` | preset | One or two sentences |
| `ctaLabel` / `ctaHref` / `onCtaClick` | | preset | A link when there is an href, otherwise a button |
| `secondaryLabel` / `secondaryHref` / `onSecondaryClick` | | preset | Empty label hides it |
| `note` | `ReactNode \| null` | preset | One quiet line under the buttons |
| `stamps` | `PostmarkStamp[]` | preset | Up to seven. The first four show on phones; the third sits by the button |
| `postOn` | `number` | `2` | Which stamp the button's postmark lands on |
| `postmark` | `{ top?, bottom?, date? }` | preset, today | Ring text and date of the postmark |
| `preset` | `"voyage" \| "pantry" \| "atelier"` | `"voyage"` | Stamps, inks, copy and colours |
| `palette` / `darkPalette` | `Partial<PostmarkPalette>` | | `ground`, `dotsTop`, `dotsBottom`, `ink`, `muted`, `accent`, `onAccent`, `highlight` |
| `theme` | `"auto" \| "light" \| "dark"` | `"auto"` | |
| `draggable` | `boolean` | `true` | Pick the stamps up and throw them |
| `ambient` | `boolean` | `true` | A slow drift at rest and a lean away from the pointer |
| `height` | `number \| string` | `"min(100svh, 920px)"` | Minimum height on wide screens; phones size to content |
| `displayFont` / `textFont` | `string` | system stacks | Pass `var(--font-…)` to use your own faces. The headline wants a heavy cut |

`PostmarkStamp`: `art` (one of 16 engraved subjects: `peaks`, `lighthouse`, `dunes`, `sail`, `balloon`, `bridge`, `lemon`, `pear`, `cherries`, `tomato`, `olives`, `sphere`, `cone`, `cube`, `arch`, `ring`), `image` (any URL; falls back to the engraving if it fails), `label`, `value`, `caption`, `shape` (`portrait`, `landscape`, `round`), `ink`, `tint`, `rotate`, `x` / `y` (% of the section on wide screens), `scale`, `cancelled`.

## Notes

- Accessibility: the section is named by its headline; stamps are decorative and hidden from assistive tech; the CTA and link have visible focus rings; under `prefers-reduced-motion` the stamps stop drifting, throws stop where they are dropped and the postmark appears without the slam.
- Touch: stamps use `touch-action: pan-y`, so a vertical swipe still scrolls the page and a sideways one picks the stamp up.
- Performance: each engraving is drawn once per size (a few milliseconds), the halftone once per resize, and the physics loop only runs while a stamp is moving.
- Photos: none ship by default, so the component renders complete with no network. Any `image` you pass is printed as a duotone in the stamp's ink.
