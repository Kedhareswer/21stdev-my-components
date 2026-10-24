// Install-safety and scene-geometry checks for dune-haul-footer.
// Run: node tests/dune-haul-footer.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/dune-haul-footer/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("dune-haul-footer.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|url\(["']?(https?:|\/\/|data:)/, "nothing fetched: every url() points at an in-page #id")
assert.doesNotMatch(src, /<img|new Image\(|fetch\(/, "no images, everything is drawn")
assert.match(src, /height = "\d+px"/, "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes("max-width: none"), "the scene svgs are guarded against Preflight")
assert.ok(src.includes('preserveAspectRatio="xMidYMax slice"'), "the layers cover the box, anchored to the road")
assert.ok(src.includes("new ResizeObserver") && src.includes("IntersectionObserver"), "follows its box and sleeps off-screen")
for (const gone of ["cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()", "mo.disconnect()", 'root.removeEventListener("pointermove", onMove)', 'root.removeEventListener("pointerleave", onLeave)']) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}
assert.ok(src.includes('<a className="dhf-link" href='), "links are real anchors")
assert.ok(src.includes("aria-label={s.label || SOCIAL_NAMES[s.icon]}"), "icon-only social links are named")
assert.ok(src.includes('<div ref={sceneRef} className="dhf-scene" aria-hidden="true">'), "the drawn scene is hidden from screen readers")
assert.ok(/<button[\s\S]*?type="button"[\s\S]*?aria-label="Honk the truck's horn"/.test(src), "the truck is a real, named button")
assert.ok(src.includes('className="dhf-bubble" aria-hidden="true"'), "the speech bubble is decoration")
assert.ok(src.includes("React.useId()"), "gradient ids are unique per instance")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|Exclude<|Omit<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
const files = readdirSync(dir).sort()
assert.deepEqual(files, ["README.md", "demo-dusk.tsx", "demo-sage.tsx", "demo.tsx", "dune-haul-footer.tsx"], "folder holds only the component, demos and README")
for (const f of files.filter((f) => f.startsWith("demo"))) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/dune-haul-footer"], f + ": imports only the component")
  assert.match(d, /className="w-full"/, f + ": full width inside 21st's flex wrapper")
}
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/dune-haul-footer"'), "tsconfig paths line exists")

// ---- scoped CSS ----
const css = src.match(/const DHF_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".dhf-")), "unscoped selector: " + sel)
}

// ---- scene geometry ----
const a = src.indexOf("// #region scene\n")
const b = src.indexOf("// #endregion\n", a)
assert.ok(a > -1 && b > a, "scene region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

// PRNG: deterministic, in range, seed-sensitive.
const r1 = L.dhfRng(11)
const r2 = L.dhfRng(11)
const seq = Array.from({ length: 200 }, () => r1())
assert.deepEqual(seq, Array.from({ length: 200 }, () => r2()), "same seed, same flowers")
assert.ok(seq.every((v) => v >= 0 && v < 1), "rng in [0, 1)")
assert.notEqual(L.dhfRng(12)(), seq[0], "a new seed is a new scatter")

// Dunes peak at their crest and fall away on both sides, with their own widths.
const dome = { cx: 600, wl: 200, wr: 400, top: 400, base: 700 }
assert.equal(L.dhfDomeY(dome, 600), 400, "crest at top")
for (let x = -2000; x < 3000; x += 37) {
  const y = L.dhfDomeY(dome, x)
  assert.ok(y >= 400 && y <= 700, "between crest and base at " + x)
}
assert.ok(L.dhfDomeY(dome, 500) > 400 && L.dhfDomeY(dome, 400) > L.dhfDomeY(dome, 500), "falls to the left")
assert.ok(L.dhfDomeY(dome, 800) < L.dhfDomeY(dome, 400), "the wider right flank falls more gently")
assert.match(L.dhfDomePath(dome), /^M[-\d.]+ \d+(L[-\d.]+ [\d.]+)+Z$/, "a closed dune path")
assert.match(L.dhfCrestPath(dome), /^M[-\d.]+ [\d.]+(L[-\d.]+ [\d.]+)+$/, "an open crest line")

// Projection: straight ahead sits on the centre line, far things sink to the horizon.
const [cx0, cy0] = L.dhfProject(0, 1)
assert.equal(cx0, L.DHF_W / 2)
assert.equal(cy0, L.DHF_HORIZON + L.DHF_F)
assert.ok(L.dhfProject(0, 1000)[1] - L.DHF_HORIZON < 1, "the far distance meets the horizon")
assert.ok(L.dhfProject(1, 2)[0] - L.DHF_W / 2 === (L.dhfProject(1, 1)[0] - L.DHF_W / 2) / 2, "twice as far, half the spread")

// The road: the same ground points the component uses.
const pts = JSON.parse(src.match(/const ROAD_PTS = (\[[\s\S]*?\n\])/)[1].replace(/,\s*\]/g, "]"))
const roadW = Number(src.match(/const ROAD_W = ([\d.]+)/)[1])
const road = L.dhfRoad(pts, 36)
assert.equal(road.length, (pts.length - 1) * 36 + 1)
assert.deepEqual([road[0].X, road[0].Z], pts[0], "starts at the far crest")
assert.ok(Math.abs(road.at(-1).X - pts.at(-1)[0]) < 1e-9 && Math.abs(road.at(-1).Z - pts.at(-1)[1]) < 1e-9, "ends past your feet")
for (let i = 1; i < road.length; i++) {
  const p = road[i]
  assert.ok(p.s > road[i - 1].s, "ground distance grows")
  assert.ok(p.Z < road[i - 1].Z, "always coming toward you")
  assert.ok(Math.abs(Math.hypot(p.nX, p.nZ) - 1) < 1e-9 && Math.abs(Math.hypot(p.dx, p.dy) - 1) < 1e-9, "unit normals and directions")
  assert.ok(p.dy > 0, "on screen it always heads down")
}
assert.ok(road[0].y > L.DHF_HORIZON && road[0].y < 600, "the far end sits just under the horizon")
assert.ok(road.at(-1).y > L.DHF_H, "the near end runs out of the frame")
// Driving toward you, the right hand is screen-left.
const head = road.find((p) => Math.abs(p.dx) < 0.2)
assert.ok(head && head.nX < 0, "right-hand normal points screen-left when the road comes straight at you")

