// Runnable check for the grid math in components/sunlit-cutting-mat, plus the
// install-safety rules the .tsx has to keep.
// Run: node tests/sunlit-cutting-mat.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/sunlit-cutting-mat/sunlit-cutting-mat.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region grid")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "grid region markers missing")
const js = src.slice(start, end).replace(/:\s*(number|string)(?=[,)])/g, "")
const { fitGrid, labelEvery, borderFor, hexToLinear } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

// ---- whole squares always fill the inner area exactly ---------------------
for (const span of [1, 50, 333, 1236, 2555]) {
  for (const unit of [0, 8, 32, 64]) {
    const { count, step } = fitGrid(span, unit)
    assert.ok(Number.isInteger(count) && count >= 1, `count ${count} for ${span}/${unit}`)
    assert.ok(Math.abs(count * step - span) < 1e-9, `grid overruns ${span}px`)
  }
}
// and never strays far from the requested size once there is room
{
  const { step } = fitGrid(1236, 32)
  assert.ok(Math.abs(step - 32) / 32 < 0.05, `step ${step} too far from 32`)
}

// ---- labels thin out before two-digit figures collide ---------------------
assert.equal(labelEvery(32), 1)
assert.equal(labelEvery(14), 2)
assert.equal(labelEvery(6), 5)

// ---- ruler border stays readable at any unit ------------------------------
for (const u of [1, 32, 500]) {
  const b = borderFor(u)
  assert.ok(b >= 16 && b <= 30, `border ${b} for unit ${u}`)
}

// ---- colour parsing -------------------------------------------------------
assert.deepEqual(hexToLinear("#fff"), [1, 1, 1])
assert.deepEqual(hexToLinear("nope"), [0, 0, 0])
assert.ok(hexToLinear("#808080")[0] < 0.25, "hex must be linearised, not passed as sRGB")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(src.includes("new ResizeObserver"), "a resized box must redraw the mat")
assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
const root = src.slice(src.indexOf("<section"), src.indexOf("</section>"))
assert.doesNotMatch(root.split("\n")[1], /\bh-(full|screen)\b/, "no percentage height on the root")
assert.ok(src.includes('maxWidth: "none"'), "Preflight's canvas max-width must be overridden")
assert.ok(src.includes("setFailed(true)"), "no WebGL2 must fall back, not paint an empty box")
assert.ok(src.includes("webglcontextrestored"), "a dropped context must rebuild")
assert.ok(/if \(reduced\) render\(T0\)/.test(src), "reduced motion paints one still frame")
for (const gone of [
  "gl.deleteProgram(program)",
  "gl.deleteTexture(texture)",
  "gl.deleteBuffer(buffer)",
  "gl.deleteVertexArray(vao)",
  "observer.disconnect()",
  "cancelAnimationFrame(raf)",
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

// Every uniform the shader declares is looked up by name.
for (const [, name] of src.matchAll(/^uniform\s+\w+\s+(u\w+);/gm)) {
  assert.ok(src.includes(`u("${name}")`), `uniform ${name} is never fed`)
}

// The demo wrapper needs a width or 21st's centring flex collapses it to 0px.
const demo = readFileSync(
  new URL("../components/sunlit-cutting-mat/demo.tsx", import.meta.url),
  "utf8",
)
assert.ok(/className="relative w-full"/.test(demo), "demo wrapper must be w-full")

console.log("sunlit-cutting-mat: ok")
