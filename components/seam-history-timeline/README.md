# Seam History Timeline

The "Our story" section of an about page: a company's milestones as wide photo cards running
off the right edge of the section. Each card is a photo over a title and a sentence or two.
Neighbouring cards meet on a **slanted seam**: real `clip-path` parallelograms that share one
angle, with rounded corners, so the field colour shows through as a thin slanted gutter.

The milestone in focus is in full colour, its text always on the heading's left line. The ones
still to come sit under a pale haze; a passed one that is still in view recedes toward the field
colour, and once it slides past the left edge it leaves the frame completely. Above the strip, a **year rail** is the
timeline's axis and its navigation: a dark liquid pill sits on the current year and flows to
the next when you move. The leading end runs ahead, the trailing end follows, and a neck
pinches between them through an SVG goo filter (pill shapes go through the filter; the years
are drawn crisp on top and invert exactly where the liquid passes). A milestone that spans two
years rests as two fused pills, on the rail and on its photo.

- Drag the strip (pointer capture, momentum, a flick always moves one milestone, rubber-band
  at the ends), scroll it sideways with a trackpad or Shift + wheel (vertical page scroll is
  never captured), click a year on the rail, click a hazed card, use the buttons, or focus the
  strip and use ← → Home End. The arrow keys work from anywhere inside the section, including
  the buttons and the rail years (but never inside a text field).
- A polite live region announces each milestone ("2021 to 2022. Schools and a library.").
  The rail years are buttons with `aria-current="step"`; each card is a labelled group.
- Images fail gracefully: without an image, or if it does not load, the card shows a plate in
  the field colour with the year set large.
- A two-year milestone is one capsule on the rail, so it reads as one target.
- Keyboard focus on the strip rings the current year and underlines the focused title (the
  cards are clipped by their seams, so an outline would be cut).
- Light and dark versions of every preset. `theme="auto"` follows a `.dark` class on any
  ancestor (the shadcn / Tailwind convention).
- Under `prefers-reduced-motion` the strip and the pill jump instead of flowing.
- Phones get a narrower card, a gentler seam (a little over half the angle) and a rail that
  scrolls sideways and keeps the current year in view.

No dependencies, no web fonts. Styles are scoped to `.sht` in one inline `<style>`. The
section sizes to its content (`minHeight` is optional).

## Props

| Prop | Default | |
|---|---|---|
| `milestones` | six milestones of a timber builder | `{ years, title, body?, image?, alt?, imagePosition?, href?, linkLabel? }[]`. `imagePosition` is a CSS `object-position` (e.g. `"50% 30%"`) to keep a photo's subject in the wide crop. `years` is `2019`, `[2021, 2022]`, `"2021-2022"`, `"2021 to 2022"` or a word such as `"Today"`. |
| `eyebrow` | "Our story" | Small label over the heading. `""` drops it. |
| `heading` | "Twelve years of building in timber" | The section's `h2`. |
| `intro` | one sentence | Any node, beside the buttons. |
| `preset` | `"harbour"` | `harbour` (steel blue), `moss`, `graphite` (ink on paper; near-black when dark), `signal` (orange). Each has a designed dark version. |
| `palette` / `darkPalette` | none | Override any of `field`, `onField`, `mutedOnField`, `card`, `ink`, `muted`, `pill`, `onPill`, `wash`. |
| `theme` | `"auto"` | `"auto"`, `"light"` or `"dark"`. |
| `seamAngle` | `12` | Lean of the seams in degrees, `0` to `24`. `0` gives straight gutters. |
| `wash` | `0.62` | Strength of the haze over milestones still to come, `0` to `1`. |
| `startIndex` | `0` | Milestone in focus on first render. |
| `index` / `onChange` | none | Controlled focus, or just listen for changes. |
| `minHeight` | none | Any CSS length, e.g. `"100svh"`. |
| `displayFont` / `textFont` | Inter Display / Inter, then the system UI face, Helvetica Neue, Arial | Pass your own stacks, e.g. `"var(--font-sans)"`. |
| `labels` | English | `{ previous, next, rail }` accessible names. |
| `className` | none | On the `<section>`. |

## Photos

Default (timber builder, `demo.tsx`) and `demo-signal.tsx` (a clinic booking start-up, signal preset) use
Unsplash photos under the Unsplash licence, by URL from `images.unsplash.com`:
`photo-1503387762-592deb58ef4e`, `photo-1600585154340-be6161a56a0c`,
`photo-1541888946425-d81bb19240f5`, `photo-1487958449943-2429e8be8625`,
`photo-1486406146926-c627a92ad1ab`, `photo-1497366216548-37526070297c` (default) and
`photo-1519389950473-47ba0277781c`, `photo-1556761175-5973dc0f32e7`,
`photo-1497366811353-6870744d04b2`, `photo-1551434678-e076c223a692`,
`photo-1522071820081-009f0129c71c` (signal demo). Every image is a prop: replace them with
your own. The companies, people and milestones in both demos are fictional.

**Note for whoever publishes this:** the cloud environment that built it blocks
`images.unsplash.com`, so every screenshot in `media/seam-history-timeline/` shows the
no-image plates, and the photo choices and their `alt` text could not be checked by eye.
Open both demos in a normal browser before publishing and swap any photo that does not fit
its milestone.
