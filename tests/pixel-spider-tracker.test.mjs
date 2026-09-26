// Install-safety, wiring and geo-maths check for components/pixel-spider-tracker.
// Run: node tests/pixel-spider-tracker.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const src = readFileSync(new URL("../components/pixel-spider-tracker/pixel-spider-tracker.tsx", import.meta.url), "utf8")

// 21st ships this file alone: no map tiles, fonts, images or packages to fetch.
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import|url\(["']?http|https?:\/\//, "no external assets — the world is embedded, not fetched")
assert.doesNotMatch(src, /\bfetch\(/, "the default search must work offline")
// The 21st CLI's dependency scanner reads every `<Name` as a JSX tag and backtracks exponentially when it never
// closes: generic calls like useRef<T>(...) inside the component body hang `21st render`/`publish` before upload.
assert.doesNotMatch(src, /\b(?:useRef|useState|new Map|new Set|PointerEvent|KeyboardEvent)<[A-Za-z"{]/, "no generic type arguments in the body — use `x as T`")

assert.ok(src.includes('height = "100svh"'), "root height must default to a definite length")
assert.doesNotMatch(src, /<section[\s\S]{0,300}className={"relative w-full[^"]*\bh-full\b/, "no h-full on the root")
assert.ok(src.includes('imageRendering: "pixelated"') && src.includes('maxWidth: "none"'), "canvas must stay crisp and escape Preflight")

// The CSS string: no backticks, no ${, no bare resets.
const css = src.slice(src.indexOf("const CSS ="), src.indexOf("type Phase ="))
assert.doesNotMatch(css, /`|\$\{/, "no template syntax inside the CSS string")
assert.doesNotMatch(css, /(^|[}"])\s*(\*|body|html|:root)\s*\{/, "no global resets")
assert.ok(css.includes("prefers-reduced-motion: reduce"), "honour reduced motion in CSS")

// Runtime rules.
assert.ok(src.includes('"visibilitychange"') && src.includes("document.hidden"), "pause while the tab is hidden")
assert.ok(src.includes("IntersectionObserver"), "pause while scrolled away")
for (const gone of ["ro.disconnect()", "io.disconnect()", 'removeEventListener("wheel", onWheel)', "clearTimeout", "ctxRef.current?.close()"]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}
assert.ok(/addEventListener\("wheel", onWheel, \{ passive: false \}\)/.test(src), "wheel zoom must be able to preventDefault")
assert.doesNotMatch(src, /key=\{"shake"/, "never remount the screen: the canvas and its render loop live inside it")

// Accessibility wiring.
assert.ok(src.includes('role="combobox"') && src.includes("aria-activedescendant"), "search is a real combobox")
assert.ok(src.includes('role="listbox"') && src.includes('role="option"'), "suggestions are a listbox")
assert.ok(src.includes('aria-live="polite"'), "search state is announced")
assert.ok(src.includes('role="application"') && src.includes("onKeyDown={onKey}"), "the globe is keyboard drivable")

// Demos import the installer's path, and tsc can resolve it.
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/pixel-spider-tracker"'), "tsconfig paths line is missing")
for (const demo of ["demo.tsx", "demo-map.tsx"]) {
  const d = readFileSync(new URL("../components/pixel-spider-tracker/" + demo, import.meta.url), "utf8")
  assert.ok(d.includes('from "@/components/ui/pixel-spider-tracker"'), `${demo} must import the installed path`)
  assert.ok(d.includes('className="w-full"'), `${demo} must not shrink inside 21st's flex wrapper`)
}

// The real logic, lifted out of the component.
const start = src.indexOf("// #region tracker")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "tracker region markers missing")
const m = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// The embedded world decodes to exactly one full grid, about 30% land, in the right places.
{
  const mask = m.decodeLand()
  assert.equal(mask.length, m.LAND_W * m.LAND_H)
  const land = mask.reduce((n, v) => n + v, 0) / mask.length
  assert.ok(land > 0.27 && land < 0.33, `land fraction ${land.toFixed(3)} is off`)
  const on = [[0, 20, "Sahara"], [-25, 134, "Australia"], [60, 100, "Siberia"], [40, -100, "Kansas"], [-10, -55, "Amazon"], [72, -40, "Greenland"], [-80, 0, "Antarctica"], [65, -100, "Nunavut"]]
  const off = [[0, -140, "Pacific"], [-30, -20, "South Atlantic"], [-20, 75, "Indian Ocean"], [66, 0, "Norwegian Sea"], [35, -40, "North Atlantic"], [85, 0, "Arctic"]]
  for (const [lat, lon, name] of on) assert.ok(m.landAt(mask, lat, lon), `${name} should be land`)
  for (const [lat, lon, name] of off) assert.ok(!m.landAt(mask, lat, lon), `${name} should be sea`)
  // No antimeridian seam artefact: a whole row of land would be a broken ring.
  for (let y = 20; y < m.LAND_H - 40; y++) {
    let n = 0
    for (let x = 0; x < m.LAND_W; x++) n += mask[y * m.LAND_W + x]
    assert.ok(n < m.LAND_W * 0.9, `row ${y} is a solid band of land`)
  }
}

// Longitudes wrap, and the shortest way round is taken.
assert.equal(m.wrapLon(190), -170)
assert.equal(m.wrapLon(-190), 170)
assert.equal(m.wrapLon(180), -180)
assert.equal(m.lonDelta(170, -170), 20)
assert.equal(m.lonDelta(-170, 170), -20)

// Projections: invert(project(p)) is p, for both views, front side of the globe.
for (const mode of ["globe", "map"]) {
  for (const v of [
    { mode, lon: 0, lat: 0, zoom: 1 },
    { mode, lon: 139, lat: 35, zoom: 2 },
    { mode, lon: -170, lat: -20, zoom: 1.4 },
  ]) {
    for (const [lat, lon] of [[v.lat, v.lon], [v.lat + 10, v.lon - 15], [v.lat - 12, v.lon + 8]]) {
      const [x, y, z] = m.projectPoint(v, 800, 600, lat, lon)
      assert.ok(z > 0, "point should face the viewer")
      const back = m.invertPoint(v, 800, 600, x, y)
      assert.ok(back, "inverse missed the world")
      assert.ok(Math.abs(back[0] - lat) < 1e-6 && Math.abs(m.lonDelta(back[1], lon)) < 1e-6, `${mode} round trip at ${lat},${lon}`)
    }
  }
}
{
  const v = { mode: "globe", lon: 0, lat: 0, zoom: 1 }
  const [x, y, z] = m.projectPoint(v, 800, 600, 0, 0)
  assert.deepEqual([x, y, z], [400, 300, 1], "view centre is screen centre")
  assert.ok(m.projectPoint(v, 800, 600, 0, 180)[2] < 0, "the antipode is on the far side")
  assert.equal(m.invertPoint(v, 800, 600, 5, 5), null, "corners are off the globe")
  const top = m.projectPoint(v, 800, 600, 10, 0)
  assert.ok(top[1] < 300, "north is up")
  assert.ok(m.projectPoint(v, 800, 600, 0, 10)[0] > 400, "east is right")
}

// The map view never shows past the poles.
{
  const v = m.clampView({ mode: "map", lon: 200, lat: 80, zoom: 1 }, 800, 600)
  assert.equal(v.lon, -160)
  const [, y] = m.projectPoint(v, 800, 600, 90, 0)
  assert.ok(y <= 0.0001, "north pole must be at or above the top edge")
  assert.equal(m.clampView({ mode: "globe", lon: 0, lat: 0, zoom: 99 }, 800, 600).zoom, m.ZOOM.globe[1])
}

// Rendering: the per-pixel field agrees with invertPoint.
{
  const mask = m.decodeLand()
  const f = m.makeField(80, 60)
  const v = { mode: "globe", lon: 20, lat: 10, zoom: 1 }
  m.renderField(f, v, 240, 180, 3, mask)
  assert.equal(f.kind[0], 0, "corner is space")
  assert.equal(f.kind[30 * 80 + 40] !== 0, true, "centre is the world")
  let checked = 0
  for (let y = 0; y < 60; y += 7) {
    for (let x = 0; x < 80; x += 7) {
      const ll = m.invertPoint(v, 240, 180, x * 3 + 1.5, y * 3 + 1.5)
      const k = f.kind[y * 80 + x]
      if (!ll) continue
      checked++
      assert.equal(k, m.landAt(mask, ll[0], ll[1]) ? 2 : 1, `field disagrees at ${x},${y}`)
    }
  }
  assert.ok(checked > 20)
  m.renderField(f, { mode: "map", lon: 0, lat: 0, zoom: 1 }, 240, 180, 3, mask)
  assert.ok(f.kind.every((k) => k !== 0), "the flat map fills the screen at zoom 1")
}

// Search.
{
  const names = (q) => m.searchPlaces(q).map((p) => p.name)
  assert.equal(names("tokyo")[0], "Tokyo")
  assert.equal(names("TOKYO ")[0], "Tokyo", "case and whitespace do not matter")
  assert.equal(names("sao paulo")[0], "Sao Paulo")
  assert.equal(names("São Paulo")[0], "Sao Paulo", "accents are folded")
  assert.equal(names("nyc")[0], "New York", "aliases work")
  assert.equal(names("bombay")[0], "Mumbai")
  assert.equal(names("paris, france")[0], "Paris", "city plus country")
  assert.equal(names("par")[0], "Paris", "prefixes work")
  const india = m.searchPlaces("india")
  assert.ok(india.length > 1 && india.every((p) => p.country === "India"), "a country lists its cities")
  assert.ok(m.searchPlaces("usa", m.PLACES, 20).every((p) => p.country === "United States"), "country aliases work")
  assert.deepEqual(m.searchPlaces("zzqx"), [])
  assert.deepEqual(m.searchPlaces("   "), [])
  assert.equal(m.searchPlaces("a", m.PLACES, 3).length <= 3, true, "limit is honoured")
}

// Coordinates.
{
  assert.deepEqual(m.parseCoords("35.68, 139.69"), { name: "35.68N 139.69E", lat: 35.68, lon: 139.69 })
  assert.deepEqual(m.parseCoords("12S 77W"), { name: "12.00S 77.00W", lat: -12, lon: -77 })
  assert.equal(m.parseCoords("-33.9 151.2").lat, -33.9)
  assert.equal(m.parseCoords("91, 0"), null, "latitude out of range")
  assert.equal(m.parseCoords("0, 181"), null, "longitude out of range")
  assert.equal(m.parseCoords("tokyo"), null)
  assert.equal(m.searchPlaces("40.7, -74")[0].lat, 40.7, "search accepts coordinates")
  assert.equal(m.formatCoord(-0.5, -0.25), "0.50S 0.25W")
}

// Distances and the nearest known place.
{
  const km = m.distanceKm(51.51, -0.13, 48.86, 2.35)
  assert.ok(km > 330 && km < 350, `London-Paris is ${km}`)
  assert.equal(m.nearestPlace(35.6, 139.8).place.name, "Tokyo")
  assert.equal(m.nearestPlace(0, -140), null, "nothing near the mid-Pacific")
}

// Pixel font covers every string the component draws by default.
for (const s of [
  "SPIDER TRACKER", "SELECT SOUND OPTION", "LOADING", "NEW SIGHTING", "SIGHTING LOG", "ALLY CHECK-IN", "UNVERIFIED",
  "CHOOSE YOUR SETTINGS AND START TRACKING", "SOUND ON", "SOUND OFF", "TRACKER LOG", "LEGEND", "RECENT SEARCHES",
  "LAT 35.68N", "ZOOM 1.5X", "1/6", "< >", "WITH GREAT POWER COMES GREAT BANDWIDTH", "DOUBLE-CLICK TO DROP A PIN",
  "SEARCH A CITY, COUNTRY OR LAT, LON TO TRACK A SIGHTING", "SPIDER SENSE: TOKYO", "NO SIGHTINGS FOR ZZQX",
]) {
  for (const ch of s) if (ch !== " ") assert.ok(m.FONT[ch], `font is missing ${JSON.stringify(ch)} (in ${s})`)
}
for (const [ch, g] of Object.entries(m.FONT)) {
  const rows = g.split("|")
  assert.ok(rows.length <= 8 && rows.every((r) => /^[.#]{5}$/.test(r)), `bad glyph ${JSON.stringify(ch)}`)
}
assert.equal(m.textWidth("AB"), 11)
assert.equal(m.textPath(" "), "")
assert.equal(m.textPath("a"), m.textPath("A"), "the font is caps-only")
assert.equal(m.textPath("é"), m.textPath("?"), "unknown characters fall back to ?")
assert.equal(m.textPath("-"), "M1 3h3v1h-3z", "runs are merged per row")

// Sprites: rectangular, symmetric, lenses inside a rim, legs where legs go.
for (const [pose, frame] of [["hang", 0], ["hang", 1], ["stand", 0], ["stand", 1], ["face", 0]]) {
  const rows = m.spiderRows(pose, frame)
  const w = rows[0].length
  assert.ok(rows.every((r) => r.length === w), `${pose} rows differ in width`)
  assert.ok(rows.every((r) => /^[.krdbwhl]+$/.test(r)), `${pose} has unknown palette keys`)
  for (const r of rows) {
    const plain = r.replace(/h/g, "r")
    assert.equal(plain, [...plain].reverse().join(""), `${pose}/${frame} is not symmetric`)
  }
  const all = rows.join("")
  assert.ok(all.includes("w") && all.includes("r") && all.includes("b"), `${pose} is missing lenses, body or belly`)
  assert.equal(all.includes("l"), pose !== "face", `${pose} legs`)
  rows.forEach((r, y) =>
    [...r].forEach((c, x) => {
      if (c !== "w") return
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = rows[y + dy]?.[x + dx] ?? "."
        assert.ok(n === "w" || n === "k", `${pose} lens leaks at ${x},${y}`)
      }
    }),
  )
}
{
  const a = m.spiderRows("hang", 0)
  const b = m.spiderRows("hang", 1)
  assert.equal(a.length, b.length, "animation frames share a size")
  assert.notDeepEqual(a, b, "frames differ")
  const lids = m.lidRows(a)
  assert.equal(lids.join("").replace(/[.]/g, "").length, a.join("").replace(/[^w]/g, "").length, "lids cover exactly the lenses")
}
{
  const p = m.spritePaths(["kk.", ".rr"])
  assert.deepEqual(p, { k: "M0 0h2v1h-2z", r: "M1 1h2v1h-2z" })
  for (const icon of [m.SPIDER_ICON, m.STAR_ICON]) assert.ok(icon.every((r) => r.length === icon[0].length))
}

// The default pins have homes on the map.
{
  const mask = m.decodeLand()
  const src2 = src.slice(src.indexOf("export const DEFAULT_SIGHTINGS"))
  const ids = [...src2.slice(0, src2.indexOf("]\n")).matchAll(/id: "(s\d+)"/g)].map((x) => x[1])
  assert.equal(new Set(ids).size, ids.length, "sighting ids are unique")
  assert.ok(m.PLACES.every((p) => Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180), "gazetteer coordinates in range")
  const coastal = m.PLACES.filter((p) => !["Antarctica"].includes(p.country ?? ""))
  const dry = coastal.filter((p) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (m.landAt(mask, p.lat + dy * 0.5, p.lon + dx * 0.5)) return true
    return false
  })
  assert.ok(dry.length / coastal.length > 0.95, "places should sit on (or next to) land")
}

console.log("pixel-spider-tracker: ok")
