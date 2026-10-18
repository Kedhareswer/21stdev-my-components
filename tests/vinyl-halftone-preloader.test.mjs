// Install-safety, layout and timeline checks for vinyl-halftone-preloader.
// Run: node tests/vinyl-halftone-preloader.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/vinyl-halftone-preloader/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("vinyl-halftone-preloader.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import/, "no @import")
for (const url of src.matchAll(/https?:\/\/[^"'\s)]+/g))
  assert.match(url[0], /^https:\/\/fonts\.googleapis\.com\//, "only the font stylesheet is fetched: " + url[0])
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="progressbar"') && src.includes("aria-valuenow="), "reports progress to assistive tech")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.ok(src.includes("max-width: none"), "canvas guards Preflight's img/canvas max-width")
assert.ok(/budget/.test(src) && /swiftshader\|llvmpipe\|software/.test(src), "GL holds a pixel budget and spots software GPUs")
assert.doesNotMatch(src, /loseContext\(\)/, "no loseContext in cleanup: StrictMode remounts would get a dead context")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
for (const f of ["demo.tsx", "demo-click.tsx"]) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]).filter((m) => m !== "react")
  assert.deepEqual(di, ["@/components/ui/vinyl-halftone-preloader"], f + ": imports only the component")
  assert.doesNotMatch(d, /https?:\/\//, f + ": no external assets")
}
assert.match(read("demo.tsx"), /<VinylHalftonePreloader loop>/, "default demo is the looping component")
assert.match(read("demo-click.tsx"), /enter="click"/, "click demo waits for a press")

// ---- scoped CSS ----
const css = src.match(/const VHP_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".vhp-")), "unscoped selector: " + sel)
}

// ---- logic ----
const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion\n", a)
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

assert.equal(L.vhpSimulated(0), 0, "starts at 0")
assert.equal(L.vhpSimulated(1), 100, "ends at exactly 100")
assert.equal(L.vhpSimulated(-1), 0)
assert.equal(L.vhpSimulated(3), 100)
let prev = -1
for (let i = 0; i < 1000; i++) {
  const v = L.vhpSimulated(i / 1000)
  assert.ok(v >= prev - 1e-9, "the simulated load never runs backwards (t=" + i / 1000 + ")")
  assert.ok(v >= 0 && v < 100, "only t = 1 reaches 100")
  prev = v
}

// Stages: one lit at a time, in order, the last only at 100.
assert.equal(L.vhpStage(0, 4), 0)
assert.equal(L.vhpStage(32, 4), 0)
assert.equal(L.vhpStage(34, 4), 1)
assert.equal(L.vhpStage(99.9, 4), 2, "the way in stays dark until 100")
assert.equal(L.vhpStage(100, 4), 3)
assert.equal(L.vhpStage(50, 1), 0, "a single stage is always lit")
assert.equal(L.vhpStage(50, 2), 0)
assert.equal(L.vhpStage(100, 2), 1)
let last = 0
for (let p = 0; p <= 100; p += 0.5) {
  const s = L.vhpStage(p, 6)
  assert.ok(s >= last && s <= 5, "stages only step forward")
  last = s
}

// The platter spins up from rest and settles at 33⅓.
assert.equal(L.vhpRpm(0), 0)
assert.ok(Math.abs(L.vhpRpm(40) - 33.333) < 1e-3)
assert.ok(Math.abs(L.vhpRpm(100) - 33.333) < 1e-3)
assert.ok(L.vhpRpm(10) < L.vhpRpm(20))

// The needle walks inward, staying on the vinyl.
const rl = 300, rv = 400
assert.ok(L.vhpNeedle(0, rl, rv) < rv && L.vhpNeedle(0, rl, rv) > L.vhpNeedle(100, rl, rv))
assert.ok(L.vhpNeedle(100, rl, rv) > rl)
assert.equal(L.vhpNeedle(150, rl, rv), L.vhpNeedle(100, rl, rv), "clamped past 100")

// The beat hits at 1 and decays.
assert.equal(L.vhpBeat(0, 120), 1)
assert.ok(L.vhpBeat(250, 120) < 0.3)
assert.ok(Math.abs(L.vhpBeat(500, 120) - 1) < 1e-9, "120 BPM hits every 500ms")
assert.ok(L.vhpBeat(100, 0) <= 1, "nonsense tempo still yields an envelope")

assert.ok(Math.abs(L.vhpAngleDelta(0.1, -0.1) - 0.2) < 1e-9)
assert.ok(Math.abs(L.vhpAngleDelta(-3.1, 3.1) - (2 * Math.PI - 6.2)) < 1e-9, "wraps across ±π")

assert.equal(L.vhpPad(0), "000")
assert.equal(L.vhpPad(7.9), "007")
assert.equal(L.vhpPad(64), "064")
assert.equal(L.vhpPad(140), "100")

assert.deepEqual(L.vhpRGB("#fff", [0, 0, 0]), [1, 1, 1])
assert.deepEqual(L.vhpRGB("#000000", [1, 1, 1]), [0, 0, 0])
assert.deepEqual(L.vhpRGB("tomato", [0.5, 0.5, 0.5]), [0.5, 0.5, 0.5], "non-hex falls back")

// Layout: everything on the stage, the label clean, the stages inside the frame.
for (const [w, h] of [[1440, 810], [1920, 1080], [2560, 1080], [1024, 768], [768, 1024], [390, 844], [320, 568]]) {
  const y = L.vhpLayout(w, h, 4)
  const tag = w + "x" + h
  assert.ok(y.rl < y.rv && y.hole < y.rl * 0.2, tag + ": label sits inside the vinyl")
  assert.ok(y.sx >= 0 && y.sx <= w && y.sy >= 0 && y.sy <= h, tag + ": spindle on the stage")
  assert.ok(y.bx > 0 && y.bx < w && y.by > 0 && y.by < h, tag + ": burst on the stage")
  assert.ok(y.mx >= 0 && y.my >= 0, tag + ": first stage inside the frame")
  assert.ok(y.mx + 3 * y.dx + y.fs * 2.3 <= w + 1, tag + ": last stage fits across")
  assert.ok(y.my + 3 * y.dy + y.fs <= h, tag + ": last stage fits down")
  assert.ok(y.cell >= 4 && y.cell <= 10, tag + ": dot screen stays legible")
  assert.equal(y.portrait, w < h * 0.9, tag + ": orientation")
}
assert.doesNotThrow(() => L.vhpLayout(0, 0, 0), "a zero-size stage does not throw")

console.log("vinyl-halftone-preloader: ok")
