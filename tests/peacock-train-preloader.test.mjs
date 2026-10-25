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
assert.ok(src.includes("max-width: none"), "the canvas and the bird are guarded against Preflight")
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

// Rings open in order and each is fully open by the end.
for (let layer = 0; layer < 3; layer++) {
  assert.equal(L.pplOpen(0, layer), 0)
  assert.equal(L.pplOpen(1, layer), 1)
  let last = 0
  for (let i = 0; i <= 100; i++) {
    const v = L.pplOpen(i / 100, layer)
    assert.ok(v >= last - 1e-9, "ring " + layer + " never folds back")
    last = v
  }
}
assert.ok(L.pplOpen(0.4, 0) > L.pplOpen(0.4, 1) && L.pplOpen(0.4, 1) > L.pplOpen(0.4, 2), "inner ring leads, outer trails")

// Layout: symmetric, sorted back to front, the right number of feathers.
const counts = L.pplCounts("full")
const train = L.pplBuild(counts, 300, 3)
assert.equal(train.length, counts[0] + counts[1] + counts[2])
assert.deepEqual(L.pplCounts("sparse").map((n, i) => n < counts[i]), [true, true, true])
assert.deepEqual(L.pplCounts("lush").map((n, i) => n > counts[i]), [true, true, true])
const angles = train.map((f) => Math.round(f.theta * 1000) / 1000)
for (const f of train) {
  const twin = train.find((g) => g.layer === f.layer && Math.abs(g.theta + f.theta) < 1e-6)
  assert.ok(twin, "every feather has a mirror twin")
  assert.equal(twin.variant, f.variant, "twins share a variant")
  assert.equal(twin.len, f.len, "twins share a length")
  assert.equal(f.mirror, f.theta < 0, "the left side is mirrored")
}
assert.ok(Math.min(...angles) >= -150 && Math.max(...angles) <= 150, "the train stays inside its spread")
for (let i = 1; i < train.length; i++) {
  const p = train[i - 1]
  const q = train[i]
  assert.ok(p.layer >= q.layer, "outer rings are drawn first")
  if (p.layer === q.layer) assert.ok(Math.abs(p.theta) >= Math.abs(q.theta) - 1e-9, "low feathers are drawn under high ones")
}
// Rings nest: each ring reaches further than the one inside it.
const reach = [0, 1, 2].map((l) => Math.max(...train.filter((f) => f.layer === l).map((f) => f.base + f.len)))
assert.ok(reach[0] < reach[1] && reach[1] < reach[2], "rings nest outward")
assert.ok(Math.abs(reach[2] - L.PPL_REACH) < 0.2, "the outer ring reaches PPL_REACH")
// Wider spread, wider feathers; same seed, same train; another seed, another train.
assert.ok(L.pplBuild(counts, 340, 3)[0].half > L.pplBuild(counts, 200, 3)[0].half)
assert.deepEqual(L.pplBuild(counts, 300, 3), train, "deterministic for a seed")
assert.notDeepEqual(
  L.pplBuild(counts, 300, 4).map((f) => f.phase),
  train.map((f) => f.phase),
  "a new seed reshuffles",
)
assert.equal(L.pplBuild(counts, 10, 3).length, train.length, "a silly spread is clamped, not fatal")
assert.ok(Math.max(...L.pplBuild(counts, 10, 3).map((f) => f.theta)) <= 60, "clamped to 120°")

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
assert.ok(g0.hole < 60 * 0.95, "the window sits inside the quills at rest")

// Angles and colours.
assert.equal(L.pplAngleDiff(170, -170), -20)
assert.equal(L.pplAngleDiff(-170, 170), 20)
assert.equal(L.pplAngleDiff(10, 10), 0)
assert.deepEqual(L.pplHex("#f59e1b", [0, 0, 0]), [245, 158, 27])
assert.deepEqual(L.pplHex("#fff", [0, 0, 0]), [255, 255, 255])
assert.deepEqual(L.pplHex("cobalt", [1, 2, 3]), [1, 2, 3], "a named colour falls back")
assert.equal(L.pplMix("#000000", "#ffffff", 0.5), "rgb(128,128,128)")
assert.equal(L.pplRgba("#ff0000", 0.5), "rgba(255,0,0,0.5)")
assert.ok(L.pplLuma("#ffffff") > 250 && L.pplLuma("#000000") < 1)
assert.ok(L.pplBackOut(0.7) > 1 && Math.abs(L.pplBackOut(1) - 1) < 1e-9, "the eye overshoots, then settles")
assert.equal(L.pplSmooth(0, 1, 0.5), 0.5)
assert.equal(L.pplOutQuart(1), 1)

console.log("peacock-train-preloader: ok")
