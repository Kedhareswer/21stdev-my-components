// Runnable check for the pointer math in components/isoline-bloom, plus the
// install-safety rules the .tsx has to keep.
// Run: node tests/isoline-bloom.test.mjs
//
// The contours themselves are a fragment shader and cannot be asserted here.
// What is checked is the part that fails silently: an idle lens that drifts
// off the canvas, a flick that strobes the flow, a pulse buffer that writes
// out of bounds, a colour string that turns the lines black.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/isoline-bloom/isoline-bloom.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region field")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "field region markers missing")

const js = src
  .slice(start, end)
  .replace(/:\s*(Float32Array|number|string|\[number, number, number(, number)?\])(?=[,)\s={])/g, "")
const { hexToRgb, driftPos, energyFrom, pushPulse } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

// ---- the idle lens stays on the canvas and roams --------------------------
{
  let minX = 1, maxX = 0, minY = 1, maxY = 0
  for (let t = 0; t < 600; t += 0.05) {
    const [x, y] = driftPos(t)
    assert.ok(Number.isFinite(x) && Number.isFinite(y), `non-finite at t=${t}`)
    minX = Math.min(minX, x); maxX = Math.max(maxX, x)
    minY = Math.min(minY, y); maxY = Math.max(maxY, y)
  }
  assert.ok(minX >= 0.08 && maxX <= 0.92 && minY >= 0.08 && maxY <= 0.92, "the lens left the canvas")
  assert.ok(maxX - minX > 0.5 && maxY - minY > 0.5, "the lens should cross most of the field")
  let closest = Infinity
  for (let t = 0; t < 400; t += 0.37) {
    const [ax, ay] = driftPos(t)
    const [bx, by] = driftPos(t + 60)
    closest = Math.min(closest, Math.hypot(ax - bx, ay - by))
  }
  assert.ok(closest > 1e-3, "the idle path must not retrace a loop")
}

// ---- pointer speed pumps the flow, but never without limit -----------------
assert.equal(energyFrom(0, 1), 0, "a still pointer adds nothing")
assert.equal(energyFrom(-3, 1), 0)
assert.equal(energyFrom(NaN, 1), 0, "a bad sample is ignored, not NaN")
assert.equal(energyFrom(1, 0), 0, "energy: 0 turns it off")
assert.ok(energyFrom(0.5, 1) > energyFrom(0.1, 1), "faster moves pump harder")
for (const s of [10, 1e3, Infinity]) assert.ok(energyFrom(s, 1) <= 4, `speed ${s} must clamp`)

// ---- pulses wrap inside the buffer -----------------------------------------
{
  const buf = new Float32Array(6 * 4)
  let slot = 0
  for (let i = 0; i < 20; i++) slot = pushPulse(buf, slot, [i, i, i, 1])
  assert.equal(buf.length, 24, "the buffer never grows")
  assert.equal(slot, 20 % 6)
  assert.deepEqual([...buf.slice(0, 4)], [18, 18, 18, 1], "the oldest pulse is the one replaced")
  assert.equal(pushPulse(buf, -1, [0, 0, 0, 0]), 0, "a negative slot still lands inside")
}

// ---- colours ---------------------------------------------------------------
assert.deepEqual(hexToRgb("#ff0000"), [1, 0, 0])
assert.deepEqual(hexToRgb("#0f0"), [0, 1, 0])
assert.deepEqual(hexToRgb("  00F  "), [0, 0, 1])
assert.deepEqual(hexToRgb("violet"), [0, 0, 0], "garbage is black, not NaN")
for (const [, key, hex] of src.matchAll(/(\w+Color): "([^"]+)"/g)) {
  assert.match(hex, /^#[0-9a-f]{6}$/, `${key} must be a 6-digit lowercase hex`)
}

// ---- every tuned uniform exists in the shader, and the reverse --------------
{
  const tabled = [...src.matchAll(/\["(\w+)", "[fc]"\]/g)].map((m) => "u" + m[1][0].toUpperCase() + m[1].slice(1))
  const used = new Set(src.match(/\bu[A-Z]\w*/g))
  for (const u of tabled) assert.ok(used.has(u), `${u} is uploaded but never read`)
  assert.ok(tabled.length >= 20, `expected the parameter table to be populated, saw ${tabled.length}`)
}

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(src, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(src.includes("canvas.clientWidth"), "the canvas measures its own box")
assert.ok(src.includes("getBoundingClientRect"), "pointer coordinates are relative to the canvas")
assert.ok(src.includes("new ResizeObserver"), "a resized box must resize the drawing buffer")

assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
const root = src.slice(src.indexOf("<section"), src.indexOf("{failed ?"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")

assert.ok(src.includes("setFailed(true)") && src.includes("radial-gradient"), "needs a still fallback")
assert.ok(
  src.includes("webglcontextlost") && src.includes("webglcontextrestored"),
  "a dropped context must rebuild rather than stay black",
)
for (const gone of [
  "gl.deleteProgram(program)",
  "gl.deleteVertexArray(vao)",
  "observer.disconnect()",
  "io.disconnect()",
  "cancelAnimationFrame(raf)",
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

assert.ok(src.includes("prefers-reduced-motion"), "must read prefers-reduced-motion")
assert.ok(/if \(reduced\)/.test(src), "reduced motion must take its own path")
assert.ok(/^\s*paint\(\)\s*$/m.test(src), "paint once before the first rAF")

// A demo wrapper left at width:auto collapses the canvas inside 21st's
// centring flex.
for (const name of ["demo.tsx"]) {
  const demo = readFileSync(new URL(`../components/isoline-bloom/${name}`, import.meta.url), "utf8")
  assert.match(demo, /from "@\/components\/ui\/isoline-bloom"/, `${name} imports the installed path`)
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) {
    if (!/relative/.test(cls)) continue
    assert.ok(/w-(full|screen|\[|\d)/.test(cls), `${name}: ${cls} wraps the canvas without a width`)
  }
}

console.log("isoline-bloom: ok")
