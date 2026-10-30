// Install-safety, timeline and artwork checks for gilded-lotus-preloader.
// Run: node tests/gilded-lotus-preloader.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/gilded-lotus-preloader/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("gilded-lotus-preloader.tsx")
const DEMOS = ["demo.tsx", "demo-ivory.tsx", "demo-noir.tsx"]
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|https?:\/\//, "nothing fetched: every mark is drawn in the file")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes(".glp-root canvas, .glp-root svg, .glp-root img { max-width: none; }"), "media is guarded against Preflight")
assert.ok(src.includes('role="progressbar"') && src.includes("aria-valuenow={pct}"), "reports progress")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.doesNotMatch(src, /\}, \[[^\]]*\bonComplete\b[^\]]*\]\)/, "effects must not depend on onComplete identity")
assert.ok(src.includes("cancelAnimationFrame(raf)") && src.includes("ro.disconnect()"), "cleans up its loop and observer")
assert.ok(src.includes("Math.sqrt(3600000 / (w * h))"), "three full-frame canvases hold a pixel budget on big screens")
assert.ok(src.includes("React.useId()"), "gradient ids are unique per instance")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(src, /href=["']#["']/, "no placeholder # links")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)

// ---- scoped CSS ----
const css = src.match(/const GLP_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
let rules = 0
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".glp-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 30, `expected a full scoped sheet, saw ${rules} rules`)
for (const phase of ["hold", "flood", "card", "recede", "open"]) {
  assert.ok(css.includes(`[data-phase="${phase}"]`), `phase ${phase} is styled`)
}

// ---- the two pure regions, executed ----
const region = (name) => {
  const a = src.indexOf("// #region " + name + "\n")
  const b = src.indexOf("// #endregion", a)
  assert.ok(a > -1 && b > a, name + " region missing")
  return src.slice(a, b)
}
const consts = src.match(/const RAY_WINDOW[\s\S]*?const TAPER = \d+\n/)[0]
const L = await import(
  "data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(consts + region("timeline") + region("art")))
)

// simulated load: 0 → 100, never backwards
assert.equal(L.glpSimulated(0), 0)
assert.equal(L.glpSimulated(1), 100)
assert.equal(L.glpSimulated(-3), 0)
assert.equal(L.glpSimulated(9), 100)
let prev = -1
for (let i = 0; i <= 1000; i++) {
  const v = L.glpSimulated(i / 1000)
  assert.ok(v >= prev - 1e-9 && v >= 0 && v <= 100, "monotonic at t=" + i / 1000)
  prev = v
}

// the gilding is the progress bar: three quarters of a turn from eight o'clock
assert.equal(L.GLP_START, 150)
assert.equal(L.GLP_SWEEP, 270)
assert.equal(L.glpLead(0), 150)
assert.equal(L.glpLead(1), 420)
assert.equal(L.glpLead(0.5), 285)
assert.equal(L.glpLead(2), 420, "the gold never runs past its sweep")

// the storyboard runs in order: stem, ink, bud, bloom
assert.equal(L.glpStem(0), 0)
assert.equal(L.glpStem(0.16), 1, "the stem is up before the ink is half spread")
assert.equal(L.glpInk(0.12), 0, "the ink waits for the stem")
assert.equal(L.glpInk(0.62), 1)
assert.ok(L.glpInk(0.3) > 0.6, "ink spreads fast, then slow")
assert.equal(L.glpRise(0.24), 0)
assert.equal(L.glpRise(0.42), 1)
assert.equal(L.glpBloom(0.36), 0)
assert.equal(L.glpBloom(0.98), 1, "the lotus is fully open before the count reaches 100")
for (let i = 0; i < 200; i++) {
  const p = i / 200
  for (const f of [L.glpStem, L.glpInk, L.glpBloom]) assert.ok(f(p + 0.005) >= f(p) - 1e-9, "stages never run backwards")
}
assert.ok(L.glpBack(0.7) > 1, "petals overshoot as they open")
assert.equal(L.glpBack(1), 1, "and settle")
assert.equal(L.glpStage(5, 3, 3), 1, "a zero-length stage does not divide by zero")
assert.equal(L.glpStage(2, 3, 3), 0)

// helpers
assert.deepEqual(L.glpHex("#ff8000", [0, 0, 0]), [255, 128, 0])
assert.deepEqual(L.glpHex("tomato", [1, 2, 3]), [1, 2, 3], "named colours fall back")
assert.deepEqual(L.glpMix([0, 0, 0], [100, 200, 50], 0.5), [50, 100, 25])
assert.equal(L.glpRgba([1.4, 2.6, 3], 0.5), "rgba(1,3,3,0.5)")
assert.ok(Math.abs(L.glpAngleDelta(3, -3) - (2 * Math.PI - 6)) < 1e-9, "the light turns the short way round")
assert.ok(Math.abs(L.glpAngleDelta(0, 1)) - 1 < 1e-9)

// seeded: the same gold on every mount
const a = L.glpRandom(42)
const b = L.glpRandom(42)
const seq = Array.from({ length: 50 }, () => a())
assert.deepEqual(seq, Array.from({ length: 50 }, () => b()))
assert.ok(seq.every((v) => v >= 0 && v < 1))
assert.notDeepEqual(seq, Array.from({ length: 50 }, L.glpRandom(43)))

// ---- artwork ----
const lotus = L.glpLotus()
assert.equal(lotus.length, 14, "five back, two outer, four middle and three front petals")
for (const row of ["back", "outer", "mid", "front"]) assert.ok(lotus.some((p) => p.row === row), row + " row present")
assert.ok(lotus.every((p) => p.start >= 0 && p.start + p.span <= 1.0001), "every petal finishes opening within the bloom")
for (const p of lotus) {
  const d = L.glpPetalPath(p.length, p.width)
  assert.match(d, /^M0 0C[-\d. ]+C[-\d. ]+Z$/, "petal path is plain path data")
  assert.doesNotMatch(d + L.glpVeinPath(p.length), /NaN|Infinity/)
}
const rough = L.glpRough(5, 64)
assert.equal(rough.length, 64)
assert.ok(rough.every((v) => v >= 0 && v <= 1), "roughness stays in range")
const blot = L.glpBlot(100, 100, 50, rough, 1, 0.3)
assert.equal(blot.length, 128)
for (let i = 0; i < blot.length; i += 2) {
  const r = Math.hypot(blot[i] - 100, blot[i + 1] - 100)
  assert.ok(r > 42 && r < 58, "the ink's edge breathes without tearing")
}
const strokes = L.glpStrokes(11, 2000)
assert.equal(strokes.a.length, 2000)
assert.ok(strokes.a.every((x) => x >= 150 && x <= 420), "scratches stay on the sweep")
assert.ok(strokes.r1.every((x) => x <= 1.04), "scratches stay inside the leaf")
assert.ok(strokes.alpha[0] < strokes.alpha.slice(-200).reduce((s, x) => s + x, 0) / 200, "the gilding takes slowly at its start")
const rays = L.glpRays(14, 400)
assert.ok(rays.r1.some((x) => x > 1.1), "some rays run past the leaf, as a dry brush does")

// ---- demos and wiring ----
for (const f of DEMOS) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.ok(di.includes("@/components/ui/gilded-lotus-preloader"), f + ": imports the canonical path")
  assert.ok(di.every((x) => x === "react" || x === "@/components/ui/gilded-lotus-preloader"), f + ": no other imports")
  assert.doesNotMatch(d, /https?:\/\/|href=/, f + ": no external assets, no navigation")
}
assert.match(read("demo.tsx"), /<GildedLotusPreloader loop \/>/, "default demo is the bare looping component")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo must not wrap the component")
assert.match(read("demo-ivory.tsx"), /progress=\{loaded\}/, "one demo drives real progress")
assert.match(read("demo-noir.tsx"), /preset="noir"/, "one demo shows the dark preset")
assert.ok(
  tsconfig.includes('"@/components/ui/gilded-lotus-preloader": ["./components/gilded-lotus-preloader/gilded-lotus-preloader.tsx"]'),
  "tsconfig maps the canonical import",
)

console.log("gilded-lotus-preloader: ok")