// No fold: inside the frame, each edge of the road advances down the screen,
// even round the tight far bend, because it is offset on the ground. (Below
// the frame, where the road swings out of shot, nobody sees it.)
for (const off of [-roadW / 2, roadW / 2]) {
  const ys = road.map((p) => L.dhfProject(p.X + p.nX * off, p.Z + p.nZ * off)[1])
  for (let i = 1; i < ys.length && ys[i - 1] < L.DHF_H; i++) assert.ok(ys[i] > ys[i - 1] - 1, "edge " + off + " folds back at sample " + i)
}

// dhfAt interpolates and clamps.
const total = road.at(-1).s
assert.equal(L.dhfAt(road, -5), road[0])
assert.equal(L.dhfAt(road, total + 5), road.at(-1))
const mid = L.dhfAt(road, (road[10].s + road[11].s) / 2)
assert.ok(mid.Z < road[10].Z && mid.Z > road[11].Z, "in between its neighbours")

// Paving: nothing at 0, the full ribbon at the end, and it only ever grows.
assert.equal(L.dhfBand(road, -0.4, 0.4, 0), "")
const full = L.dhfBand(road, -0.4, 0.4, total + 1)
assert.match(full, /^M[-\d.]+ [-\d.]+(L[-\d.]+ [-\d.]+)+Z$/)
assert.equal(full.split("L").length, road.length * 2, "both edges, every sample")
let prev = 0
for (let k = 1; k <= 10; k++) {
  const n = L.dhfBand(road, -0.4, 0.4, (total * k) / 10).length
  assert.ok(n >= prev, "paving never shrinks")
  prev = n
}

// The trip: pace eases the far stretch, time fractions map monotonically onto the road.
assert.ok(L.dhfPace(20) > L.dhfPace(5) && L.dhfPace(5) > L.dhfPace(1), "faster over the ground the further away")
assert.ok(L.dhfTripCost(road) > 0)
assert.equal(L.dhfAtTime(road, 0), 0)
assert.ok(Math.abs(L.dhfAtTime(road, 1) - total) < 1e-9)
let last = -1
for (let f = 0; f <= 1.0001; f += 0.05) {
  const s = L.dhfAtTime(road, f)
  assert.ok(s >= last, "time maps forward")
  last = s
}
// Half the trip's time puts the truck clearly into the near half of the screen.
assert.ok(L.dhfAt(road, L.dhfAtTime(road, 0.5)).y > 640, "the far stretch takes less than half the trip")

// Hull and boxes.
const hull = L.dhfHull([[0, 0], [2, 0], [2, 2], [0, 2], [1, 1], [1, 0]])
assert.equal(hull.length, 4, "interior and collinear points dropped")
const box = L.dhfBox([-10, -20, 10, 0], [-8, -6], 0.9)
assert.equal(box.side[0][0], -10, "a box running off to the left shows its left flank")
assert.equal(L.dhfBox([-10, -20, 10, 0], [8, -6], 0.9).side[0][0], 10, "and to the right, its right flank")
assert.ok(box.hull.length >= 4 && box.hull.length <= 8)

// The truck: the trailer trails up the road behind the cab.
for (const [dx, dy] of [[0, 1], [-0.8, 0.6], [0.8, 0.6]]) {
  const t = L.dhfTruck(dx, dy)
  assert.ok(t.back[1] < 0, "trailer reaches back up the road")
  assert.ok(Math.sign(t.back[0]) === -Math.sign(dx) || dx === 0, "and swings opposite the heading")
  assert.equal(t.wheels.length, 2)
  assert.equal(t.cabWheels.length, 1)
  for (const w of [...t.wheels, ...t.cabWheels]) assert.ok(w.every(Number.isFinite))
}
const sideways = Math.hypot(...L.dhfTruck(1, 0.05).back)
const headOn = Math.hypot(...L.dhfTruck(0, 1).back)
assert.ok(sideways > headOn, "foreshortened when it comes straight at you")
assert.match(L.dhfWheel([0, 0], [0.5, -0.2], 6), /^M[-\d.]+ [-\d.]+(L[-\d.]+ [-\d.]+){15}Z$/, "a 16-point wheel")

// Fit: cover, anchored bottom-centre.
const f1 = L.dhfFit(1440, 900)
assert.deepEqual([f1.s, f1.ox, f1.oy], [1, 0, 0])
const f2 = L.dhfFit(390, 800)
assert.ok(f2.s * L.DHF_H >= 800 && f2.s * L.DHF_W >= 390, "covers a phone")
assert.ok(Math.abs(f2.ox + (L.DHF_W * f2.s) / 2 - 195) < 1e-9, "centred")
assert.ok(Math.abs(f2.oy + L.DHF_H * f2.s - 800) < 1e-9, "bottom-anchored")

assert.equal(L.dhfEaseOut(-1), 0)
assert.equal(L.dhfEaseOut(2), 1)
assert.ok(L.dhfEaseOut(0.5) > 0.5, "eases out")

console.log("dune-haul-footer: ok")
