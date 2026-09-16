// Runnable check for the pointer/attract math in components/caustic-pool, plus
// the install-safety rules the .tsx has to keep.
// Run: node tests/caustic-pool.test.mjs
//
// The simulation itself lives on the GPU and cannot be asserted here, so what
// is checked is the part that decides *when and how hard* the water is hit —
// which is where the failures are silent: a brush that saturates, an attract
// path that drifts off the grid, an envelope that overshoots.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/caustic-pool/caustic-pool.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region ghost")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "ghost region markers missing")

const js = src.slice(start, end).replace(/:\s*(Brush|number)(?=[,)\s={])/g, "")
const { ghostPos, brushStrength, approach } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

// ---- the attract path stays on the water --------------------------------
{
  let minX = 1, maxX = 0, minY = 1, maxY = 0
  for (let t = 0; t < 600; t += 0.05) {
    const [x, y] = ghostPos(t, 4)
    assert.ok(Number.isFinite(x) && Number.isFinite(y), `non-finite at t=${t}`)
    minX = Math.min(minX, x); maxX = Math.max(maxX, x)
    minY = Math.min(minY, y); maxY = Math.max(maxY, y)
  }
  assert.ok(minX >= 0.06 - 1e-9 && maxX <= 0.94 + 1e-9, `x left the pool: ${minX}..${maxX}`)
  assert.ok(minY >= 0.06 - 1e-9 && maxY <= 0.94 + 1e-9, `y left the pool: ${minY}..${maxY}`)
  // It has to actually roam, not hover near the middle.
  assert.ok(maxX - minX > 0.5 && maxY - minY > 0.5, "the ghost should cross most of the pool")
}

// ---- and never retraces the same loop ------------------------------------
{
  // Frequencies that share a common multiple would make the path close, and a
  // closed path reads as a screensaver. Sample a long run against a fixed lag.
  let closest = Infinity
  for (let t = 0; t < 400; t += 0.37) {
    const [ax, ay] = ghostPos(t, 4)
    const [bx, by] = ghostPos(t + 60, 4)
    closest = Math.min(closest, Math.hypot(ax - bx, ay - by))
  }
  assert.ok(closest > 1e-3, `path repeats at a 60s lag (closest ${closest})`)
}

// ---- the brush never detonates the pool ----------------------------------
{
  const p = { brushBase: 0.012, brushGain: 0.9, brushMax: 0.09 }
  assert.equal(brushStrength(0, p), p.brushBase, "a still pointer barely dents the surface")
  assert.ok(brushStrength(0.05, p) > brushStrength(0.01, p), "faster pointers cut deeper")
  // A flick across the whole canvas must not exceed the ceiling.
  for (const d of [0.5, 1, 1.4, 50]) {
    assert.equal(brushStrength(d, p), p.brushMax, `distance ${d} must clamp to brushMax`)
  }
}

// ---- the attract envelope eases, and never overshoots ---------------------
{
  // Rising from 0 to 1 over `seconds` at a fixed step.
  let v = 0
  const step = 1 / 60
  const seconds = 1.5
  for (let i = 0; i < Math.round(seconds * 60); i++) v = approach(v, 1, step, seconds)
  assert.ok(Math.abs(v - 1) < 1e-9, `should arrive in ${seconds}s, got ${v}`)

  // One step can never jump past the target, from either side.
  assert.ok(approach(0, 1, 10, 0.1) <= 1 + 1e-9, "a huge step must not overshoot upward")
  assert.ok(approach(1, 0, 10, 0.1) >= -1e-9, "nor downward")
  assert.equal(approach(0.4, 0.4, step, seconds), 0.4, "at the target it stays put")
}

// ---- install safety ------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(src, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")

// The original sized itself from the window and read pointer coordinates
// against it. Inside a component that is wrong twice over: the canvas is not
// the viewport, and the box can move.
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(src.includes("canvas.clientWidth"), "the canvas measures its own box")
assert.ok(src.includes("getBoundingClientRect"), "pointer coordinates are relative to the canvas")
assert.ok(src.includes("new ResizeObserver"), "a resized box must resize the drawing buffer")

// A full-bleed piece still needs a definite height of its own.
assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
const root = src.slice(src.indexOf("<section"), src.indexOf("{failed ?"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")

// Float render targets are the technique; without them there is nothing to
// draw, so it must say so rather than paint a black rectangle.
assert.ok(src.includes("EXT_color_buffer_float"), "float targets must be feature-detected")
assert.ok(src.includes("EXT_color_buffer_half_float"), "half-float is the fallback worth taking")
assert.ok(src.includes("setFailed(true)") && src.includes("radial-gradient"), "needs a still fallback")
assert.ok(
  src.includes("webglcontextlost") && src.includes("webglcontextrestored"),
  "a dropped context must rebuild rather than stay black",
)

// Two programs, two textures, two framebuffers and a VAO are allocated per
// mount; a route change that leaks them exhausts the context in a few visits.
for (const gone of [
  "gl.deleteProgram(stepProgram)",
  "gl.deleteProgram(drawProgram)",
  "gl.deleteTexture(t.tex)",
  "gl.deleteFramebuffer(t.fbo)",
  "gl.deleteVertexArray(vao)",
  "observer.disconnect()",
  "cancelAnimationFrame(raf)",
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

// Motion is not optional: the water is the animation, so reduced motion has to
// park it after a single frame rather than merely slow it.
assert.ok(src.includes("usePrefersReducedMotion") || src.includes("prefers-reduced-motion"),
  "must read prefers-reduced-motion")
assert.ok(/if \(reduced\)/.test(src), "reduced motion must take its own path")

// The wave equation is only stable at the rate it was tuned for.
assert.ok(src.includes("maxSub"), "a stalled tab must not integrate one enormous step")

// Every uniform the shaders declare has to be fed, and every one fed has to
// exist: the tables generate both sides, so they must agree.
const declared = [...src.matchAll(/^uniform\s+\w+\s+u([A-Z]\w*);/gm)].map((m) => m[1])
const tabled = [...src.matchAll(/\["(\w+)",\s*"[fivc]"\]/g)].map(
  (m) => m[1][0].toUpperCase() + m[1].slice(1),
)
const fixed = ["State", "Texel", "Aspect", "DropCount", "Drops", "Resolution", "Time"]
for (const name of declared) {
  assert.ok(
    tabled.includes(name) || fixed.includes(name),
    `uniform u${name} is declared in a shader but nothing uploads it`,
  )
}
assert.ok(tabled.length > 40, `expected the parameter tables to be populated, saw ${tabled.length}`)

console.log("caustic-pool: ok")
