// Install-safety and train checks for peacock-train-preloader.
// Run: node tests/peacock-train-preloader.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/peacock-train-preloader/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("peacock-train-preloader.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|https?:\/\//, "nothing fetched")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes("max-width: none"), "the canvas is guarded against Preflight")
assert.ok(src.includes('role="progressbar"') && src.includes("aria-valuenow={pct}"), "reports progress")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.ok(src.includes("cancelAnimationFrame(raf)") && src.includes("ro.disconnect()"), "cleans up its loop and observer")
assert.ok(src.includes('removeEventListener("pointermove"'), "removes its pointer listeners")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
for (const f of ["demo.tsx", "demo-midnight.tsx", "demo-opal.tsx"]) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.ok(di.includes("@/components/ui/peacock-train-preloader"), f + ": imports the component by its install path")
  assert.ok(di.every((i) => i === "react" || i.startsWith("@/components/ui/")), f + ": nothing local")
  assert.doesNotMatch(d, /https?:\/\//, f + ": no external assets")
}
assert.match(read("demo.tsx"), /<PeacockTrainPreloader loop \/>/, "default demo is the bare looping component")
assert.match(read("demo-opal.tsx"), /onComplete=/, "the usage demo wraps a page and listens for completion")

// ---- scoped CSS ----
const css = src.match(/const PPL_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".ppl-")), "unscoped selector: " + sel)
}

