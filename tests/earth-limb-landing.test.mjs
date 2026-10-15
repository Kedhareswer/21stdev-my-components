// Install-safety and logic checks for components/earth-limb-landing.
// Run: node tests/earth-limb-landing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "earth-limb-landing"
const read = (file) => readFileSync(new URL(`../components/${SLUG}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)
const region = (name) => {
  const a = src.indexOf(`// #region ${name}\n`)
  const b = src.indexOf(`// #endregion ${name}\n`)
  assert.ok(a > -1 && b > a, `region ${name} missing`)
  return src.slice(a, b)
}

/* ---------- nothing travels with it ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.doesNotMatch(src, /https?:\/\//, "no URLs at all, so it renders in the capture sandbox")
assert.match(src, /<img className="elx-tile" src=\{props\.image\}/, "images only appear when the installer passes one")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--elx-h": height/, "the height prop reaches the root")
assert.match(src, /\.elx-root\{[^}]*min-height:var\(--elx-h\)/, "and sets its floor")
assert.match(src, /\.elx-hero\{[^}]*min-height:clamp\(640px,var\(--elx-h\),1100px\)/, "the hero has a definite height")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /height:100%/, "no percentage heights anywhere")
assert.match(src, /c\.style\.height = size\.h \+ "px"/, "the limb canvas is sized in pixels from its measured box")
assert.match(src, /React\.useId\(\)\.replace/, "ids are namespaced per instance")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS (limb, satellites, wipe)")
assert.doesNotMatch(src, /[—–]/, "no em or en dashes anywhere")
assert.doesNotMatch(src, />[^<{]*\\u[0-9a-f]{4}/i, "no \\u escapes inside JSX text (they print literally)")

const css = src.match(/const ELX_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.elx-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.elx-canvas\{[^}]*max-width:none/, "the limb canvas is guarded against Preflight")
assert.match(css[1], /\.elx-tile\{[^}]*max-width:none/, "and so are the imagery tiles")
assert.match(css[1], /\.elx-root :where\(button,input,select\)\{/, "the reset has no specificity to fight")
assert.match(css[1], /\.elx-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky header")
assert.doesNotMatch(css[1], /\.elx-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break the sticky header")
assert.match(css[1], /\.elx-head\{position:sticky/, "the header sticks")
assert.match(css[1], /\.elx-root\[data-theme="dark"\]\{/, "a designed dark theme")

/* ---------- it behaves like a product page ---------- */

for (const k of ["solutions", "fleet", "archive", "tasking"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth", block: "start" \}\)/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /role="tablist" aria-label="Solutions"/, "use cases are a tablist")
assert.match(src, /nextIndex\(useIx, e\.key, uses\.length\)/, "arrow keys move through them")
assert.match(src, /role="slider"/, "the compare handle is a slider")
assert.match(src, /k === "ArrowLeft" \|\| k === "ArrowDown"/, "and it moves with the keyboard")
assert.match(src, /setPointerCapture/, "dragging keeps the pointer")
assert.match(src, /if \(res === false\) ok = false/, "onTask and onSubscribe can refuse")
assert.match(src, /validateTask\(f\)/, "the tasking form validates before sending")
assert.match(src, /aria-invalid/, "invalid fields are marked")
assert.match(src, /aria-modal="true"/, "the phone menu is a modal dialog")
assert.match(src, /e\.key === "Escape"/, "Escape closes it")
assert.match(src, /if \(e\.key !== "Tab"\) return/, "and Tab stays inside it")
assert.match(src, /cityForZone\(cities, tz, new Date\(\)\.getTimezoneOffset\(\)\)/, "the next-pass city comes from the time zone, never a location prompt")
assert.doesNotMatch(src, /geolocation/, "no geolocation at all")
assert.match(src, /soft \? 0\.9e6 : reduced \? 2\.2e6 : 1\.6e6/, "the limb holds a pixel budget, smaller on software renderers")
assert.match(src, /swiftshader\|llvmpipe\|software/, "software renderers are detected")
assert.match(src, /const live = !!L && !L\.soft && !reduced/, "only a real GPU repaints the turning Earth")
assert.match(src, /data-nogl/, "no WebGL still draws a limb")
assert.match(src, /photo \? \(\n\s+<img className="elx-photo"/, "a real photo can replace the rendered limb")
assert.match(src, /footer\.band !== null/, "the footer band is a prop and can be turned off")
assert.match(src, /swath && has\("uses"\)/, "so is the swath between sections")
assert.match(src, /uid \+ "-satcard-"/, "tooltip ids are namespaced per instance")
assert.match(src, /<TrackMap /, "the fleet is shown on a live ground-track map")
assert.match(src, /const has = \(k: ElxSection\)/, "sections can be dropped")
assert.match(src, /setTimeout\(step, 0\)/, "tiles render in slices that yield to the browser")
assert.match(src, /TILE_CACHE\.size > 8/, "and the tile cache is bounded")
assert.match(src, /logo \|\| <Mark/, "the mark is replaceable")
assert.ok(read("demo.tsx").includes("<EarthLimbLanding />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-dawn.tsx"), /preset="dawn"/, "the second demo shows the dawn view")
assert.match(read("demo-dawn.tsx"), /accent="#/, "with its own accent")
assert.doesNotMatch(read("demo-dawn.tsx"), /https?:\/\//, "and stays capture-safe")

/* ---------- logic, executed ---------- */

const code = region("content") + region("orbit") + region("imagery") +
  "\nexport { DEFAULT_PLANES, DEFAULT_FLEET, DEFAULT_CITIES, DEFAULT_USES, PRESETS, period, gmst, sunEci, satEci, toEcef, subPoint, cityVec, nextPass, imagedToday, clock, fmtLat, fmtLon, cityForZone, viewMatrix, heroDisk, canvasRatio, nextIndex, isEmail, validateTask, shade, heroGeometry, pickLead, project, trackPath, renderTile, dot, mul, norm, REACH, subSolar, terminatorLat, mapXY, trackSvg, latLon }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))
const T0 = Date.UTC(2026, 9, 15, 12, 0)
const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) < eps, `${msg}: ${a} vs ${b}`)

// physics
close(L.period(520) / 60, 94.8, 0.3, "520 km orbit takes about 95 minutes")
close(L.gmst(Date.UTC(2000, 0, 1, 12)), 4.894961, 1e-3, "sidereal angle at J2000")
const sunMarch = L.sunEci(Date.UTC(2026, 2, 20, 15))
close(Math.asin(sunMarch[2]) * 180 / Math.PI, 0, 0.5, "sun on the equator at the March equinox")
const sunJune = L.sunEci(Date.UTC(2026, 5, 21, 9))
close(Math.asin(sunJune[2]) * 180 / Math.PI, 23.44, 0.3, "and at the tropic in June")
for (let i = 0; i < 50; i++) {
  const p = L.satEci(L.DEFAULT_FLEET[i % 18], L.DEFAULT_PLANES[i % 3], T0 + i * 977000)
  close(Math.hypot(...p), 1, 1e-9, "satellite position is a unit vector")
}

// sun-synchronous: a morning plane crosses the ground near 10:30 local solar time on its way south
const am = L.DEFAULT_PLANES.find((p) => p.id === "am")
const sat = L.DEFAULT_FLEET.find((s) => s.plane === "am")
let found = 0
for (let t = T0; t < T0 + 6 * 3600000 && found < 3; t += 10000) {
  const a = L.subPoint(sat, am, t)
  const b = L.subPoint(sat, am, t + 10000)
  if (a.lat >= 0 && b.lat < 0) {
    const solar = ((new Date(t).getUTCHours() + new Date(t).getUTCMinutes() / 60 + a.lon / 15) % 24 + 24) % 24
    close(solar, 10.5, 0.75, "descending node near 10:30 local solar time")
    assert.ok(a.day, "and in daylight")
    found++
  }
}
assert.ok(found >= 2, "the plane crosses the equator every orbit")

// next pass: within reach, in daylight for optical, deterministic, and radar never waits for the sun
for (const c of L.DEFAULT_CITIES) {
  const p = L.nextPass(L.DEFAULT_FLEET, L.DEFAULT_PLANES, c, T0, 36)
  assert.ok(p, `a pass over ${c.name} within 36 h`)
  assert.ok(p.at >= T0 && p.at - T0 < 36 * 3600000)
  const th = L.gmst(p.at)
  const e = L.toEcef(L.satEci(p.sat, p.plane, p.at), th)
  assert.ok(L.dot(e, L.cityVec(c)) > Math.cos(L.REACH) - 1e-9, "the satellite is within reach of the city")
  if (p.plane.sensor === "optical") assert.ok(L.dot(L.cityVec(c), L.toEcef(L.sunEci(p.at), th)) > Math.sin(10 * Math.PI / 180), "optical passes are in daylight")
  assert.deepEqual(L.nextPass(L.DEFAULT_FLEET, L.DEFAULT_PLANES, c, T0, 36), p, "deterministic")
}
const lagos = L.DEFAULT_CITIES.find((c) => c.name === "Lagos")
const radar = L.nextPass(L.DEFAULT_FLEET, L.DEFAULT_PLANES, lagos, T0, 48, "radar")
assert.equal(radar.plane.sensor, "radar", "a radar request only books radar")
assert.equal(L.nextPass([], L.DEFAULT_PLANES, lagos, T0, 2), null, "no fleet, no pass")

// strip numbers
assert.equal(L.imagedToday(Date.UTC(2026, 9, 15, 0, 0, 0), 9400), 0, "the day count starts at midnight UTC")
assert.equal(L.imagedToday(Date.UTC(2026, 9, 15, 12, 0, 0), 9400), 4700, "half a day, half the scenes")
assert.ok(L.imagedToday(Date.UTC(2026, 9, 15, 23, 59, 59), 9400) < 9400)
assert.equal(L.clock(3725), "01:02:05")
assert.equal(L.clock(-4), "00:00:00", "never negative")
assert.equal(L.fmtLat(-12.34), "12.3°S")
assert.equal(L.fmtLon(151.21), "151.2°E")

// time zone to city, by name and then by offset
assert.equal(L.DEFAULT_CITIES[L.cityForZone(L.DEFAULT_CITIES, "Asia/Tokyo", -540)].name, "Tokyo")
assert.equal(L.DEFAULT_CITIES[L.cityForZone(L.DEFAULT_CITIES, "Europe/Paris", -60)].name, "Rotterdam", "Paris falls back to the nearest offset")
assert.equal(L.DEFAULT_CITIES[L.cityForZone(L.DEFAULT_CITIES, "", 300)].name, "New York", "UTC-5")

// the hero view: a proper rotation that rides with the lead satellite
for (const preset of ["dawn", "day"]) {
  const plane = L.DEFAULT_PLANES.find((p) => p.id === L.PRESETS[preset].plane)
  const lead = L.pickLead(L.DEFAULT_FLEET, plane, T0)
  assert.equal(lead.plane, plane.id, "the lead flies in the preset's plane")
  for (const [w, h] of [[1440, 900], [375, 812], [768, 1024], [3840, 2160]]) {
    let flip
    for (let k = 0; k < 4; k++) {
      const t = T0 + k * 1500000
      const g = L.heroGeometry(t, w, h, preset, plane, lead, flip)
      if (flip === undefined) flip = g.flip
      assert.equal(g.flip, flip, "the direction of travel never flips mid-session")
      const V = g.V
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        const d = V[r * 3] * V[c * 3] + V[r * 3 + 1] * V[c * 3 + 1] + V[r * 3 + 2] * V[c * 3 + 2]
        close(d, r === c ? 1 : 0, 1e-9, "V is orthonormal")
      }
      const nadir = L.project(L.mul(V, L.satEci(lead, plane, t)), g.disk)
      close(nadir.x / w, L.PRESETS[preset].at[0], 0.02, "the lead's ground point holds its place across the frame")
      assert.ok(nadir.y > 60 && nadir.y < h * 0.5, "high in the hero, clear of the copy")
      assert.ok(L.trackPath(g.track, g.disk, w, h).length > 20, "its ground track is in frame")
      close(Math.hypot(...g.sun), 1, 1e-9, "the sun is a direction")
    }
  }
  for (let hr = 0; hr < 24; hr += 2) {
    const t = T0 + hr * 3600000
    const ld = L.pickLead(L.DEFAULT_FLEET, plane, t)
    const g = L.heroGeometry(t, 1440, 900, preset, plane, ld)
    const nadir = L.norm(L.mul(g.V, L.satEci(ld, plane, t)))
    if (preset === "dawn") {
      assert.ok(g.sun[2] < 0 && g.sun[1] > 0, "dawn: the sun is behind the limb and above it")
      assert.ok(Math.abs(L.dot(g.sun, nadir)) < 0.4, "and the lead rides the terminator")
    } else assert.ok(L.dot(g.sun, nadir) > 0.6, "day: the lead is over sunlit ground at any hour")
  }
}
const disk = L.heroDisk(1440, 900)
assert.ok(disk.cy - disk.r > 0 && disk.cy - disk.r < 900 * 0.3, "the limb arcs across the top of the hero")
assert.ok(1440 * 900 * L.canvasRatio(1440, 900, 3, 1.6e6) ** 2 <= 1.6e6 + 1, "pixel budget holds on dense screens")
assert.ok(L.canvasRatio(3840, 2160, 2, 2.2e6) < 1, "and drops below 1 on 4K")

// the flat map: sun overhead, a terminator that is really the day-night line, tracks that wrap
const ss = L.subSolar(Date.UTC(2026, 5, 21, 12))
close(ss.lat, 23.44, 0.3, "June solstice: sun over the tropic of Cancer")
close(ss.lon, 0, 2.5, "around noon UTC it is over Greenwich")
for (const lon of [-150, -60, 0, 45, 120]) {
  const lat = L.terminatorLat(lon, ss.lat, ss.lon)
  const la = lat * Math.PI / 180, lo = lon * Math.PI / 180, sla = ss.lat * Math.PI / 180, slo = ss.lon * Math.PI / 180
  const cosz = Math.sin(la) * Math.sin(sla) + Math.cos(la) * Math.cos(sla) * Math.cos(lo - slo)
  close(cosz, 0, 1e-9, "the terminator has the sun on the horizon")
}
assert.deepEqual(L.mapXY(90, -180, 1000, 500), { x: 0, y: 0 })
assert.deepEqual(L.mapXY(-90, 180, 1000, 500), { x: 1000, y: 500 })
const tk = L.trackSvg(L.DEFAULT_FLEET[0], L.DEFAULT_PLANES[0], T0, T0 + 3 * 3600000, 1000, 500)
assert.ok((tk.match(/M/g) || []).length >= 2, "a long track breaks at the date line instead of drawing across the map")
assert.ok(!/NaN/.test(tk))

// forms and helpers
assert.ok(L.isEmail("ines@port-authority.nl"))
assert.ok(!L.isEmail("ines@port"))
const ok = { area: "Lagos", lat: "", lon: "", from: "2026-10-16", to: "2026-10-20", email: "a@b.co" }
assert.deepEqual(L.validateTask(ok), {})
assert.ok(L.validateTask({ ...ok, to: "2026-10-10" }).to, "a window can't end before it starts")
assert.ok(L.validateTask({ ...ok, email: "nope" }).email)
assert.ok(L.validateTask({ ...ok, area: "custom", lat: "95", lon: "10" }).lat, "latitude is bounded")
assert.ok(L.validateTask({ ...ok, area: "custom", lat: "", lon: "10" }).lat, "and required for coordinates")
assert.deepEqual(L.validateTask({ ...ok, area: "custom", lat: "-23.5", lon: "-46.6" }), {})
assert.equal(L.shade("#ffa23a", 0.5), "#80511d")
assert.equal(L.nextIndex(4, "ArrowRight", 5), 0)
assert.equal(L.nextIndex(0, "ArrowLeft", 5), 4)
assert.equal(L.nextIndex(2, "End", 5), 4)
assert.equal(L.nextIndex(2, "x", 5), 2)

// content that makes sense
assert.equal(L.DEFAULT_FLEET.length, 18)
assert.equal(new Set(L.DEFAULT_FLEET.map((s) => s.id)).size, 18, "unique satellite names")
for (const s of L.DEFAULT_FLEET) assert.ok(L.DEFAULT_PLANES.some((p) => p.id === s.plane), "every satellite flies in a plane")
for (const u of L.DEFAULT_USES) assert.ok(u.title && u.body && u.facts.length >= 2 && u.before && u.after, `${u.id} is complete`)

// imagery: bounded, deterministic, and the other view really differs where it should
for (const kind of ["fields", "flood", "forest", "harbor", "site", "coast", "dunes", "ponds"]) {
  const a = L.renderTile(kind, 48, 30, 7, "#ffa23a")
  const b = L.renderTile(kind, 48, 30, 7, "#ffa23a")
  assert.deepEqual(a.a, b.a, `${kind} is deterministic`)
  let alpha = 0
  for (let i = 3; i < a.a.length; i += 4) alpha += a.a[i]
  assert.equal(alpha, 255 * 48 * 30, `${kind} is opaque`)
}
const diff = (kind) => {
  const t = L.renderTile(kind, 64, 40, 7, "#ffa23a")
  let d = 0
  for (let i = 0; i < t.a.length; i++) d += Math.abs(t.a[i] - t.b[i])
  return d / t.a.length
}
for (const kind of ["fields", "flood", "forest", "harbor", "site", "coast"]) assert.ok(diff(kind) > 6, `${kind} has a second view`)
assert.equal(diff("dunes"), 0, "dunes are true colour only")

console.log("earth-limb-landing: all checks passed")
