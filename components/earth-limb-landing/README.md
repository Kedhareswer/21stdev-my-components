# Earth Limb Landing

A complete home page for an Earth-imaging satellite company, shown the way its own
fleet sees the planet.

**The hero is the limb of the Earth from low orbit.** One fragment shader draws an
ocean under fbm cloud decks, sun glint, the terminator and a thin, physical
atmosphere: a hairline of Rayleigh blue, white haze and an amber dawn line. The view
rides with one satellite. Its ground point holds still in the frame, its ground track
runs along the limb, and its label shows where it is over the ground right now, while
the Earth turns slowly beneath it. Other satellites cross the frame when they are
really there. Hover, focus or tap any of them for its plane, sensor, ground point,
daylight or eclipse, and its next pass over your city.

**It runs on a real orbit model.** Circular sun-synchronous orbits, sidereal time
and the sun's position place all 18 satellites from the clock. The same model drives
the rest of the page:

- **Live strip.** Fleet size, a countdown to the next pass over your city (chosen
  from your time zone, never from a location prompt, and changeable), scenes imaged
  since midnight UTC, and the archive.
- **Use cases.** A tablist (arrow keys work) with a drag-to-compare on each one:
  true colour against NDVI, radar, short-wave infrared, or a later date with the
  changes outlined. Drag it, or focus the handle and use the arrow keys.
- **The spacecraft.** An isometric line drawing projected from the satellite's real
  proportions, with numbered parts, specs, two calls to action, and a live roster of
  where every satellite is.
- **Archive.** A scroll-snap carousel with previous and next buttons.
- **Tasking form.** Area (a city or coordinates), date window, product, use and
  email. It shows the earliest collection for that place and sensor (optical waits
  for daylight, radar does not), validates inline, and has sending, error and
  success states.
- **Footer.** An imagery band fading into a deep navy sitemap, a newsletter form
  and legal links.

The header sticks, turns solid as you scroll, and becomes a full-screen menu on
phones (focus is kept inside, Escape closes it).

## Usage

```tsx
import EarthLimbLanding from "@/components/ui/earth-limb-landing"

export default function Page() {
  return <EarthLimbLanding />
}
```

Everything is a prop with a working default: `brand`, `tagline`, `kicker`,
`headline`, `lede`, `cta`, `secondaryCta`, `nav`, `utility`, `accent`, `preset`
(`"day"`, the default, rides a morning optical plane over sunlit ocean; `"dawn"` rides
the dawn-dusk radar plane along the terminator), `theme` (`"system" | "light" |
"dark"`, for the pages below the hero; the hero is always space), `themeToggle` (off by
default), `planes`, `fleet`, `featuredPlane`, `cities`, `imagesPerDay`, `archiveStat`,
`labels`, `statement`, `rhythm` (the facts under the statement), `card`, `uses`,
`usesTitle`, `spacecraft`, `rosterTitle`, `archive`, `archiveTitle`, `tasking`,
`footer`, `seed` and `height` (a definite length, default `100svh`).

The spacecraft name and the footer default to your `brand`, and the footer's
Solutions column lists your `uses`. `sections` picks what renders below the hero,
for example `sections={["stats", "uses", "tasking", "footer"]}`. The full list is
`stats`, `intro`, `uses`, `fleet`, `archive`, `tasking` and `footer`.

`onTask(request)` and `onSubscribe(email)` receive the form data. Return `false`,
throw, or reject to show the error state.

Images are generated (farmland and NDVI, a flood in radar, a burn scar in
short-wave infrared, a container port with ships in optical and radar, a
construction site before and after, a beach before and after a storm, dunes, salt
ponds). Pass `image` / `compareImage` on a use case, `image` on an
archive story, or `card.image` to use your own pictures instead.

`demo-dawn.tsx` shows the same page as a maritime imaging company: the dawn view, a
coral accent, dark pages, its own fleet of twelve, port cities, use cases, spacecraft
and footer.

## Notes

- No dependencies beyond React. No fonts, no network requests unless you pass image
  URLs.
- The limb repaints ten times a second on a real GPU, inside a pixel budget that
  drops below 1x on very large screens. On a software renderer, or with reduced
  motion, it paints once and holds a finished frame. Without WebGL a CSS limb takes
  its place.
- Under `prefers-reduced-motion` the satellites update every ten seconds, the
  compare does not wipe, and nothing else animates.
- The orbit model is honest but simple (circular orbits, no perturbations). Replace
  `fleet` and `planes` with your own constellation.
