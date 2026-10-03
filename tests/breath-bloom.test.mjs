// Runnable check for the breathing math in components/breath-bloom, plus the
// install-safety rules the .tsx has to keep.
// Run: node tests/breath-bloom.test.mjs
//
// What fails silently here is timing: an easing that drifts from CSS's
// cubic-bezier, an alternate loop that jumps at the turn, a pointer mapping
// that leaves the box, a damper that overshoots on a slow frame.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(new URL("../components/breath-bloom/breath-bloom.tsx", import.meta.url), "utf8")

const start = src.indexOf("// #region bloom")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "bloom region markers missing")

const js = src
  .slice(start, end)
  .replace(/:\s*(BloomKey\[\]|BloomPose|Ease|Range|number \| "auto"|number)(?=[,)\s={])/g, "")
const { cubicBezier, sampleKeys, breathAt, pointerPose, damp, petalTransform, petalSize } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

const near = (a, b, eps = 1e-4) => Math.abs(a - b) < eps

// ---- easing matches CSS --------------------------------------------------------
{
  const linear = cubicBezier(0, 0, 1, 1)
  for (let x = 0; x <= 1; x += 0.05) assert.ok(near(linear(x), x), `linear at ${x}`)
  const e = cubicBezier(0.8, 0, 0.2, 1)
  assert.equal(e(0), 0)
  assert.equal(e(1), 1)
  assert.ok(near(e(0.5), 0.5), "the reference curve is symmetric")
  for (let x = 0.05; x < 1; x += 0.05) assert.ok(near(e(x) + e(1 - x), 1), `symmetry at ${x}`)
  assert.ok(e(0.2) < 0.05, "slow start: the breath gathers before it moves")
  // CSS ease = cubic-bezier(0.25, 0.1, 0.25, 1); known value at 0.5 ≈ 0.8024
  assert.ok(near(cubicBezier(0.25, 0.1, 0.25, 1)(0.5), 0.8024, 2e-3), "ease at 0.5")
  let prev = -1
  for (let x = 0; x <= 1; x += 0.01) {
    const v = e(x)
    assert.ok(v >= prev - 1e-9, "monotonic for monotonic y")
    prev = v
  }
}

// ---- keyframes -----------------------------------------------------------------
const KEYS = [
  { at: 0, amplitude: 1.5, scale: 1 },
  { at: 0.5, amplitude: 1, scale: 3 },
  { at: 1, amplitude: 1.5, scale: 3 },
]
{
  const ease = cubicBezier(0.8, 0, 0.2, 1)
  assert.deepEqual(sampleKeys(KEYS, 0, ease), { amplitude: 1.5, scale: 1 })
  assert.deepEqual(sampleKeys(KEYS, 0.5, ease), { amplitude: 1, scale: 3 })
  assert.deepEqual(sampleKeys(KEYS, 1, ease), { amplitude: 1.5, scale: 3 })
  assert.deepEqual(sampleKeys(KEYS, -1, ease), { amplitude: 1.5, scale: 1 }, "clamps before")
  assert.deepEqual(sampleKeys(KEYS, 2, ease), { amplitude: 1.5, scale: 3 }, "clamps after")
  const mid = sampleKeys(KEYS, 0.25, ease)
  assert.ok(near(mid.amplitude, 1.25) && near(mid.scale, 2), "segment midpoint")
  assert.deepEqual(sampleKeys([], 0.3, ease), { amplitude: 0, scale: 1 }, "no keys is a valid flower")
}

// ---- the breath loops there and back without a seam ----------------------------
{
  const d = 4
  assert.deepEqual(breathAt(0, d), { x: 0, stage: 0 })
  assert.equal(breathAt(1, d).stage, 0, "first quarter breathes in")
  assert.equal(breathAt(3, d).stage, 1, "then holds")
  assert.equal(breathAt(5, d).stage, 1, "holds on the way back")
  assert.equal(breathAt(7, d).stage, 2, "then breathes out")
  assert.ok(near(breathAt(4, d).x, 1) && near(breathAt(8, d).x, 0), "turns at the ends")
  let prev = breathAt(0, d).x
  for (let t = 0.01; t < 40; t += 0.01) {
    const { x } = breathAt(t, d)
    assert.ok(x >= 0 && x <= 1)
    assert.ok(Math.abs(x - prev) < 0.01, `jump at t=${t}`)
    prev = x
  }
  assert.ok(breathAt(-1, d).x >= 0, "negative time is still on the loop")
  assert.ok(Number.isFinite(breathAt(3, 0).x), "a zero duration cannot divide by zero")
}

// ---- pointer mapping stays in range ---------------------------------------------
{
  assert.deepEqual(pointerPose(0, 0, [0, 5], [0.15, 8]), { amplitude: 0, scale: 0.15 })
  assert.deepEqual(pointerPose(1, 1, [0, 5], [0.15, 8]), { amplitude: 5, scale: 8 })
  assert.deepEqual(pointerPose(-2, 9, [0, 5], [0.15, 8]), { amplitude: 0, scale: 8 }, "clamped to the box")
  assert.equal(pointerPose(0.5, 0.5, [0, 4], [0, 2]).amplitude, 2)
}

