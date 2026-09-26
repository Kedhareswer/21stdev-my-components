# Pixel Spider Tracker

A pixel-art world tracker in a chunky handheld frame. Search any place and a
little spider drops in on its thread while it looks. When the answer comes
back, it zips back up, the globe swings in, spins round to the hit and drops a
star on it. Sightings sit on the globe as red, green and white pins. There's a
web-shaped radar in the corner and a mascot in the bottom-left who talks back.

Everything is drawn at runtime: the dithered globe and flat map (Natural Earth
1:50m coastlines, public domain, embedded as a 6 KB run-length mask), the
pixel font, the sprites and the chiptune sound effects (Web Audio). **No map
tiles, fonts, images or packages.** React is the only import, so search works
offline out of the box.

## Interaction

- **Welcome screen.** Pick SOUND ON or SOUND OFF to start (`intro={false}` skips it).
- **Search.** Type a city, a country (`india` lists its cities), an alias
  (`nyc`, `bombay`) or coordinates (`35.68, 139.69`, `12S 77W`). Autocomplete
  appears above the bar; ↑/↓ and Enter pick an entry. With several results, the
  card's ◄ ► buttons step through them.
- **Globe.** Drag to spin, scroll or pinch to zoom, **double-click to drop your
  own pin** (it's named after the nearest known place). When the globe has
  focus: arrow keys pan, `+`/`-` zoom, `M` switches globe/map, `0` resets.
- **Pins.** Click one to open its card. The green and red tabs on the left show
  or hide allies and sightings.
- **Radar.** Click anywhere on the web to fly there. The globe button switches
  between globe and flat map; the target button re-centres on the current pin.
- **Top-left** opens the tracker log (legend, recent searches, every sighting).
  **Top-right** is Spider Sense: it jumps to a random pin with a screen shake.
  **Click the mascot** for a hop and a quip. **Bottom-right** toggles sound.

The globe renders only while something moves, and pauses when the tab is
hidden or the tracker is scrolled out of view. With `prefers-reduced-motion`,
auto-spin, the spider's drop and the shakes are all switched off.

## Usage

```tsx
import PixelSpiderTracker from "@/components/ui/pixel-spider-tracker"

<PixelSpiderTracker />

// your own pins
<PixelSpiderTracker
  sightings={[
    { id: "1", name: "HQ", country: "Bengaluru", lat: 12.97, lon: 77.59, kind: "green", note: "Home base." },
    { id: "2", name: "Launch", country: "Lisbon", lat: 38.72, lon: -9.14, kind: "red", time: "TODAY" },
  ]}
/>

// a real geocoder instead of the built-in gazetteer
<PixelSpiderTracker
  onSearch={async (q) => {
    const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=5&q=" + encodeURIComponent(q))
    const rows: { display_name: string; lat: string; lon: string }[] = await r.json()
    return rows.map((x) => ({ name: x.display_name.split(",")[0], country: x.display_name.split(",").slice(-1)[0].trim(), lat: +x.lat, lon: +x.lon }))
  }}
/>
```

The helpers are exported too: `searchPlaces`, `parseCoords`, `nearestPlace`,
`distanceKm`, `PLACES`, `DEFAULT_SIGHTINGS`.

## Props

| Prop | Default | Notes |
|---|---|---|
| `sightings` | 15 sample pins | `{ id, name, lat, lon, country?, note?, time?, kind? }`. `kind`: `"red"` sighting, `"green"` ally, `"white"` unverified. |
| `onSearch` | built-in gazetteer | `(query) => Place[] \| Promise<Place[]>`. Coordinates are parsed before this is called. |
| `places` | ~140 world cities | Used for autocomplete, for search without `onSearch`, and to name dropped pins. |
| `onSelect` | none | Called with a pin or result when its card opens. |
| `onPinDrop` | none | Called with the pin a double-click drops. |
| `title` | `["SPIDER", "TRACKER"]` | The two words either side of the mascot badge. |
| `welcomeText` | welcome copy | Shown on the intro screen. |
| `placeholder` | search hint | Scrolls through the bar while it's empty. |
| `intro` | `true` | Start on the welcome screen with the sound choice. |
| `defaultSound` | `false` | Starting sound state when `intro` is off. |
| `defaultView` | `"globe"` | `"globe"` or `"map"`. |
| `autoRotate` | `true` | Slow spin after 4s idle, globe view only. |
| `minLoadingMs` | `1600` | The shortest the spider hangs around, so fast lookups still get their moment. |
| `pixelSize` | `3` | Screen pixels per globe pixel. |
| `colors` | blue handheld | Any of `frame`, `frameLight`, `frameDark`, `outline`, `screen`, `ocean`, `oceanDeep`, `land`, `landDark`, `coast`, `grid`, `glow`, `text`, `accent`, `red`, `green`, `white`, `star`, `body`, `belly`. |
| `height` | `"100svh"` | Always a definite length, never a percentage. |
| `className` | none | Added to the root `<section>`. |

## Notes

- No dependencies beyond React. Needs Tailwind for a handful of layout utilities.
- The frame sizes itself with container query units (`cqw`/`cqmin`), so it
  fits anything from a phone to a desktop inside whatever `height` you give it.
- The mascot is an original pixel spider rather than any licensed character,
  and the default copy is brand-free, so it's safe to re-skin (see `demo-map.tsx`
  for a coffee-shop tracker).