// ---- train ----
const a = src.indexOf("// #region train\n")
const b = src.indexOf("// #endregion\n", a)
assert.ok(a > -1 && b > a, "train region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

// The simulated load runs 0 → 100 and never backwards.
assert.equal(L.pplSimulated(0), 0)
assert.equal(L.pplSimulated(1), 100)
let prev = -1
for (let i = 0; i <= 1000; i++) {
  const v = L.pplSimulated(i / 1000)
  assert.ok(v >= prev - 1e-9 && v >= 0 && v <= 100, "monotonic at t=" + i / 1000)
  prev = v
}

// Rows open in order and each is fully open by the end.
const rows = L.pplRows("full", 300)
const nr = rows.length
assert.equal(nr, 8, "eight rows: collar, scallops, halo")
for (let r = 0; r < nr; r++) {
  assert.equal(L.pplOpen(0, r, nr), 0)
  assert.equal(L.pplOpen(1, r, nr), 1)
  let last = 0
  for (let i = 0; i <= 100; i++) {
    const v = L.pplOpen(i / 100, r, nr)
    assert.ok(v >= last - 1e-9, "row " + r + " never folds back")
    last = v
  }
}
for (let r = 1; r < nr; r++) assert.ok(L.pplOpen(0.45, r - 1, nr) >= L.pplOpen(0.45, r, nr), "inner rows lead")

// Row geometry: rows nest outward, feathers lengthen, the outer row reaches PPL_REACH.
assert.deepEqual(rows.map((r) => r.kind), ["collar", "collar", "scallop", "scallop", "scallop", "scallop", "halo", "halo"])
for (let r = 1; r < nr; r++) {
  assert.ok(rows[r].base > rows[r - 1].base && rows[r].len > rows[r - 1].len, "row " + r + " sits outside and is longer")
  assert.ok(rows[r].base < rows[r - 1].base + rows[r - 1].len, "row " + r + " overlaps the row inside it like scales")
}
assert.ok(Math.abs(rows[nr - 1].base + rows[nr - 1].len - L.PPL_REACH) < 1e-9)
// Neighbouring feathers overlap: each is wider than the gap between quills.
for (const r of rows) {
  const arc = (Math.PI * 2 * (r.base + r.len * 0.6) * 300) / 360
  assert.ok(r.half * 2 > arc / (r.count - 1), "feathers overlap in a " + r.kind + " row")
}
const total = (d) => L.pplRows(d, 300).reduce((n, r) => n + r.count, 0)
assert.ok(total("sparse") < total("full") && total("full") < total("lush"), "density changes the feather count")

// Layout: symmetric, scale-offset rows, sorted back to front.
const train = L.pplBuild(rows, 300, 3)
for (const f of train) {
  const twin = train.find((g) => g.row === f.row && Math.abs(g.theta + f.theta) < 1e-6)
  assert.ok(twin, "every feather has a mirror twin")
  assert.equal(twin.variant, f.variant, "twins share a variant")
  assert.equal(twin.len, f.len, "twins share a length")
  assert.equal(f.mirror, f.theta < 0, "the left side is mirrored")
}
const angles = train.map((f) => f.theta)
assert.ok(Math.min(...angles) >= -150 - 1e-9 && Math.max(...angles) <= 150 + 1e-9, "the train stays inside its spread")
assert.equal(train.filter((f) => f.row === 0).length, rows[0].count)
assert.equal(train.filter((f) => f.row === 1).length, rows[1].count - 1, "odd rows sit between the feathers of even rows")
for (let i = 1; i < train.length; i++) {
  const p = train[i - 1]
  const q = train[i]
  assert.ok(p.row >= q.row, "outer rows are drawn first")
  if (p.row === q.row) assert.ok(Math.abs(p.theta) >= Math.abs(q.theta) - 1e-9, "low feathers are drawn under high ones")
}
assert.deepEqual(L.pplBuild(rows, 300, 3), train, "deterministic for a seed")
assert.notDeepEqual(L.pplBuild(rows, 300, 4).map((f) => f.phase), train.map((f) => f.phase), "a new seed reshuffles")
assert.ok(Math.max(...L.pplBuild(L.pplRows("full", 10), 10, 3).map((f) => f.theta)) <= 60 + 1e-9, "a silly spread is clamped to 120°")

// Watercolour deformation: deterministic, doubles the points per pass, stays near the shape.
const sq = [[0, 0], [100, 0], [100, 100], [0, 100]]
const d1 = L.pplDeform(sq, 3, 0.3, L.pplRng(9))
assert.equal(d1.length, 4 * 8)
assert.deepEqual(d1, L.pplDeform(sq, 3, 0.3, L.pplRng(9)))
assert.ok(d1.every((p) => p[0] > -40 && p[0] < 140 && p[1] > -40 && p[1] < 140), "edges bleed, they don't fly off")
assert.deepEqual(L.pplDeform(sq, 0, 0.3, L.pplRng(9)), sq)

// The fan: folded straight down behind the bird when closed, resting at its own angle when open.
assert.equal(L.pplFan(40, 0), 180)
assert.equal(L.pplFan(-40, 0), -180)
assert.ok(Math.abs(L.pplFan(40, 1) - 40) < 1e-9)
assert.ok(Math.abs(L.pplFan(-120, 1) + 120) < 1e-9)
let fan = 180
for (let i = 1; i <= 100; i++) {
  const v = L.pplFan(40, i / 100)
  assert.ok(v <= fan + 1e-9, "a feather sweeps up without doubling back")
  fan = v
}

// The gate starts at rest and ends with a window past the viewport's corner.
const g0 = L.pplGate(0, 60, 1440, 900)
const g1 = L.pplGate(1, 60, 1440, 900)
assert.equal(g0.scale, 1)
assert.ok(g1.hole > Math.hypot(1440, 900) / 2, "the window clears the corners: " + g1.hole)
assert.ok(L.pplGate(0.5, 60, 1440, 900).scale < (1 + g1.scale) / 2, "eases in: slow start, fast finish")
assert.ok(g0.hole < 60 * 0.9, "the window sits inside the collar's quills at rest")

// Angles and colours.
assert.equal(L.pplAngleDiff(170, -170), -20)
assert.equal(L.pplAngleDiff(-170, 170), 20)
assert.equal(L.pplAngleDiff(10, 10), 0)
assert.deepEqual(L.pplHex("#f59e1b", [0, 0, 0]), [245, 158, 27])
assert.deepEqual(L.pplHex("#fff", [0, 0, 0]), [255, 255, 255])
assert.deepEqual(L.pplHex("cobalt", [1, 2, 3]), [1, 2, 3], "a named colour falls back")
assert.deepEqual(L.pplHex("rgb(1, 2, 3)", [0, 0, 0]), [1, 2, 3], "mixes can be mixed again")
assert.deepEqual(L.pplHex(L.pplMix("#000000", "#ffffff", 1), [0, 0, 0]), [255, 255, 255])
assert.equal(L.pplMix("#000000", "#ffffff", 0.5), "rgb(128,128,128)")
assert.equal(L.pplRgba("#ff0000", 0.5), "rgba(255,0,0,0.5)")
assert.ok(L.pplLuma("#ffffff") > 250 && L.pplLuma("#000000") < 1)
assert.equal(L.pplSmooth(0, 1, 0.5), 0.5)
assert.equal(L.pplOutQuart(1), 1)

console.log("peacock-train-preloader: ok")