// ---- damping converges and never overshoots -------------------------------------
{
  let v = 0
  for (let i = 0; i < 600; i++) {
    const next = damp(v, 10, 7, 1 / 60)
    assert.ok(next >= v && next <= 10, "monotone, no overshoot")
    v = next
  }
  assert.ok(near(v, 10, 1e-3), "converges")
  assert.ok(damp(0, 10, 7, 5) <= 10, "a huge frame lands, it does not overshoot")
  assert.equal(damp(0, 10, 0, 1 / 60), 10, "follow 0 snaps")
  // Same wall-clock time, different frame rates, same place.
  let a = 0, b = 0
  for (let i = 0; i < 30; i++) a = damp(a, 1, 7, 1 / 30)
  for (let i = 0; i < 60; i++) b = damp(b, 1, 7, 1 / 60)
  assert.ok(near(a, b, 1e-9), "frame-rate independent")
}

// ---- petal placement ------------------------------------------------------------
{
  const t = petalTransform(0, 6, 0, 17, { amplitude: 1.5, scale: 2 }, 100)
  assert.equal(t, "translate(150.00px, 0.00px) scale(2.0000) rotate(17.00deg)")
  const up = petalTransform(1, 4, 0, 0, { amplitude: 1, scale: 1 }, 100)
  assert.match(up, /^translate\(0\.00px, -100\.00px\)/, "90° is up — screen y is flipped")
  assert.match(petalTransform(0, 6, 0, 0, { amplitude: 1, scale: -3 }, 100), /scale\(0\.0000\)/, "no mirrored petals")
  assert.doesNotThrow(() => petalTransform(0, 0, 0, 0, { amplitude: 1, scale: 1 }, 100))
  assert.doesNotMatch(petalTransform(3, 7, 33, 17, { amplitude: 2.2, scale: 1.3 }, 88), /NaN|e[-+]/)
}

// ---- auto size --------------------------------------------------------------------
assert.equal(petalSize(80, 10, 10), 80, "a number is taken as given")
assert.equal(petalSize("auto", 1600, 800), 104)
assert.equal(petalSize("auto", 200, 200), 36, "floor on tiny boxes")
assert.equal(petalSize("auto", 4000, 4000), 140, "ceiling on huge boxes")
assert.equal(petalSize("auto", 0, 0), 100, "unmeasured box falls back")

// ---- defaults are the reference ---------------------------------------------------
assert.ok(src.includes('stops: ["oklch(0.1186 0.0248 260.66)", "oklch(0.3133 0.1419 260.73)", "oklch(0.6061 0.2122 260.66)"]'))
assert.ok(src.includes("easing: [0.8, 0, 0.2, 1]"))
assert.ok(src.includes("duration: 4.01"))
assert.ok(src.includes('background: "#0d0f1e"'))
{
  const presets = src.slice(src.indexOf("export const BLOOM_PRESETS"), src.indexOf("satisfies Record"))
  for (const m of presets.matchAll(/stops: \[([^\]]+)\]/g)) {
    assert.equal(m[1].split('", "').length, 3, "every preset gives three stops")
  }
}

// ---- install safety ---------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import|@property/, "no @import, no global @property registrations")
assert.doesNotMatch(src, /<style/, "no stylesheet needed — transforms are written per frame")
assert.doesNotMatch(src, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")
assert.doesNotMatch(src, /innerWidth|innerHeight|document\.body\.addEventListener/, "the box, not the window")
assert.ok(src.includes("getBoundingClientRect"), "pointer is relative to the component")
assert.ok(src.includes("new ResizeObserver") && src.includes("new IntersectionObserver"))
for (const gone of ["cancelAnimationFrame(raf)", "observer.disconnect()", "io.disconnect()", 'removeEventListener("change"', 'removeEventListener("visibilitychange"']) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}
assert.ok(src.includes("prefers-reduced-motion"), "must read prefers-reduced-motion")
assert.ok(src.includes("motion-reduce:"), "label transitions honour reduced motion")

assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
const root = src.slice(src.indexOf("<section"), src.indexOf("<div ref={stageRef}"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")
assert.ok(src.includes("pointer-events-none relative z-10"), "overlay passes the pointer through")
assert.ok(src.includes("closest?.(CONTROLS)"), "clicks on overlay controls do not pin")

for (const name of ["demo.tsx", "demo-studio.tsx"]) {
  const demo = readFileSync(new URL(`../components/breath-bloom/${name}`, import.meta.url), "utf8")
  assert.ok(demo.includes('from "@/components/ui/breath-bloom"'), `${name} imports the installed path`)
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) {
    if (!/\brelative\b/.test(cls)) continue
    assert.ok(/w-(full|screen|\[|\d)/.test(cls) || /max-w-/.test(cls), `${name}: ${cls} has no width`)
  }
}

console.log("breath-bloom: ok")
