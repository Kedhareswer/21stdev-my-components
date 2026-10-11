# Supply Flow Globe

A hand-tinted globe of goods moving between countries. Sankey ribbons lie on the sphere, coffee beans ride along them, and a switch unrolls the whole thing into a flat Mercator map.

```tsx
<SupplyFlowGlobe flows={[{ source: "BR", target: "DE", value: 350 }]} />
```

With no props it tells the story of the global coffee trade, from producers (Brazil, Vietnam, Colombia…) through processing hubs (Germany, Belgium, Italy, the US) to consumer markets.

**Requires `d3-geo`** (`npm i d3-geo`). It handles projection and clipping at the globe's horizon. Country outlines are Natural Earth 1:110m (public domain), embedded in the file as a 21 KB encoded string, so nothing is fetched at runtime. `scripts/encode-world.mjs` regenerates that string.

## How it's drawn

- **Flows** are quadratic curves drawn in longitude/latitude, as you'd sketch them on a flat chart. Each one bows to the left of its direction of travel, so a flow and its return never overlap. Long hauls take the short way across the antimeridian, so Indonesia → US crosses the Pacific in both projections. The curve is thickened into a ribbon *on the sphere*, so it curves over the horizon and gets clipped there like the land does. Width is linear in value, and the ends pinch slightly to tuck under the node discs.
- **Nodes** are true small circles on the sphere, sized by the square root of their throughput.
- **Countries** are tinted by the role of the node they host. Roles are inferred from the flows when you don't set them: only ships out → producer, both ways → hub, only receives → consumer.
- **Particles** (beans, leaves, drops or dots) ride each flow at their own pace and fade in and out at the ends. Bigger flows carry more of them.
- **Paper**: a generated grain tile, a soft vignette, a contact shadow under the globe, a specular highlight and a darkened rim.

## Interaction

| | |
|---|---|
| Drag | Spin the globe, with inertia. In Map view, drag pans (sideways wraps around the world) |
| Pinch / ⌘ or Ctrl + scroll | Zoom. A plain scroll still scrolls the page, and a hint says how to zoom |
| Double-click | Swing that spot to the front and zoom in |
| Hover | Tooltip with numbers. A flow shows its share of the source's outflow. Unrelated flows fade back |
| Click a node | Swing it to the front and keep its flows traced. Click empty space to clear |
| Legend | Hover to preview one role. Click to isolate it |
| Globe / Map switch | Fade between orthographic and Mercator |
| + − ⌂ | Zoom, and reset (which also restarts the idle spin) |
| Keyboard (globe focused) | Arrows turn (Shift for bigger steps), `+`/`-` zoom, `n`/`p` (or `]`/`[`) step through places, `m` switches projection, `0`/`Home` resets, `Esc` clears. Each move is announced |

The globe spins slowly while idle. It pauses while the pointer is over it and stops once you interact.

## Props

| Prop | Default | |
|---|---|---|
| `flows` | the coffee trade | `{ source, target, value }[]`. Ids are ISO-3166 alpha-2 codes (`"BR"`), or any id you place with `nodes` |
| `nodes` | — | `{ id, name?, role?, coordinates? }[]`. Names fall back to the country's. `coordinates` is `[lon, lat]` for places that aren't countries (a port, a city) |
| `title` / `subtitle` | "Global Coffee Supply Chain" / "(Thousands of tonnes)" | Bottom centre. Pass `null` for none |
| `unit` | `"k tonnes"` | Appended to every number verbatim, so `350` reads "350k tonnes" |
| `formatValue` | — | `(v) => string`. Replaces number + unit, e.g. `` v => "$" + v + "bn" `` |
| `roleLabels` | Producers / Processing hubs / Consumer markets | `{ producer?, hub?, consumer? }` |
| `palette` | `"coffee"` | `coffee`, `matcha`, `cocoa` or `atlas`. Also takes a partial theme over coffee, or `{ light, dark }` partials. Any CSS colour works |
| `mode` | `"auto"` | `auto` follows the host's `.dark` / `data-theme` / `--color-background`, falling back to the OS setting. `light` and `dark` force a side |
| `particle` | from palette | `bean`, `leaf`, `drop`, `dot` or `none` |
| `particleDensity` / `particleSpeed` | `1` / `1` | Relative |
| `projection` / `defaultProjection` | — / `"globe"` | Controlled or uncontrolled. `"globe"` or `"map"` |
| `onProjectionChange` | — | `(p) => void` |
| `autoRotate` | `3` | Degrees per second while idle. `false` or `0` holds still |
| `rotation` | `[-15, -20]` | `[rotationX, rotationY]`, the resting pose. Reset returns here |
| `flowWidth` | `3` | Width of the biggest flow, in degrees of arc |
| `curvature` | `0.4` | How far flows bow, 0–1 |
| `wheelZoom` | `"modifier"` | `"always"` zooms on any wheel (use this for a full-page map). `"off"` disables wheel zoom |
| `showLegend` / `showToggle` / `showZoom` / `showTitle` | `true` | |
| `height` | `"100svh"` | Must be a definite length. A percentage needs a sized parent |
| `onNodeClick` | — | `({ id, name, role, in, out }) => void`. Also fires on `Enter` |
| `onFlowClick` | — | `({ source, target, value }) => void` |
| `className` | `""` | Appended to the root |

### Theme keys

A custom palette can override any of these: `paper`, `grain`, `grainAlpha`, `ocean`, `graticule`, `land`, `landStroke`, `producer`, `hub`, `consumer`, `flow`, `flowAlpha`, `flowHot`, `node`, `nodeStroke`, `particle`, `particleStroke`, `particleMark`, `text`, `muted`, `chip`, `chipHover`, `accent`, `accentText`, `shade`, `shine`.

```tsx
<SupplyFlowGlobe
  palette={{ light: { flow: "#b4235a", node: "#3b0d22" }, dark: { flow: "#ff8fb8", node: "#ffe4ef" } }}
  particle="dot"
/>
```

## Motion

`prefers-reduced-motion` turns off the idle spin and inertia, makes rotation, zoom and the projection switch instant, holds the particles still along their routes, and turns off every CSS transition. Drawing pauses while the globe is off-screen or the tab is hidden.
