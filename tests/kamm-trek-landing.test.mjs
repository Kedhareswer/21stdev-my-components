// Install-safety and logic checks for components/kamm-trek-landing.
// Run: node tests/kamm-trek-landing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "kamm-trek-landing"
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
assert.doesNotMatch(src, /https?:\/\//, "no URLs, so it renders in the capture sandbox")
assert.match(src, /<img className="kmm-photo" src=\{stage\.image\}/, "images appear only when an installer passes one")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /\["--kmm-h" as string\]: height/, "the height prop reaches the root")
assert.match(src, /\.kmm-hero\{position:relative;height:var\(--kmm-h\);min-height:620px/, "the hero takes that definite height")
assert.match(src, /\.kmm-map\{position:relative;height:clamp\(/, "the route map has a definite height")
assert.match(src, /\.kmm-excerpt\{position:relative;aspect-ratio:4\/3/, "hut excerpts size from their width")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
for (const m of src.matchAll(/([.\w-]+)\{[^}]*height:100%/g)) assert.match(m[0], /position:absolute/, `a percentage height only on absolutely placed media: ${m[1]}`)
assert.match(src, /style=\{\{ width: size\.w \+ "px", height: size\.h \+ "px" \}\}/, "canvases get pixel sizes from measurement, not percentages")
assert.match(src, /React\.useId\(\)\.replace/, "ids are namespaced per instance")
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|Promise<|React\.[A-Za-z]+<|\[K in /, "no generics before the first JSX close tag (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.ok(src.lastIndexOf("Promise<") > src.lastIndexOf("</"), "the one generic type sits after the JSX")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS (glides, scrolling)")
assert.doesNotMatch(src, /[—–]/, "no em or en dashes anywhere")
assert.doesNotMatch(src, />[^<{]*\\u[0-9a-f]{4}/i, "no \\u escapes inside JSX text")
for (const demo of ["demo.tsx", "demo-winter.tsx"]) assert.doesNotMatch(read(demo), /[—–]|https?:\/\//, `${demo}: no dashes, no URLs`)

const css = src.match(/const KMM_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^(\.kmm-|\[data-ready="1"\]>\.kmm-)/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.kmm-root img,\.kmm-root canvas,\.kmm-root svg\{max-width:none\}/, "media are guarded against Preflight")
assert.match(css[1], /\.kmm-root :where\(button,input,output\)\{/, "the reset has no specificity to fight")
assert.match(css[1], /\.kmm-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky nav")
assert.match(css[1], /\.kmm-nav\{position:sticky/, "the nav sticks")
assert.match(css[1], /\.kmm-root\[data-theme="dark"\]\{/, "a designed dark sheet")
assert.match(css[1], /\.kmm-root\[data-preset="winter"\]\{/, "and a winter sheet")
assert.match(css[1], /--kmm-accent-text:#ff7a7d/, "red text is lifted for contrast in the dark")

/* ---------- it behaves like a product page ---------- */

for (const k of ["route", "huts", "included", "departures", "reviews", "faq"]) assert.ok(src.includes(`sid("${k}")`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth", block: "start" \}\)/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /role="slider"/, "the profile is a slider")
assert.match(src, /aria-valuetext=\{dayWord \+ " " \+ \(at\.i \+ 1\)/, "and says where you are")
assert.match(src, /e\.key === "PageUp"/, "PageUp jumps a day")
assert.match(src, /touch-action:pan-y/, "the profile scrubs sideways without trapping vertical scrolling on phones")
assert.match(src, /role="tablist" aria-label="Day"/, "days are a tablist")
assert.match(src, /pickDay\(n, true\)/, "arrow keys move days instantly, without animation")
assert.match(src, /onClick=\{\(\) => onPick\(p\.i\)\}/, "hero pins open that day on the map")
assert.match(src, /aria-live="polite" aria-atomic="true"/, "the day card is announced")
assert.match(src, /role="radiogroup" aria-label="Month"/, "departures filter by month")
assert.match(src, /if \(res === false\) ok = false/, "onHold can refuse")
assert.match(src, /isEmail\(email\)/, "the form validates the email")
assert.match(src, /aria-invalid=\{!!errors\.email\}/, "errors are tied to their fields")
assert.match(src, /aria-expanded=\{open === i\}/, "questions are disclosures")
assert.match(src, /aria-modal="true"/, "the phone menu is a modal dialog")
assert.match(src, /e\.key === "Escape"/, "Escape closes it")
assert.match(src, /html\.style\.overflow = was/, "and the page scroll comes back")
assert.match(src, /canvasRatio\(size\.w, size\.h, [^)]*1\.4e6\)/, "the hero holds a pixel budget")
assert.ok(read("demo.tsx").includes("<KammTrekLanding />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-winter.tsx"), /preset="winter"/, "the second demo is the winter preset")

/* ---------- logic, executed ---------- */

const code = region("content") + region("logic") +
  "\nexport { DEFAULT_START, DEFAULT_STAGES, DEFAULT_DEPARTURES, SCENES, PRINTS, MAP_KM, clamp, noise2, terrain, makeGrid, sampleH, cubicAt, printSheet, shadeGrid, renderVista, project, stageProfile, stageStats, routeTotals, stageStarts, locate, altAt, trailPath, trailAt, mapView, findPeaks, fmtNum, fmtKm, dateRange, dayMonth, weekday, monthKey, spotsLeft, formatPrice, isEmail, nextIndex, canvasRatio, heroCam, placeLabels, initials }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

// noise and terrain: smooth, bounded, deterministic, alpine
for (let i = 0; i < 300; i++) {
  const x = i * 0.137 - 20
  const y = i * 0.291 + 3
  const n = L.noise2(x, y, 7)
  assert.ok(n >= -1.5 && n <= 1.5, "noise bounded")
  assert.equal(n, L.noise2(x, y, 7), "deterministic")
  assert.ok(Math.abs(n - L.noise2(x + 0.001, y, 7)) < 0.01, "continuous")
}
const g = L.makeGrid(96, -0.05, -0.05, 1.1, 7, 5)
let lo = Infinity
let hi = -Infinity
for (const h of g.h) {
  lo = Math.min(lo, h)
  hi = Math.max(hi, h)
}
assert.ok(lo > 900 && lo < 1500, `valleys near 1,200 m (${lo | 0})`)
assert.ok(hi > 2900 && hi < 4200, `summits above the snow line (${hi | 0})`)
assert.notDeepEqual(L.makeGrid(16, 0, 0, 1, 7).h, L.makeGrid(16, 0, 0, 1, 8).h, "the seed moves the mountains")
const crest = L.terrain(0.5, 0.35, 7)
assert.ok(crest > L.terrain(0.5, 0.95, 7) + 600, "the crest stands over the valley the trek starts in")
const c = { h: 0, dx: 0, dy: 0 }
L.cubicAt(g, 40.5, 40.5, c)
assert.ok(Math.abs(c.h - L.sampleH(g, -0.05 + (40.5 / 95) * 1.1, -0.05 + (40.5 / 95) * 1.1)) < 60, "cubic and bilinear agree")

// the printed sheet: every pixel opaque, contours actually drawn
const W = 120
const H = 90
const out = new Uint8ClampedArray(W * H * 4)
L.printSheet(out, W, H, g, { u0: 0.1, v0: 0.2, span: 0.8 }, L.PRINTS["summer-day"])
let opaque = 0
let brown = 0
for (let i = 0; i < W * H; i++) {
  if (out[i * 4 + 3] === 255) opaque++
  if (out[i * 4] > out[i * 4 + 2] + 25 && out[i * 4] < 200) brown++
}
assert.equal(opaque, W * H, "the sheet is fully printed")
assert.ok(brown > 40, "brown contour ink on it")

// the relief model: sky on top, ground below, depth written where the ground is
const ng = L.makeGrid(120, -0.22, -0.38, 1.45, 7, 4)
for (const key of Object.keys(L.SCENES)) {
  const sh = L.shadeGrid(ng, L.SCENES[key], 7)
  const VW = 160
  const VH = 100
  const img = new Uint8ClampedArray(VW * VH * 4)
  const depth = new Float32Array(VW * VH)
  const cam = L.heroCam(VW, VH)
  L.renderVista(img, depth, VW, VH, ng, sh, L.SCENES[key], cam)
  for (let i = 0; i < VW * VH; i++) assert.equal(img[i * 4 + 3], 255, key + ": every pixel painted")
  assert.equal(depth[2 * VW + 80], 1e9, key + ": sky at the top has no depth")
  assert.ok(depth[(VH - 2) * VW + 80] < 1e9, key + ": ground at the bottom")
}
const cam = L.heroCam(1440, 900)
const p = L.project(1440, 900, cam, 0.5, 0.4, 2500)
assert.ok(p && p.x > 600 && p.x < 840 && p.y > 0 && p.y < 900, "the crest in the middle of the frame")
assert.equal(L.project(1440, 900, cam, 0.5, cam.v + 0.1, 2000), null, "nothing behind the camera")
assert.ok(L.heroCam(390, 844).fov < 70 && L.heroCam(390, 844).horizon > cam.horizon, "a tall phone gets its own framing")

// stages add up
const s0 = L.DEFAULT_STAGES
assert.deepEqual(L.stageProfile(1000, { ...s0[0], profile: [1, 2, 3] }), [1000, 2, s0[0].alt], "profile ends pinned to the stops")
assert.deepEqual(L.stageStats(100, { alt: 300, profile: [100, 250, 200, 300] }), { up: 250, down: 50, high: 300, low: 100 })
const tot = L.routeTotals(L.DEFAULT_START, s0)
assert.equal(tot.km, 74.4, "74.4 km, as the hero promises (74)")
assert.equal(tot.days, 6)
assert.equal(tot.high, 3048, "the pass is the high point")
assert.equal(s0.filter((s) => s.sleep).length, 5, "five huts, as the copy says")
assert.deepEqual(s0.filter((s) => s.duffel).map((s) => s0.indexOf(s) + 1), [1, 4, 5], "duffel nights match the legend and the FAQ")
const starts = L.stageStarts(s0)
assert.equal(starts.length, 7)
assert.deepEqual(L.locate(s0, 0), { i: 0, f: 0 })
assert.equal(L.locate(s0, starts[3] + 0.01).i, 3)
assert.equal(L.locate(s0, 999).i, 5, "clamped to the last day")
assert.equal(L.altAt(1180, s0[0], 0), 1180)
assert.equal(L.altAt(1180, s0[0], 1), s0[0].alt)

// the trail starts and ends at the stops and passes every hut
const path = L.trailPath(L.DEFAULT_START, s0, 7)
assert.deepEqual([path[0].u, path[0].v], L.DEFAULT_START.at)
for (let i = 0; i < s0.length; i++) {
  const end = L.trailAt(path, i, 1)
  assert.ok(Math.hypot(end.u - s0[i].at[0], end.v - s0[i].at[1]) < 1e-9, `day ${i + 1} ends at its hut`)
  const mid = L.trailAt(path, i, 0.5)
  assert.ok(Number.isFinite(mid.u) && Number.isFinite(mid.v))
}
const view = L.mapView([L.DEFAULT_START.at, ...s0.map((s) => s.at)], 1.5)
assert.ok(Math.abs(view.w / view.h - 1.5) < 1e-9, "the map window keeps the frame's aspect")
for (const s of s0) assert.ok(s.at[0] > view.u0 && s.at[0] < view.u0 + view.w && s.at[1] > view.v0 && s.at[1] < view.v0 + view.h, "every hut is on the map")
const peaks = L.findPeaks(g, 5, 0.15)
assert.ok(peaks.length >= 3, "summits found")
for (let i = 1; i < peaks.length; i++) assert.ok(peaks[i].h <= peaks[i - 1].h, "highest first")

// map lettering never overlaps
const placed = L.placeLabels(
  [
    { x: 100, y: 100, w: 80, h: 14, gap: 8, order: "rltb" },
    { x: 130, y: 100, w: 80, h: 14, gap: 8, order: "rltb" },
    { x: 115, y: 100, w: 80, h: 14, gap: 8, order: "rltb" },
  ],
  400,
  300,
)
assert.equal(placed[0].side, "r")
assert.notEqual(placed[1].side, "r", "the second label moves out of the way")
const boxes = placed.filter(Boolean).map((b, i) => ({ x0: b.x, y0: b.y, x1: b.x + 80, y1: b.y + 14, i }))
for (const a of boxes) for (const b of boxes) if (a.i < b.i) assert.ok(a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0, "no two labels overlap")
assert.equal(L.placeLabels([{ x: 5, y: 5, w: 500, h: 10, gap: 2, order: "rltb" }], 100, 100)[0], null, "a label that cannot fit is dropped")

// words and numbers
assert.equal(L.fmtNum(2912), "2,912")
assert.equal(L.fmtNum(2784, " "), "2 784")
assert.equal(L.fmtKm(11.0), "11")
assert.equal(L.fmtKm(74.44), "74.4")
assert.equal(L.dateRange("2027-06-27", 6), "27 Jun to 2 Jul")
assert.equal(L.dateRange("2027-07-04", 6), "4 to 9 Jul")
assert.equal(L.dateRange("2027-12-29", 6), "29 Dec 2027 to 3 Jan")
assert.equal(L.dayMonth("2027-06-27"), "27 Jun")
assert.equal(L.weekday("2027-06-27"), "Sun")
assert.equal(L.monthKey("2027-09-12"), "Sep")
assert.equal(L.formatPrice(2480, "CHF"), "CHF 2,480")
assert.equal(L.spotsLeft({ capacity: 10, booked: 8 }, 1), 1)
assert.equal(L.spotsLeft({ capacity: 10, booked: 12 }), 0, "never negative")
assert.ok(L.isEmail("ruth@example.com"))
assert.ok(!L.isEmail("ruth@example"))
assert.equal(L.nextIndex(5, "ArrowRight", 6), 0)
assert.equal(L.nextIndex(0, "ArrowLeft", 6), 5)
assert.equal(L.nextIndex(2, "End", 6), 5)
assert.equal(L.initials("Anna Caduff"), "AC")
assert.ok(1440 * 900 * L.canvasRatio(1440, 900, 3, 1.4e6) ** 2 <= 1.4e6 + 1, "pixel budget holds on dense screens")
assert.ok(L.canvasRatio(3840, 2160, 2, 1.4e6) < 1, "and drops below 1 on 4K")

// the default season makes sense
const ids = new Set()
for (const d of L.DEFAULT_DEPARTURES) {
  assert.ok(!ids.has(d.id), "unique ids")
  ids.add(d.id)
  assert.ok(d.booked >= 0 && d.booked <= d.capacity)
  assert.equal(L.weekday(d.start), "Sun", "groups leave on Sundays")
}
assert.ok(L.DEFAULT_DEPARTURES.some((d) => d.booked === d.capacity), "the default season shows a full group")

console.log("kamm-trek-landing: ok")
